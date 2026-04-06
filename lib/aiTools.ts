import { createClient } from '@supabase/supabase-js'

function getAuthenticatedClient(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })
}

// ============================================
// Tool Definitions (sent to Claude)
// ============================================

export const TOOL_DEFINITIONS = [
  {
    name: 'create_client',
    description:
      `Create a NEW client in the database.
IMPORTANT: Always call list_clients first to check if a client with the same name already exists. If they exist, use update_client instead.
FIELDS:
  - name (REQUIRED): Full name. e.g. "Sarah Johnson"
  - email (optional): Email address. Ask user if not provided.
  - phone (optional): Phone number in any format. Ask user if not provided.
  - address (optional): Full mailing address. Ask user if not provided.
  - notes (optional): Design preferences, style notes, how they found you, project interests. Generate a helpful summary from context if the user provides any details.
If the user gives you partial info (just a name), create the client with what you have and tell the user what fields are still missing so they can add them later.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Full name of the client, e.g. "Sarah Johnson"' },
        email: { type: 'string', description: 'Email address, e.g. "sarah@email.com"' },
        phone: { type: 'string', description: 'Phone number, e.g. "555-123-4567"' },
        address: { type: 'string', description: 'Full address, e.g. "1234 Oak Ave, San Francisco, CA 94102"' },
        notes: { type: 'string', description: 'Design preferences, style notes, project interests, referral source' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_client',
    description:
      `Update an existing client record. Use this when:
  - The user provides additional info (phone, email, notes) for a client that already exists
  - The user asks to change or correct client details
You MUST have the client_id — call list_clients first to look it up by name.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        client_id: { type: 'string', description: 'UUID of the existing client (get from list_clients)' },
        name: { type: 'string', description: 'Updated full name' },
        email: { type: 'string', description: 'Updated email address' },
        phone: { type: 'string', description: 'Updated phone number' },
        address: { type: 'string', description: 'Updated full address' },
        notes: { type: 'string', description: 'Updated notes — append to existing notes, do not overwrite' },
      },
      required: ['client_id'],
    },
  },
  {
    name: 'list_clients',
    description:
      'Get all active (non-archived) clients. Use this to check if a client exists before creating, to look up client IDs, or when the user asks about their clients.',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'create_project',
    description:
      `Create a new interior design project linked to a client.
IMPORTANT: Always call list_clients first to get the client_id.
FIELDS:
  - name (REQUIRED): Descriptive project name. e.g. "Kitchen Remodel", "Master Bedroom Redesign". If user doesn't give one, generate from context (e.g. client name + room/scope).
  - client_id (REQUIRED): UUID of the client. Get from list_clients.
  - description (optional): Scope, style preferences, special requirements. Generate a helpful summary from whatever the user provides.
  - budget (optional): Budget in dollars. If user mentions a range, use the midpoint.
  - street_address (optional): Project site street address.
  - city (optional): City name.
  - state (optional): State abbreviation, e.g. "NC".
  - zipcode (optional): ZIP code.
After creating, tell the user what fields are filled and what's still missing.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Descriptive project name, e.g. "Kitchen Remodel"' },
        client_id: { type: 'string', description: 'UUID of the client (from list_clients)' },
        description: { type: 'string', description: 'Project scope, style preferences, requirements' },
        budget: { type: 'number', description: 'Budget in dollars, e.g. 50000' },
        street_address: { type: 'string', description: 'Project site street address' },
        city: { type: 'string', description: 'City, e.g. "Fuquay Varina"' },
        state: { type: 'string', description: 'State abbreviation, e.g. "NC"' },
        zipcode: { type: 'string', description: 'ZIP code, e.g. "27526"' },
      },
      required: ['name', 'client_id'],
    },
  },
  {
    name: 'list_projects',
    description: 'Get all active (non-archived) projects, optionally filtered by client.',
    input_schema: {
      type: 'object' as const,
      properties: {
        client_id: { type: 'string', description: 'Filter by client UUID (optional)' },
      },
    },
  },
  {
    name: 'search_files',
    description: 'Search uploaded files by name or filter by project.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search term (optional)' },
        project_id: { type: 'string', description: 'Filter by project UUID (optional)' },
      },
    },
  },
  {
    name: 'get_project_details',
    description: 'Get full details for a specific project including associated client info and tasks.',
    input_schema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: 'UUID of the project' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'read_skill',
    description:
      `Load a skill file for complex workflows. Use this when the user asks you to do something that requires a detailed template or multi-step process. Available skills:
  - "proposal" — Generate a client design proposal
  - "mood_board" — Create a mood board concept
  - "email_templates" — Professional email templates for common scenarios
  - "budget" — Project budget breakdown template
  - "onboarding" — New client onboarding checklist
Only call this when you need the template. For simple CRUD tasks (create client, create project), you already have all the knowledge you need.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        skill_name: {
          type: 'string',
          enum: ['proposal', 'mood_board', 'email_templates', 'budget', 'onboarding'],
          description: 'Name of the skill file to load',
        },
      },
      required: ['skill_name'],
    },
  },
  {
    name: 'list_clipped_products',
    description:
      `List the user's clipped/saved products from their Product Library.
OPTIONAL FILTERS:
  - project_id: Filter products assigned to a specific project
  - category: Filter by category (furniture, seating, tables, lighting, textiles, rugs, window_treatments, wall_decor, accessories, hardware, plumbing, tile, flooring, countertops, paint, wallpaper, outdoor, other)
  - search: Search across product name, brand, retailer, and notes`,
    input_schema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: 'Filter by project ID' },
        category: { type: 'string', description: 'Filter by product category' },
        search: { type: 'string', description: 'Search query' },
      },
      required: [],
    },
  },
  {
    name: 'clip_product',
    description:
      `Save a product to the user's Product Library.
FIELDS:
  - product_name (REQUIRED): Name of the product, e.g. "Harmony Sofa"
  - brand (optional): Brand name, e.g. "West Elm"
  - url (optional): Product page URL
  - price (optional): Price as a number
  - category (optional): Category — furniture, seating, tables, lighting, textiles, rugs, etc.
  - description (optional): Product description
  - retailer (optional): Retailer/store name
  - notes (optional): Designer notes
  - project_id (optional): Assign to a project`,
    input_schema: {
      type: 'object' as const,
      properties: {
        product_name: { type: 'string', description: 'Product name (required)' },
        brand: { type: 'string', description: 'Brand name' },
        url: { type: 'string', description: 'Product URL' },
        price: { type: 'number', description: 'Price' },
        category: { type: 'string', description: 'Product category' },
        description: { type: 'string', description: 'Product description' },
        retailer: { type: 'string', description: 'Retailer name' },
        notes: { type: 'string', description: 'Designer notes' },
        project_id: { type: 'string', description: 'Project ID to assign to' },
      },
      required: ['product_name'],
    },
  },
  {
    name: 'search_products',
    description:
      `Search across all products in the user's Product Library by name, brand, retailer, or notes.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search query' },
      },
      required: ['query'],
    },
  },
]

// ============================================
// Tool Execution
// ============================================

export interface ToolResult {
  success: boolean
  data?: any
  error?: string
  message?: string
}

export async function executeTool(
  toolName: string,
  args: any,
  userId: string,
  accessToken: string
): Promise<ToolResult> {
  const supabase = getAuthenticatedClient(accessToken)

  switch (toolName) {
    case 'create_client': {
      const { name, email, phone, address, notes } = args
      const { data, error } = await supabase
        .from('clients')
        .insert({
          user_id: userId,
          name,
          email: email || null,
          phone: phone || null,
          address: address || null,
          notes: notes || null,
        })
        .select()
        .single()

      if (error) return { success: false, error: error.message }

      const filled = ['name']
      if (email) filled.push('email')
      if (phone) filled.push('phone')
      if (address) filled.push('address')
      if (notes) filled.push('notes')
      const allFields = ['name', 'email', 'phone', 'address', 'notes']
      const missing = allFields.filter((f) => !filled.includes(f))
      const missingNote = missing.length > 0 ? ` Missing: ${missing.join(', ')}` : ' All fields filled!'

      return { success: true, data, message: `Created client: ${name}.${missingNote}` }
    }

    case 'update_client': {
      const { client_id, name, email, phone, address, notes } = args
      const updates: Record<string, any> = {}
      if (name) updates.name = name
      if (email) updates.email = email
      if (phone) updates.phone = phone
      if (address) updates.address = address
      if (notes) updates.notes = notes

      if (Object.keys(updates).length === 0) {
        return { success: false, error: 'No fields to update' }
      }

      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', client_id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) return { success: false, error: error.message }
      return { success: true, data, message: `Updated client: ${data?.name}` }
    }

    case 'list_clients': {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .or('archived.is.null,archived.eq.false')
        .order('created_at', { ascending: false })

      if (error) return { success: false, error: error.message }
      return {
        success: true,
        data,
        message: data?.length ? `Found ${data.length} client(s)` : 'No clients found',
      }
    }

    case 'create_project': {
      const { name, client_id, description, budget, status = 'lead' } = args

      // Verify client belongs to user
      const { data: clientCheck } = await supabase
        .from('clients')
        .select('id, name')
        .eq('id', client_id)
        .eq('user_id', userId)
        .single()

      if (!clientCheck) return { success: false, error: 'Client not found or access denied' }

      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          name,
          project_name: name,
          client_name: clientCheck.name,
          notes: description || null,
          budget: budget || null,
          street_address: args.street_address || null,
          city: args.city || null,
          state: args.state || null,
          zipcode: args.zipcode || null,
        })
        .select()
        .single()

      if (error) return { success: false, error: error.message }

      const filled = ['project_name', 'client_name']
      if (description) filled.push('description')
      if (budget) filled.push('budget')
      if (args.street_address) filled.push('address')
      const missing = ['budget', 'address', 'featured_image'].filter((f) => !filled.includes(f) && f !== 'client_name')
      const missingNote = missing.length > 0 ? ` Missing fields: ${missing.join(', ')}` : ''

      return { success: true, data, message: `Created project "${name}" for ${clientCheck.name}.${missingNote}` }
    }

    case 'list_projects': {
      const { client_id } = args || {}
      let query = supabase
        .from('projects')
        .select('*, clients(name)')
        .eq('user_id', userId)

      if (client_id) query = query.eq('client_id', client_id)

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) return { success: false, error: error.message }
      return {
        success: true,
        data,
        message: data?.length ? `Found ${data.length} project(s)` : 'No projects found',
      }
    }

    case 'search_files': {
      const { query: q, project_id } = args || {}
      let dbQuery = supabase
        .from('files')
        .select('*, projects(name)')
        .eq('user_id', userId)

      if (project_id) dbQuery = dbQuery.eq('project_id', project_id)
      if (q) dbQuery = dbQuery.ilike('name', `%${q}%`)

      const { data, error } = await dbQuery.order('created_at', { ascending: false }).limit(20)

      if (error) return { success: false, error: error.message }
      return {
        success: true,
        data,
        message: data?.length ? `Found ${data.length} file(s)` : 'No files found',
      }
    }

    case 'get_project_details': {
      const { project_id } = args
      const { data, error } = await supabase
        .from('projects')
        .select('*, clients(*)')
        .eq('id', project_id)
        .eq('user_id', userId)
        .single()

      if (error) return { success: false, error: error.message }
      return { success: true, data, message: `Project: ${data?.project_name || data?.name}` }
    }

    case 'read_skill': {
      const { skill_name } = args
      const skills: Record<string, string> = {
        proposal: SKILL_PROPOSAL,
        mood_board: SKILL_MOOD_BOARD,
        email_templates: SKILL_EMAIL_TEMPLATES,
        budget: SKILL_BUDGET,
        onboarding: SKILL_ONBOARDING,
      }

      const content = skills[skill_name]
      if (!content) return { success: false, error: `Unknown skill: ${skill_name}` }
      return { success: true, data: content, message: `Loaded skill: ${skill_name}` }
    }

    case 'list_clipped_products': {
      const { project_id, category, search } = args
      let query = supabase
        .from('clipped_products')
        .select('id, product_name, brand, price, currency, category, retailer, url, image_url, notes, project_id, created_at')
        .eq('user_id', userId)
        .or('archived.is.null,archived.eq.false')
        .order('created_at', { ascending: false })
        .limit(25)

      if (project_id) query = query.eq('project_id', project_id)
      if (category) query = query.eq('category', category)
      if (search) query = query.or(`product_name.ilike.%${search}%,brand.ilike.%${search}%,retailer.ilike.%${search}%`)

      const { data, error } = await query
      if (error) return { success: false, error: error.message }
      return { success: true, data, message: `Found ${data?.length || 0} products` }
    }

    case 'clip_product': {
      const { product_name, brand, url, price, category, description, retailer, notes, project_id } = args
      const { data, error } = await supabase
        .from('clipped_products')
        .insert({
          user_id: userId,
          product_name,
          brand: brand || null,
          url: url || null,
          price: price ?? null,
          currency: 'USD',
          category: category || 'other',
          description: description || null,
          retailer: retailer || null,
          notes: notes || null,
          project_id: project_id || null,
        })
        .select()
        .single()

      if (error) return { success: false, error: error.message }
      return { success: true, data, message: `Saved product: ${product_name}` }
    }

    case 'search_products': {
      const { query: searchQuery } = args
      const { data, error } = await supabase
        .from('clipped_products')
        .select('id, product_name, brand, price, currency, category, retailer, url, notes')
        .eq('user_id', userId)
        .or('archived.is.null,archived.eq.false')
        .or(`product_name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%,retailer.ilike.%${searchQuery}%,notes.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) return { success: false, error: error.message }
      return { success: true, data, message: `Found ${data?.length || 0} matching products` }
    }

    default:
      return { success: false, error: `Unknown tool: ${toolName}` }
  }
}

