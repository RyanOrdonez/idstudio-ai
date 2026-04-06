/**
 * AI Proposal Generation Worker
 *
 * Pipeline:
 *  1. Fetch mood-board asset metadata from DB
 *  2. Call Claude API to generate structured proposal JSON
 *  3. Render proposal JSON → styled PDF using pdfkit
 *  4. Upload PDF to S3
 *  5. Create Asset (type: document) + update GeneratedProposal record
 *  6. Publish real-time `proposal:generated` event
 */

import Anthropic from "@anthropic-ai/sdk";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import PDFDocument from "pdfkit";
import { Worker, type Job } from "bullmq";
import { prisma } from "@ids/db";
import {
  AI_QUEUE_PROPOSAL_GENERATION,
  type ProposalGenerationJobData,
} from "@ids/types";
import { env } from "../config.js";
import { connection } from "../lib/redis.js";
import { trackCost } from "../lib/costTracker.js";
import { publishRealtime } from "../lib/publishRealtime.js";
import {
  PROPOSAL_GENERATION_SYSTEM_PROMPT,
  PROMPT_VERSION,
  buildProposalPrompt,
  buildRevisionPrompt,
} from "../prompts/v1/proposalGeneration.js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MODEL = "claude-sonnet-4-6";

// ---------------------------------------------------------------------------
// Lazy clients
// ---------------------------------------------------------------------------

let anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!anthropic) anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return anthropic;
}

