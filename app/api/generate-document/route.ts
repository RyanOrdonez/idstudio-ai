import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  checkRateLimit,
  rateLimitResponse,
  sanitizeUserMessage,
} from '@/lib/apiSecurity'
import { getCreditStatus, canAfford, deductCredits } from '@/lib/credits'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Claude API key not configured' },
        { status: 500 }
      )
    }

    // Auth check
    const { user, error: authError } = await getAuthenticatedUser(request)
    if (!user) return unauthorizedResponse(authError || undefined)

    // Rate limit: 10 document generations per minute
    const rl = checkRateLimit(`gen-doc:${user.id}`, 10)
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs)

    // Credit check (costs 3 credits — equivalent to Sonnet)
    const creditStatus = await getCreditStatus(user.id)
    if (!canAfford(creditStatus.creditsRemaining, 'sonnet', creditStatus.unlimited)) {
      return NextResponse.json({ error: 'out_of_credits', creditStatus }, { status: 429 })
    }

    const { documentType, projectData, clientData, additionalInfo } = await request.json()

    if (!documentType || !projectData || !clientData) {
      return NextResponse.json(
        { error: 'Missing required fields: documentType, projectData, and clientData are required' },
        { status: 400 }
      )
    }

    // Create system prompts for different document types
    const systemPrompts = {
      proposal: `You are a professional interior design proposal writer. Create a comprehensive design proposal that includes:
- Executive summary
- Project scope and objectives
- Design concept and approach
- Timeline and milestones
- Investment breakdown
- Terms and conditions
Format the response as a professional document with clear sections.`,

      contract: `You are a legal document specialist for interior design services. Create a professional service contract that includes:
- Parties involved
- Scope of work
- Payment terms and schedule
- Timeline and deliverables
- Change order procedures
- Cancellation policy
- Legal terms and conditions
Format as a formal contract document.`,

      invoice: `You are an accounting professional creating interior design invoices. Create a detailed invoice that includes:
- Invoice header with date and number
- Client billing information
- Itemized services and costs
- Subtotal, taxes, and total
- Payment terms and methods
- Professional formatting
Format as a professional invoice document.`
    }

    const systemPrompt = systemPrompts[documentType as keyof typeof systemPrompts]
    if (!systemPrompt) {
      return NextResponse.json(
        { error: 'Invalid document type. Must be proposal, contract, or invoice' },
        { status: 400 }
      )
    }

    const userPrompt = `
Project Information:
- Name: ${projectData.projectName}
- Address: ${projectData.address}
- Budget: ${projectData.budget ? `$${projectData.budget.toLocaleString()}` : 'To be determined'}
- Description: ${projectData.description || 'Interior design project'}
- Timeline: ${projectData.timeline || 'To be determined'}

Client Information:
- Name: ${clientData.name}
- Email: ${clientData.email || 'Not provided'}
- Phone: ${clientData.phone || 'Not provided'}
- Address: ${clientData.address || 'Not provided'}

Additional Information:
${additionalInfo || 'No additional information provided'}

Please generate a professional ${documentType} document based on this information.
`

    const completion = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
    })

    const documentContent = completion.content[0]?.type === 'text'
      ? completion.content[0].text
      : null

    if (!documentContent) {
      return NextResponse.json(
        { error: 'Failed to generate document content' },
        { status: 500 }
      )
    }

    // Deduct credits after successful generation
    await deductCredits(
      user.id,
      'sonnet',
      'document',
      completion.usage?.input_tokens,
      completion.usage?.output_tokens
    )

    return NextResponse.json({
      success: true,
      documentType,
      content: documentContent,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Document generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate document' },
      { status: 500 }
    )
  }
}