// ============================================
// Skill Templates
// ============================================

const SKILL_PROPOSAL = `# Design Proposal Template

## Structure
1. **Cover Page** — Project name, client name, designer name, date
2. **Project Overview** — Scope of work, design goals, timeline estimate
3. **Design Concept** — Style direction, color palette, key materials, inspiration
4. **Room-by-Room Breakdown** — For each space:
   - Current state summary
   - Proposed changes
   - Key furniture/fixtures
   - Estimated budget for that space
5. **Budget Summary** — Total estimated cost with breakdown by category:
   - Furniture: 40-50% of budget
   - Materials & finishes: 15-20%
   - Labor & installation: 15-20%
   - Lighting & fixtures: 5-10%
   - Decor & accessories: 5-10%
   - Designer fee: 10-15% markup or flat fee
   - Contingency: 10%
6. **Timeline** — Phase schedule with milestones
7. **Terms & Conditions** — Payment schedule, revision policy, procurement process
8. **Next Steps** — How to proceed, what the client needs to provide

## Tone
Professional yet warm. Use "we" to include the client. Emphasize the transformation and lifestyle benefits, not just the technical details.`

const SKILL_MOOD_BOARD = `# Mood Board Concept Template

## Structure
Generate a detailed mood board description including:

1. **Overall Aesthetic** — Name the style (e.g. "Warm Contemporary", "Coastal Farmhouse", "Modern Organic")
2. **Color Palette** — 5-7 colors with hex codes:
   - Primary (walls/large surfaces)
   - Secondary (furniture/upholstery)
   - Accent 1 (pillows/throws/art)
   - Accent 2 (metallics/hardware)
   - Neutral base
3. **Materials & Textures** — 4-6 key materials (e.g. white oak, bouclé, brass, marble, linen)
4. **Key Furniture Pieces** — 3-5 hero items with style descriptions
5. **Lighting Direction** — Warm/cool, fixture styles, layering approach
6. **Art & Decor Direction** — Style of artwork, decorative objects, plants
7. **Inspiration References** — Describe 2-3 reference images/spaces

## Style Categories
- Modern Minimalist: Clean lines, neutral palette, negative space
- Warm Contemporary: Organic shapes, earth tones, mixed textures
- Transitional: Classic meets modern, balanced, timeless
- Coastal: Light, airy, natural materials, blue accents
- Mid-Century Modern: Retro shapes, wood tones, bold accents
- Farmhouse: Rustic, warm, shiplap, vintage elements
- Bohemian: Layered, eclectic, rich colors, global influences`