let s3: S3Client | null = null;
function getS3(): S3Client {
  if (!s3) {
    s3 = new S3Client({
      region: env.S3_REGION,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3;
}

// ---------------------------------------------------------------------------
// PDF rendering
// ---------------------------------------------------------------------------

/** Colour palettes per template */
const TEMPLATES = {
  classic: {
    primary: "#2C2416",    // dark warm brown
    accent: "#C9A96E",     // warm gold
    light: "#F5F0E8",      // ivory
    muted: "#8A7B6A",      // warm grey-brown
    background: "#FFFDF9", // near-white warm
  },
  modern: {
    primary: "#1A1A1A",    // near-black
    accent: "#4A6FA5",     // cool blue
    light: "#F0F4F8",      // cool light grey
    muted: "#6B7280",      // neutral grey
    background: "#FFFFFF",
  },
  minimal: {
    primary: "#111111",    // almost black
    accent: "#D4A373",     // warm terracotta
    light: "#FAF9F7",      // very light cream
    muted: "#9CA3AF",      // soft grey
    background: "#FFFFFF",
  },
} as const;

type ProposalData = {
  coverPage?: {
    tagline?: string;
    date?: string;
    preparedFor?: string;
    preparedBy?: string;
  };
  executiveSummary?: { headline?: string; body?: string };
  designConcept?: {
    title?: string;
    description?: string;
    keyThemes?: string[];
  };
  scopeOfWork?: {
    overview?: string;
    phases?: Array<{
      name?: string;
      description?: string;
      deliverables?: string[];
    }>;
  };
  moodAndMaterials?: {
    palette?: { primary?: string; secondary?: string; accent?: string };
    materials?: Array<{ name?: string; usage?: string }>;
  };
  timeline?: {
    totalWeeks?: number;
    milestones?: Array<{ week?: number; title?: string; description?: string }>;
  };
  investmentSummary?: {
    disclaimer?: string;
    tiers?: Array<{ label?: string; estimateRange?: string }>;
  };
  nextSteps?: { callToAction?: string; steps?: string[] };
  closing?: { signatureBlock?: string };
};

/**
 * Render a ProposalData object to a PDF buffer using pdfkit.
 */
async function renderProposalPdf(
  data: ProposalData,
  projectTitle: string,
  template: "classic" | "modern" | "minimal",
): Promise<Buffer> {
  const palette = TEMPLATES[template];
  const PAGE_W = 595.28; // A4 points
  const MARGIN = 56;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      compress: true,
      info: {
        Title: projectTitle,
        Author: data.coverPage?.preparedBy ?? "Interior Design Studio",
        Creator: "IDS Platform",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ── Cover page ────────────────────────────────────────────────────────
    doc.rect(0, 0, PAGE_W, doc.page.height).fill(palette.primary);

    const coverMid = doc.page.height / 2;

    doc
      .fillColor(palette.accent)
      .fontSize(9)
      .font("Helvetica")
      .text((data.coverPage?.date ?? "").toUpperCase(), MARGIN, coverMid - 140, {
        width: CONTENT_W,
        align: "center",
        characterSpacing: 2,
      });

    doc
      .fillColor(palette.light)
      .fontSize(32)
      .font("Helvetica-Bold")
      .text(projectTitle, MARGIN, coverMid - 110, {
        width: CONTENT_W,
        align: "center",
      });

    if (data.coverPage?.tagline) {
      doc
        .fillColor(palette.accent)
        .fontSize(14)
        .font("Helvetica-Oblique")
        .text(data.coverPage.tagline, MARGIN, doc.y + 16, {
          width: CONTENT_W,
          align: "center",
        });
    }

    // Divider line
    doc
      .moveTo(MARGIN + CONTENT_W * 0.25, doc.y + 24)
      .lineTo(MARGIN + CONTENT_W * 0.75, doc.y + 24)
      .strokeColor(palette.accent)
      .lineWidth(0.75)
      .stroke();

    if (data.coverPage?.preparedFor) {
      doc
        .fillColor(palette.muted)
        .fontSize(10)
        .font("Helvetica")
        .text(`Prepared for  ${data.coverPage.preparedFor}`, MARGIN, doc.y + 36, {
          width: CONTENT_W,
          align: "center",
        });
    }

    if (data.coverPage?.preparedBy) {
      doc
        .fillColor(palette.muted)
        .fontSize(10)
        .font("Helvetica")
        .text(data.coverPage.preparedBy, MARGIN, doc.y + 6, {
          width: CONTENT_W,
          align: "center",
        });
    }

    // ── Helper functions ──────────────────────────────────────────────────
    function newSection(title: string) {
      doc.addPage();
      doc.rect(0, 0, PAGE_W, 6).fill(palette.accent);
      doc
        .fillColor(palette.primary)
        .fontSize(9)
        .font("Helvetica")
        .text(title.toUpperCase(), MARGIN, 28, {
          width: CONTENT_W,
          align: "left",
          characterSpacing: 2,
        });
      doc
        .moveTo(MARGIN, doc.y + 6)
        .lineTo(PAGE_W - MARGIN, doc.y + 6)
        .strokeColor(palette.accent)
        .lineWidth(0.5)
        .stroke();
      doc.moveDown(1.5);
    }

    function sectionHeadline(text: string) {
      doc
        .fillColor(palette.primary)
        .fontSize(22)
        .font("Helvetica-Bold")
        .text(text, MARGIN, doc.y, { width: CONTENT_W });
      doc.moveDown(0.6);
    }

    function bodyText(text: string) {
      doc
        .fillColor(palette.primary)
        .fontSize(10.5)
        .font("Helvetica")
        .text(text, MARGIN, doc.y, { width: CONTENT_W, lineGap: 3 });
      doc.moveDown(0.8);
    }

    function subheading(text: string) {
      doc
        .fillColor(palette.accent)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(text, MARGIN, doc.y, { width: CONTENT_W });
      doc.moveDown(0.4);
    }

    function bullet(text: string) {
      const bx = MARGIN + 12;
      doc
        .fillColor(palette.accent)
        .circle(MARGIN + 4, doc.y + 5, 2)
        .fill();
      doc
        .fillColor(palette.muted)
        .fontSize(10)
        .font("Helvetica")
        .text(text, bx, doc.y, { width: CONTENT_W - 12, lineGap: 2 });
      doc.moveDown(0.3);
    }

    function accentBox(text: string) {
      const bh = 36;
      doc.rect(MARGIN, doc.y, CONTENT_W, bh).fill(palette.light);
      doc
        .fillColor(palette.primary)
        .fontSize(10)
        .font("Helvetica-Oblique")
        .text(text, MARGIN + 12, doc.y - bh + 12, { width: CONTENT_W - 24 });
      doc.moveDown(1.2);
    }

    // ── Executive Summary ─────────────────────────────────────────────────
    if (data.executiveSummary) {
      newSection("Executive Summary");
      if (data.executiveSummary.headline) {
        sectionHeadline(data.executiveSummary.headline);
      }
      if (data.executiveSummary.body) {
        bodyText(data.executiveSummary.body);
      }
    }

    // ── Design Concept ─────────────────────────────────────────────────────
    if (data.designConcept) {
      newSection("Design Concept");
      if (data.designConcept.title) {
        sectionHeadline(data.designConcept.title);
      }
      if (data.designConcept.description) {
        bodyText(data.designConcept.description);
      }
      if (data.designConcept.keyThemes?.length) {
        subheading("Key Themes");
        for (const theme of data.designConcept.keyThemes) {
          bullet(theme);
        }
      }
    }

    // ── Mood & Materials ──────────────────────────────────────────────────
    if (data.moodAndMaterials) {
      newSection("Mood & Materials");
      const { palette: cp, materials } = data.moodAndMaterials;

      if (cp) {
        subheading("Colour Palette");
        if (cp.primary)   accentBox(`Primary — ${cp.primary}`);
        if (cp.secondary) accentBox(`Secondary — ${cp.secondary}`);
        if (cp.accent)    accentBox(`Accent — ${cp.accent}`);
      }

      if (materials?.length) {
        subheading("Materials & Finishes");
        for (const m of materials) {
          if (m.name) {
            doc
              .fillColor(palette.primary)
              .fontSize(10.5)
              .font("Helvetica-Bold")
              .text(`${m.name}  `, MARGIN, doc.y, { continued: true });
            doc
              .fillColor(palette.muted)
              .font("Helvetica")
              .text(m.usage ?? "", { width: CONTENT_W });
            doc.moveDown(0.4);
          }
        }
      }
    }

    // ── Scope of Work ──────────────────────────────────────────────────────
    if (data.scopeOfWork) {
      newSection("Scope of Work");
      if (data.scopeOfWork.overview) {
        bodyText(data.scopeOfWork.overview);
      }
      for (const phase of data.scopeOfWork.phases ?? []) {
        if (phase.name) subheading(phase.name);
        if (phase.description) bodyText(phase.description);
        for (const d of phase.deliverables ?? []) bullet(d);
        doc.moveDown(0.5);
      }
    }

    // ── Timeline ───────────────────────────────────────────────────────────
    if (data.timeline) {
      newSection("Project Timeline");
      if (data.timeline.totalWeeks) {
        bodyText(`Estimated duration: ${data.timeline.totalWeeks} weeks`);
      }
      for (const m of data.timeline.milestones ?? []) {
        subheading(`Week ${m.week ?? "?"} — ${m.title ?? ""}`);
        if (m.description) bodyText(m.description);
      }
    }

    // ── Investment Summary ─────────────────────────────────────────────────
    if (data.investmentSummary) {
      newSection("Investment Summary");
      if (data.investmentSummary.disclaimer) {
        doc
          .fillColor(palette.muted)
          .fontSize(9)
          .font("Helvetica-Oblique")
          .text(data.investmentSummary.disclaimer, MARGIN, doc.y, {
            width: CONTENT_W,
          });
        doc.moveDown(0.8);
      }
      for (const tier of data.investmentSummary.tiers ?? []) {
        doc
          .fillColor(palette.primary)
          .fontSize(11)
          .font("Helvetica-Bold")
          .text(tier.label ?? "", MARGIN, doc.y, { continued: true, width: CONTENT_W * 0.6 });
        doc
          .fillColor(palette.accent)
          .font("Helvetica")
          .text(tier.estimateRange ?? "", { align: "right" });
        doc
          .moveTo(MARGIN, doc.y + 2)
          .lineTo(PAGE_W - MARGIN, doc.y + 2)
          .strokeColor(palette.light)
          .lineWidth(0.5)
          .stroke();
        doc.moveDown(0.6);
      }
    }

    // ── Next Steps ─────────────────────────────────────────────────────────
    if (data.nextSteps) {
      newSection("Next Steps");
      if (data.nextSteps.callToAction) {
        bodyText(data.nextSteps.callToAction);
      }
      for (let i = 0; i < (data.nextSteps.steps ?? []).length; i++) {
        const step = data.nextSteps.steps![i];
        doc
          .fillColor(palette.accent)
          .fontSize(11)
          .font("Helvetica-Bold")
          .text(`${i + 1}.`, MARGIN, doc.y, { continued: true });
        doc
          .fillColor(palette.primary)
          .font("Helvetica")
          .fontSize(10.5)
          .text(`  ${step}`, { width: CONTENT_W - 20 });
        doc.moveDown(0.4);
      }
    }

    // ── Closing ────────────────────────────────────────────────────────────
    if (data.closing?.signatureBlock) {
      doc.addPage();
      doc.rect(0, 0, PAGE_W, doc.page.height).fill(palette.primary);
      doc
        .fillColor(palette.accent)
        .fontSize(13)
        .font("Helvetica-Oblique")
        .text(data.closing.signatureBlock, MARGIN, doc.page.height / 2 - 40, {
          width: CONTENT_W,
          align: "center",
        });
    }

    doc.end();
  });
}

// ---------------------------------------------------------------------------
// Upload helper
// ---------------------------------------------------------------------------

async function uploadPdfToS3(params: {
  tenantId: string;
  projectId: string;
  proposalId: string;
  buffer: Buffer;
}): Promise<{ url: string; s3Key: string }> {
  const { tenantId, projectId, proposalId, buffer } = params;
  const filename = `proposal-${proposalId}-${Date.now()}.pdf`;
  const s3Key = `${tenantId}/${projectId}/proposals/${filename}`;

  await getS3().send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: s3Key,
      Body: buffer,
      ContentType: "application/pdf",
      ContentLength: buffer.length,
      ContentDisposition: `inline; filename="${filename}"`,
    }),
  );

  const url = env.S3_CDN_URL
    ? `${env.S3_CDN_URL}/${s3Key}`
    : `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${s3Key}`;

  return { url, s3Key };
}

