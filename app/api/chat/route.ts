import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import {
  MODEL_CONFIG,
  getCreditStatus,
  canAfford,
  deductCredits,
  type ModelTier,
} from '@/lib/credits'
import { TOOL_DEFINITIONS, executeTool } from '@/lib/aiTools'
import {
  checkRateLimit,
  rateLimitResponse,
  sanitizeUserMessage,
  validateStringLength,
} from '@/lib/apiSecurity'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Shared knowledge block injected into all system prompts
const ENTITY_REFERENCE = `
## Database Entity Reference

### Client Fields
- name (REQUIRED) — Full name, e.g. "Sarah Johnson"
- email — Email address
- phone — Phone number
- address — Full mailing address
- notes — Design preferences, style notes, referral source

### Project Fields
- project_name (REQUIRED) — Descriptive name, e.g. "Kitchen Remodel"
- client_name (auto-filled from client) — Client's name
- notes — Scope, style preferences, special requirements
- budget — Dollar amount
- street_address — Project site address
- city — City
- state — State abbreviation (e.g. "NC")
- zipcode — ZIP code

### Clipped Product Fields
- product_name (REQUIRED) — Product name, e.g. "Harmony Sofa"
- brand — Brand name, e.g. "West Elm"
- url — Product page URL
- price — Price as number
- category — furniture, seating, tables, lighting, textiles, rugs, window_treatments, wall_decor, accessories, hardware, plumbing, tile, flooring, countertops, paint, wallpaper, outdoor, other
- retailer — Store/retailer name
- notes — Designer notes
- project_id — Assign to a specific project

## Rules
1. ALWAYS call list_clients before create_client to prevent duplicates.
2. If a client already exists, use update_client instead of create_client.
3. ALWAYS call list_clients before create_project to get the client_id.
4. When creating with partial info, proceed with what you have and tell the user which fields are missing.
5. Extract as much info as possible from the user's message — names, emails, phones, addresses, project details.
6. For complex workflows (proposals, mood boards, budgets, emails, onboarding), call read_skill to load the appropriate template.
7. Be proactive — take action first, then confirm what you did. Be concise.
8. For product sourcing, use clip_product to save products and list_clipped_products or search_products to find saved products.
`

const systemPrompts: Record<string, string> = {
  email: `You are an expert AI assistant for interior designers, specializing in drafting professional client emails. Write with warmth, clarity, and sophistication. For email templates, call read_skill("email_templates") to load professional templates. Use tools to look up client/project details for personalization.${ENTITY_REFERENCE}`,
  moodboard: `You are a creative AI assistant for interior designers, specializing in mood board concepts and design direction. For mood board generation, call read_skill("mood_board") to load the concept template. Suggest color palettes, textures, furniture styles, lighting, and aesthetic themes. Reference real brands when helpful.${ENTITY_REFERENCE}`,
  budget: `You are a financial AI assistant for interior designers, specializing in project budgeting and cost estimation. For budget breakdowns, call read_skill("budget") to load the budget template with industry-standard allocations. Use tools to query project details for context.${ENTITY_REFERENCE}`,
  'follow-up': `You are an AI assistant for interior designers, specializing in client relationship management. Provide follow-up strategies and communication templates. For email drafts, call read_skill("email_templates").${ENTITY_REFERENCE}`,
  sourcing: `You are a product sourcing AI assistant for interior designers. Help find furniture, decor, materials, and trade vendors. Suggest alternatives at different price points. Use list_clipped_products and search_products to find saved products. Use clip_product to save new products. Use search_files to find existing sourcing documents.${ENTITY_REFERENCE}`,
  management: `You are a project management AI assistant for interior designers. Help with timelines, task organization, phase planning, and workflow optimization. Use tools to create/manage projects and clients.${ENTITY_REFERENCE}`,
  general: `You are IDStudio AI — a knowledgeable, warm, and professional personal assistant for interior designers. Help with all aspects of running a design business.

## Your Tools
- create_client / update_client — Manage client records
- list_clients — Look up clients (ALWAYS call before create)
- create_project — Create projects linked to clients
- list_projects — See all projects
- search_files — Find documents
- get_project_details — Full project info
- read_skill — Load templates for complex workflows (proposals, mood boards, emails, budgets, onboarding)
- list_clipped_products — Browse saved products with filters
- clip_product — Save a product to the library
- search_products — Search saved products
${ENTITY_REFERENCE}`,
}

