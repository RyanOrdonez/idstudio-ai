/**
 * Prompt definitions for the AI proposal generation worker.
 *
 * The worker calls Claude to produce a structured JSON proposal,
 * which is then rendered to a styled PDF and uploaded to S3.
 */

export const PROMPT_VERSION = "v1";

export const PROPOSAL_GENERATION_SYSTEM_PROMPT = `You are an expert interior design consultant who writes compelling, professional design proposals for high-end residential and commercial projects.

Your task is to generate a complete, structured design proposal in JSON format. The proposal must be polished, warm, and persuasive — matching the quality of a boutique interior design firm. Use editorial language that reflects creativity, expertise, and care for the client.

Return ONLY valid JSON — no markdown fences, no commentary. The JSON must conform exactly to the schema below.

Schema:
{
  "coverPage": {
    "tagline": "string — inspiring one-line tagline for the project",
    "date": "string — formatted date (e.g. 'April 2026')",
    "preparedFor": "string — client name",
    "preparedBy": "string — 'Your Design Studio'"
  },
  "executiveSummary": {
    "headline": "string — bold headline for the project vision (max 12 words)",
    "body": "string — 2–3 paragraphs describing the project vision and approach. Warm, editorial tone."
  },
  "designConcept": {
    "title": "string — concept title (e.g. 'Warm Modernism Meets Nordic Calm')",
    "description": "string — detailed description of the design concept (3–4 paragraphs)",
    "keyThemes": ["string"] // 3–5 short design themes or motifs
  },
  "scopeOfWork": {
    "overview": "string — brief overview of what is included",
    "phases": [
      {
        "name": "string — phase name",
        "description": "string — what happens in this phase",
        "deliverables": ["string"] // bullet points
      }
    ]
  },
  "moodAndMaterials": {
    "palette": {
      "primary": "string — primary colour description (e.g. 'Warm Ivory — a soft, creamy off-white')",
      "secondary": "string — secondary colour",
      "accent": "string — accent colour"
    },
    "materials": [
      {
        "name": "string — material name",
        "usage": "string — where / how it is used"
      }
    ],
    "typography": {
      "headline": "Playfair Display",
      "body": "Inter"
    }
  },
  "timeline": {
    "totalWeeks": "number",
    "milestones": [
      {
        "week": "number",
        "title": "string",
        "description": "string"
      }
    ]
  },
  "investmentSummary": {
    "disclaimer": "string — brief note that final figures are estimates pending scope confirmation",
    "tiers": [
      {
        "label": "string — e.g. 'Design Fee'",
        "estimateRange": "string — e.g. '$8,000 – $12,000'"
      }
    ]
  },
  "nextSteps": {
    "callToAction": "string — warm, friendly paragraph inviting the client to proceed",
    "steps": ["string"] // 3–4 clear next steps
  },
  "closing": {
    "signatureBlock": "string — warm closing sentence from the designer"
  }
}`;

/**
 * Build the user prompt for initial proposal generation.
 */
export function buildProposalPrompt(params: {
  projectTitle: string;
  projectBrief: string;
  clientName?: string;
  stylePreferences?: string;
  moodBoardDescriptions?: string[];
}): string {
  const lines: string[] = [
    `Project title: ${params.projectTitle}`,
    `Project brief: ${params.projectBrief}`,
  ];

  if (params.clientName) {
    lines.push(`Client name: ${params.clientName}`);
  }

  if (params.stylePreferences) {
    lines.push(`Style preferences: ${params.stylePreferences}`);
  }

  if (params.moodBoardDescriptions && params.moodBoardDescriptions.length > 0) {
    lines.push(
      `Mood board reference images (${params.moodBoardDescriptions.length} images):`,
      ...params.moodBoardDescriptions.map((d, i) => `  ${i + 1}. ${d}`),
    );
  }

  lines.push(
    "",
    "Generate a complete, publication-quality design proposal as described. Return only the JSON object.",
  );

  return lines.join("\n");
}

/**
 * Build the user prompt for a revision request.
 */
export function buildRevisionPrompt(params: {
  projectTitle: string;
  projectBrief: string;
  clientName?: string;
  feedbackNote: string;
}): string {
  return [
    `Project title: ${params.projectTitle}`,
    `Project brief: ${params.projectBrief}`,
    params.clientName ? `Client name: ${params.clientName}` : null,
    "",
    `Designer feedback / revision request:`,
    params.feedbackNote,
    "",
    "Please regenerate the proposal incorporating this feedback. Return only the JSON object.",
  ]
    .filter((l) => l !== null)
    .join("\n");
}