// ---------------------------------------------------------------------------
// Job processor
// ---------------------------------------------------------------------------

async function processProposalGeneration(
  job: Job<ProposalGenerationJobData>,
): Promise<void> {
  const {
    tenantId,
    projectId,
    proposalId,
    projectTitle,
    projectBrief,
    clientName,
    stylePreferences,
    moodBoardAssetIds,
    template,
    feedbackNote,
  } = job.data;

  // ── Step 1: resolve mood-board asset descriptions ─────────────────────────
  let moodBoardDescriptions: string[] = [];
  if (moodBoardAssetIds.length > 0) {
    const assets = await prisma.asset.findMany({
      where: { id: { in: moodBoardAssetIds }, tenantId, projectId, deletedAt: null },
      select: { id: true, filename: true, url: true },
    });
    moodBoardDescriptions = assets.map((a) => `${a.filename} (${a.url})`);
  }

  // ── Step 2: call Claude to generate structured proposal JSON ─────────────
  const userPrompt = feedbackNote
    ? buildRevisionPrompt({ projectTitle, projectBrief, clientName, feedbackNote })
    : buildProposalPrompt({ projectTitle, projectBrief, clientName, stylePreferences, moodBoardDescriptions });

  let rawContent = "";
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    const response = await getAnthropic().messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: PROPOSAL_GENERATION_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    rawContent =
      response.content[0]?.type === "text" ? response.content[0].text : "";
    inputTokens = response.usage.input_tokens;
    outputTokens = response.usage.output_tokens;
  } catch (err) {
    console.error(`[proposalGeneration] Claude API error on job ${job.id}:`, err);
    await prisma.generatedProposal.update({
      where: { id: proposalId },
      data: { status: "failed" },
    });
    throw err;
  }

  // ── Step 3: parse proposal JSON ───────────────────────────────────────────
  let proposalData: ProposalData;
  try {
    proposalData = JSON.parse(rawContent) as ProposalData;
  } catch {
    console.warn(`[proposalGeneration] JSON parse failed for job ${job.id}, attempting extraction`);
    // Attempt to extract JSON from Claude's response if wrapped in text
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      await prisma.generatedProposal.update({
        where: { id: proposalId },
        data: { status: "failed" },
      });
      throw new Error("Claude response contained no valid JSON");
    }
    proposalData = JSON.parse(jsonMatch[0]) as ProposalData;
  }

  // ── Step 4: render PDF ────────────────────────────────────────────────────
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderProposalPdf(proposalData, projectTitle, template);
  } catch (err) {
    console.error(`[proposalGeneration] PDF render error on job ${job.id}:`, err);
    await prisma.generatedProposal.update({
      where: { id: proposalId },
      data: { status: "failed" },
    });
    throw err;
  }

  // ── Step 5: upload to S3 ──────────────────────────────────────────────────
  const { url: pdfUrl } = await uploadPdfToS3({
    tenantId,
    projectId,
    proposalId,
    buffer: pdfBuffer,
  });

  // ── Step 6: create Asset record ───────────────────────────────────────────
  const filename = `proposal-v${job.data.feedbackNote ? "rev" : "1"}-${proposalId}.pdf`;
  const asset = await prisma.asset.create({
    data: {
      tenantId,
      projectId,
      type: "document",
      filename,
      mimeType: "application/pdf",
      url: pdfUrl,
      sizeBytes: pdfBuffer.length,
    },
  });

  // ── Step 7: update GeneratedProposal record ───────────────────────────────
  const updated = await prisma.generatedProposal.update({
    where: { id: proposalId },
    data: {
      status: "ready",
      assetId: asset.id,
      pdfUrl,
      proposalData,
    },
  });

  // ── Step 8: cost tracking ─────────────────────────────────────────────────
  await trackCost({
    tenantId,
    projectId,
    jobType: AI_QUEUE_PROPOSAL_GENERATION,
    model: MODEL,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
  });

  // ── Step 9: publish real-time event ──────────────────────────────────────
  await publishRealtime(
    {
      event: "proposal:generated",
      payload: {
        tenantId,
        projectId,
        proposalId: updated.id,
        assetId: asset.id,
        pdfUrl,
        version: updated.version,
        createdAt: updated.createdAt.toISOString(),
      },
    },
    tenantId,
    projectId,
  );

  console.info(
    `[proposalGeneration] job ${job.id} complete — proposal ${proposalId} v${updated.version}, asset ${asset.id}`,
  );
}

// ---------------------------------------------------------------------------
// Worker registration
// ---------------------------------------------------------------------------

export const proposalGenerationWorker = new Worker<ProposalGenerationJobData>(
  AI_QUEUE_PROPOSAL_GENERATION,
  processProposalGeneration,
  {
    connection,
    concurrency: env.WORKER_CONCURRENCY,
  },
);

proposalGenerationWorker.on("completed", (job) => {
  console.info(`[proposalGeneration] job ${job.id} completed`);
});

proposalGenerationWorker.on("failed", (job, err) => {
  console.error(`[proposalGeneration] job ${job?.id} failed:`, err.message);
});
