import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  checkRateLimit,
  rateLimitResponse,
  sanitizeUserMessage,
} from '@/lib/apiSecurity'
import { getCreditStatus, canAfford, deductCredits } from '@/lib/credits'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json(
        { error: 'Google AI API key not configured. Please add GOOGLE_AI_API_KEY to your .env.local file.' },
        { status: 500 }
      )
    }

    // Auth check
    const { user, error: authError } = await getAuthenticatedUser(request)
    if (!user) return unauthorizedResponse(authError || undefined)

    // Rate limit: 10 image generations per minute
    const rl = checkRateLimit(`gen-img:${user.id}`, 10)
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs)

    // Credit check (costs 1 credit — equivalent to Haiku)
    const creditStatus = await getCreditStatus(user.id)
    if (!canAfford(creditStatus.creditsRemaining, 'haiku', creditStatus.unlimited)) {
      return NextResponse.json({ error: 'out_of_credits', creditStatus }, { status: 429 })
    }

    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Sanitize prompt
    const { sanitized } = sanitizeUserMessage(prompt)

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)

    // Use Gemini to generate a detailed design description
    // Note: Gemini's image generation (Imagen) requires specific API access.
    // For now, we use Gemini to create a rich design concept description
    // that can be paired with image search or future Imagen integration.
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const designPrompt = `You are an interior design visualization expert. Based on this prompt, create a detailed, vivid visual description that could be used as a design concept reference. Include specific colors (with hex codes), materials, furniture brands/styles, lighting, and spatial layout details.

Prompt: ${sanitized}

Respond with a structured design concept including:
1. Color Palette (with hex codes)
2. Key Materials & Textures
3. Furniture & Decor Pieces
4. Lighting Concept
5. Overall Mood & Atmosphere`

    const result = await model.generateContent(designPrompt)
    const response = result.response
    const description = response.text()

    if (!description) {
      return NextResponse.json(
        { error: 'No design concept generated' },
        { status: 500 }
      )
    }

    // Deduct credits after successful generation
    await deductCredits(user.id, 'haiku', 'image')

    return NextResponse.json({
      description,
      prompt,
      provider: 'gemini',
    })

  } catch (error) {
    console.error('Gemini API error:', error)
    return NextResponse.json(
      { error: `Failed to generate design concept: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
