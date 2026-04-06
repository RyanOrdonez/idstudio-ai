export const PROMPT_VERSION = "v1";

/**
 * System context injected as the first user turn for all generation jobs.
 * Gemini Nano Banana 2 uses a single-turn content generation API, so
 * context is prepended to the user prompt rather than a separate system role.
 */
export const GEMINI_IMAGE_GENERATION_CONTEXT = `\
You are an expert interior design visualisation AI specialising in photorealistic room renders, style transfers, and mood board generation for professional interior designers. Your outputs must be high-quality, architecturally accurate, and aligned precisely with the design brief provided.

Design principles to always apply:
- Maintain correct perspective, scale, and proportions for the room type.
- Respect natural and artificial lighting conditions appropriate to the space.
- Ensure material textures are realistic and physically plausible.
- Apply the requested design style consistently across all elements.
- Avoid generic stock-photo aesthetics — every render should feel bespoke.
`.trim();

/**
 * Build a generation prompt for a concept render.
 * Produces a photorealistic room visualisation from a project brief.
 */
export function buildConceptRenderPrompt(params: {
  projectBrief: string;
  roomType: string;
  styleHints?: string;
}): string {
  const { projectBrief, roomType, styleHints } = params;
  return [
    GEMINI_IMAGE_GENERATION_CONTEXT,
    "",
    `Generate a photorealistic concept render of a ${roomType}.`,
    "",
    "Project brief:",
    projectBrief,
    styleHints ? `\nStyle references:\n${styleHints}` : "",
    "",
    "Requirements:",
    "- Render at high resolution with accurate lighting and shadows.",
    "- Show the full room from a natural interior perspective.",
    "- Include appropriate furniture, materials, and finishing details that match the brief.",
    "- The image should be suitable for client presentation.",
  ]
    .filter((line) => line !== undefined)
    .join("\n")
    .trim();
}

/**
 * Build a generation prompt for style transfer.
 * Applies a requested style vocabulary to an existing room concept.
 */
export function buildStyleTransferPrompt(params: {
  projectBrief: string;
  roomType: string;
  styleHints?: string;
}): string {
  const { projectBrief, roomType, styleHints } = params;
  return [
    GEMINI_IMAGE_GENERATION_CONTEXT,
    "",
    `Apply a style transfer to visualise a ${roomType} redesign.`,
    "",
    "Project brief:",
    projectBrief,
    styleHints ? `\nDesired style vocabulary:\n${styleHints}` : "",
    "",
    "Requirements:",
    "- Reinterpret the space using the style vocabulary from the brief.",
    "- Maintain the room's structural elements (walls, windows, floor layout).",
    "- Replace soft furnishings, finishes, and décor to reflect the new style.",
    "- The result should feel like a realistic redesign, not a filter.",
  ]
    .filter((line) => line !== undefined)
    .join("\n")
    .trim();
}

/**
 * Build a generation prompt for a mood board composite image.
 * Creates a curated collage of materials, colours, and textures.
 */
export function buildMoodBoardPrompt(params: {
  projectBrief: string;
  roomType: string;
  styleHints?: string;
}): string {
  const { projectBrief, roomType, styleHints } = params;
  return [
    GEMINI_IMAGE_GENERATION_CONTEXT,
    "",
    `Create a professional interior design mood board for a ${roomType}.`,
    "",
    "Project brief:",
    projectBrief,
    styleHints ? `\nStyle direction:\n${styleHints}` : "",
    "",
    "Requirements:",
    "- Present a curated grid of material swatches, colour palettes, furniture silhouettes, and texture close-ups.",
    "- Include 8–12 distinct elements arranged in a clean, editorial layout.",
    "- Use a consistent colour story that reflects the project brief.",
    "- Label each element category (e.g. 'Primary Fabric', 'Wall Finish', 'Accent Colour').",
    "- The mood board should be suitable for sharing with a client in a design presentation.",
  ]
    .filter((line) => line !== undefined)
    .join("\n")
    .trim();
}