const SKILL_EMAIL_TEMPLATES = `# Professional Email Templates

## 1. Initial Consultation Follow-Up
Subject: Great meeting you, [Client Name]! Next steps for your [Room/Project]

Hi [Client Name],

Thank you so much for taking the time to meet with me about your [project type]. I loved hearing about your vision for the space!

Based on our conversation, here's what I'm thinking for next steps:
1. I'll put together an initial design concept and mood board
2. We'll schedule a follow-up to review the direction
3. Once approved, I'll develop the full design package

I'll have the concept ready by [date]. In the meantime, feel free to send me any inspiration images you come across!

Looking forward to bringing your vision to life.
Warm regards, [Designer Name]

## 2. Project Update
Subject: [Project Name] — Progress Update

Hi [Client Name],

Quick update on your [project]:
- ✅ [Completed item]
- 🔄 [In progress item]
- 📋 [Upcoming item]

[Any decisions needed from client]

Let me know if you have any questions!
Best, [Designer Name]

## 3. Invoice / Payment Reminder
Subject: Invoice for [Project Name] — [Phase]

Hi [Client Name],

Please find attached the invoice for [phase/description]:
- Amount: $[amount]
- Due date: [date]
- Payment method: [details]

Thank you for your prompt attention to this. Let me know if you have any questions.
Best, [Designer Name]

## 4. Project Completion
Subject: Your [Room/Space] is complete! 🎉

Hi [Client Name],

I'm thrilled to let you know that your [project] is officially complete! It has been such a pleasure working with you on this transformation.

[Brief highlight of the result]

I'd love to schedule a final walkthrough at your convenience. Also, if you're happy with the results, I'd greatly appreciate a review or referral — it means the world to a small business like mine.

Thank you for trusting me with your home!
Warmly, [Designer Name]`