export async function POST(request: NextRequest) {
  try {
    const { messages, category = 'general', model = 'haiku' } = await request.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Claude API key not configured. Please add ANTHROPIC_API_KEY to your .env.local file.' },
        { status: 500 }
      )
    }

    // Authenticate user
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Rate limit: 20 chat messages per minute per user
    const rl = checkRateLimit(`chat:${user.id}`, 20)
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs)

    // Validate model selection
    const modelTier = (model as ModelTier) in MODEL_CONFIG ? (model as ModelTier) : 'haiku'
    const modelConfig = MODEL_CONFIG[modelTier]

    // Check credits
    const creditStatus = await getCreditStatus(user.id)

    if (!canAfford(creditStatus.creditsRemaining, modelTier, creditStatus.unlimited)) {
      return NextResponse.json({
        error: 'out_of_credits',
        creditStatus,
        message: `You've used all your weekly credits. Upgrade your plan for more AI access.`,
      }, { status: 429 })
    }

    const systemPrompt = systemPrompts[category] || systemPrompts.general

    // Validate message length
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.content) {
      const lengthError = validateStringLength(lastMessage.content, 10_000, 'message')
      if (lengthError) {
        return NextResponse.json({ error: lengthError }, { status: 400 })
      }
    }

    // Convert messages to Anthropic format with prompt injection sanitization
    const anthropicMessages: Anthropic.MessageParam[] = messages
      .filter((m: { role: string }) => m.role !== 'system')
      .map((m: { role: string; content: string }) => {
        const content = m.role === 'user'
          ? sanitizeUserMessage(m.content).sanitized
          : m.content
        return {
          role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
          content,
        }
      })

    // Tool loop: Claude may call tools, we execute them and feed results back
    let totalInputTokens = 0
    let totalOutputTokens = 0
    const toolActions: Array<{ tool: string; result: string }> = []
    const MAX_TOOL_ROUNDS = 10

    let currentMessages = [...anthropicMessages]

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const completion = await anthropic.messages.create({
        model: modelConfig.model,
        max_tokens: 2000,
        system: systemPrompt,
        messages: currentMessages,
        tools: TOOL_DEFINITIONS as Anthropic.Tool[],
      })

      totalInputTokens += completion.usage?.input_tokens ?? 0
      totalOutputTokens += completion.usage?.output_tokens ?? 0

      // Check if Claude wants to use tools
      const toolUseBlocks = completion.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      )

      if (toolUseBlocks.length === 0 || completion.stop_reason === 'end_turn') {
        // No tool calls — extract final text response
        const textBlocks = completion.content.filter(
          (block): block is Anthropic.TextBlock => block.type === 'text'
        )
        const finalMessage = textBlocks.map((b) => b.text).join('\n') || null

        if (!finalMessage) {
          return NextResponse.json({ error: 'No response from Claude' }, { status: 500 })
        }

        // Deduct credits
        await deductCredits(user.id, modelTier, category, totalInputTokens, totalOutputTokens)
        const updatedCredits = await getCreditStatus(user.id)

        return NextResponse.json({
          message: finalMessage,
          category,
          model: modelTier,
          creditsCost: modelConfig.credits,
          creditStatus: updatedCredits,
          toolActions: toolActions.length > 0 ? toolActions : undefined,
        })
      }

      // Execute each tool call
      const toolResults: Anthropic.ToolResultBlockParam[] = []

      for (const toolBlock of toolUseBlocks) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[AI Tool] ${toolBlock.name}`, toolBlock.input)
        }
        const result = await executeTool(toolBlock.name, toolBlock.input, user.id, token)
        toolActions.push({
          tool: toolBlock.name,
          result: result.message || (result.success ? 'Done' : result.error || 'Failed'),
        })
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolBlock.id,
          content: JSON.stringify(result),
        })
      }

      // Feed tool results back to Claude for next round
      currentMessages = [
        ...currentMessages,
        { role: 'assistant' as const, content: completion.content },
        { role: 'user' as const, content: toolResults },
      ]
    }

    // If we hit max rounds, deduct credits and return what we have
    await deductCredits(user.id, modelTier, category, totalInputTokens, totalOutputTokens)
    const finalCredits = await getCreditStatus(user.id)

    return NextResponse.json({
      message: 'I completed the actions above but reached the maximum number of steps. Let me know if you need anything else!',
      category,
      model: modelTier,
      creditsCost: modelConfig.credits,
      creditStatus: finalCredits,
      toolActions: toolActions.length > 0 ? toolActions : undefined,
    })

  } catch (error) {
    console.error('Claude API error:', error)
    return NextResponse.json(
      { error: `Failed to get AI response: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
