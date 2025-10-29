import { tool } from 'ai'
import { z } from 'zod'

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY

interface FirecrawlSearchParams {
  query: string
  limit?: number
  sources?: Array<'web' | 'images' | 'news'>
  categories?: Array<'github' | 'research' | 'pdf'>
  tbs?: string
  location?: string
  country?: string
  timeout?: number
  ignoreInvalidURLs?: boolean
}

interface SearchResult {
  title: string
  description: string
  url: string
  markdown?: string
  html?: string
  links?: string[]
  screenshot?: string
  metadata?: Record<string, unknown>
}

interface FirecrawlSearchResponse {
  success: boolean
  data: {
    web?: SearchResult[]
    images?: SearchResult[]
    news?: SearchResult[]
  }
  warning?: string
}

async function searchWeb(params: FirecrawlSearchParams): Promise<FirecrawlSearchResponse> {
  if (!FIRECRAWL_API_KEY) {
    throw new Error('FIRECRAWL_API_KEY environment variable is not set')
  }

  const response = await fetch('https://api.firecrawl.dev/v2/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: params.query,
      limit: params.limit ?? 5,
      sources: params.sources ?? ['web'],
      ...(params.categories && { categories: params.categories }),
      ...(params.tbs && { tbs: params.tbs }),
      ...(params.location && { location: params.location }),
      ...(params.country && { country: params.country }),
      ...(params.timeout && { timeout: params.timeout }),
      ...(params.ignoreInvalidURLs !== undefined && { ignoreInvalidURLs: params.ignoreInvalidURLs }),
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Firecrawl API error: ${response.status} - ${errorText}`)
  }

  return response.json()
}

const searchToolParametersSchema = z.object({
  query: z.string().describe('The search query'),
  limit: z.number().int().min(1).max(100).optional().describe('Maximum number of results to return (default: 5, max: 100)'),
  sources: z.array(z.enum(['web', 'images', 'news'])).optional().describe('Search sources to use (default: ["web"])'),
  categories: z.array(z.enum(['github', 'research', 'pdf'])).optional().describe('Filter results by category'),
  tbs: z.string().optional().describe('Time-based search filter (e.g., "qdr:h" for past hour, "qdr:d" for past day)'),
  location: z.string().optional().describe('Geographic location for result filtering'),
  country: z.string().optional().describe('ISO country code (default: "US")'),
})

export const searchTool = tool({
  description: 'Search the web for information using Firecrawl. Returns up to the specified number of results with titles, descriptions, URLs, and optional content.',
  inputSchema: searchToolParametersSchema,
  execute: async ({ query, limit, sources, categories, tbs, location, country }) => {

    const result = await searchWeb({
      query,
      limit,
      sources,
      categories,
      tbs,
      location,
      country,
    })

    if (!result.success) {
      throw new Error('Search failed')
    }

    const formattedResults: string[] = []

    if (result.data.web) {
      formattedResults.push('# Web Results')
      result.data.web.forEach((item, index) => {
        formattedResults.push(`\n## ${index + 1}. ${item.title}`)
        formattedResults.push(`**URL:** ${item.url}`)
        formattedResults.push(`**Description:** ${item.description}`)
        if (item.markdown) {
          formattedResults.push(`\n${item.markdown.slice(0, 500)}...`)
        }
      })
    }

    if (result.data.images) {
      formattedResults.push('\n\n# Image Results')
      result.data.images.forEach((item, index) => {
        formattedResults.push(`\n${index + 1}. ${item.title} - ${item.url}`)
      })
    }

    if (result.data.news) {
      formattedResults.push('\n\n# News Results')
      result.data.news.forEach((item, index) => {
        formattedResults.push(`\n## ${index + 1}. ${item.title}`)
        formattedResults.push(`**URL:** ${item.url}`)
        formattedResults.push(`**Description:** ${item.description}`)
      })
    }

    if (result.warning) {
      formattedResults.push(`\n\n**Warning:** ${result.warning}`)
    }

    return formattedResults.join('\n')
  },
})