const SKILL_BUDGET = `# Project Budget Template

## Budget Categories & Typical Allocation

### Residential Interior Design Budget Breakdown
| Category | % of Total | Notes |
|----------|-----------|-------|
| Furniture | 35-45% | Sofas, tables, beds, chairs, storage |
| Materials & Finishes | 15-20% | Flooring, tile, countertops, paint, wallpaper |
| Window Treatments | 5-8% | Curtains, blinds, hardware |
| Lighting | 5-10% | Fixtures, lamps, recessed lighting |
| Decor & Accessories | 5-10% | Art, pillows, throws, plants, styling |
| Labor & Installation | 10-20% | Contractors, painters, installers |
| Designer Fee | 10-20% | Flat fee, hourly, or % markup |
| Contingency | 10% | Always include for unexpected costs |

### Budget Tiers (per room)
- **Refresh** ($2K-5K): Paint, accessories, minor furniture swaps
- **Redesign** ($5K-15K): New furniture, lighting, soft goods
- **Renovation** ($15K-50K): Structural changes, new finishes, full furnishing
- **Luxury** ($50K+): High-end materials, custom pieces, full gut renovation

### Markup Guidelines
- Standard trade markup: 20-35% on furniture/materials
- Flat design fee: $2,000-$10,000 per room depending on scope
- Hourly rate: $100-$300/hr depending on market and experience

### Tips
- Get 3 quotes for any contractor work
- Order samples before committing to materials
- Factor in shipping costs (can be 10-15% of furniture cost)
- Include sales tax in budget calculations`

const SKILL_ONBOARDING = `# New Client Onboarding Checklist

## Information to Collect
1. **Contact Details**
   - Full name
   - Email address
   - Phone number
   - Mailing address

2. **Project Basics**
   - Which rooms/spaces need design
   - Project type: new build, renovation, refresh, staging
   - Timeline expectations
   - Budget range
   - Who lives in the home (adults, kids, pets)

3. **Style Preferences**
   - Favorite styles (show examples)
   - Colors they love / hate
   - Must-have items or pieces to keep
   - Inspiration sources (Pinterest boards, magazines, Instagram)

4. **Practical Needs**
   - Storage requirements
   - Entertaining frequency
   - Work from home needs
   - Special requirements (accessibility, allergies, etc.)

5. **Business Items**
   - Design agreement signed
   - Initial deposit received
   - Communication preferences (email, text, calls)
   - Decision-maker confirmation

## First Meeting Agenda (60-90 min)
1. Introductions & rapport building (10 min)
2. Walk through the space together (20 min)
3. Discuss style preferences with visual aids (15 min)
4. Review budget and timeline expectations (15 min)
5. Explain your design process and next steps (10 min)
6. Q&A (10 min)

## After First Meeting
- Send follow-up email within 24 hours
- Create client record in system
- Create project with all collected details
- Begin concept development`
