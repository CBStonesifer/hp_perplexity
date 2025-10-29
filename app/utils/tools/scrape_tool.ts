import { tool } from 'ai'
import { z } from 'zod'

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY

interface FirecrawlScrapeParams {
  url: string
  formats?: Array<'markdown' | 'html' | 'screenshot' | 'links'>
  onlyMainContent?: boolean
  mobile?: boolean
  maxAge?: number
}

interface ScrapeMetadata {
  title?: string
  description?: string
  language?: string
  keywords?: string
  statusCode?: number
  error?: string
}

interface FirecrawlScrapeResponse {
  success: boolean
  data?: {
    markdown?: string
    html?: string
    screenshot?: string
    links?: string[]
    metadata?: ScrapeMetadata
  }
  error?: string
}

async function scrapeWebsite(params: FirecrawlScrapeParams): Promise<FirecrawlScrapeResponse> {
  if (!FIRECRAWL_API_KEY) {
    throw new Error('FIRECRAWL_API_KEY environment variable is not set')
  }

  const response = await fetch('https://api.firecrawl.dev/v2/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: params.url,
      formats: params.formats ?? ['markdown'],
      onlyMainContent: params.onlyMainContent ?? true,
      ...(params.mobile !== undefined && { mobile: params.mobile }),
      ...(params.maxAge && { maxAge: params.maxAge }),
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Firecrawl API error: ${response.status} - ${errorText}`)
  }

  return response.json()
}

const scrapeToolParametersSchema = z.object({
  url: z.string().describe('The URL of the webpage to scrape'),
  formats: z.array(z.enum(['markdown', 'html', 'screenshot', 'links'])).optional().describe('Output formats (default: ["markdown"])'),
  onlyMainContent: z.boolean().optional().describe('Extract only main content, excluding headers/footers (default: true)'),
  mobile: z.boolean().optional().describe('Emulate mobile device for scraping'),
  maxAge: z.number().int().positive().optional().describe('Return cached page if younger than specified milliseconds'),
})

export const scrapeTool = tool({
  description: 'Scrape and extract content from a website URL. Returns the page content in various formats including markdown, HTML, screenshots, and links. Useful for extracting information from specific web pages.',
  inputSchema: scrapeToolParametersSchema,
  execute: async ({ url, formats, onlyMainContent, mobile, maxAge }) => {
    const result = await scrapeWebsite({
      url,
      formats,
      onlyMainContent,
      mobile,
      maxAge,
    })

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Scraping failed')
    }

    const output: string[] = []

    output.push(`Source: ${url}`)

    if (result.data.metadata?.title) {
      output.push(`Title: ${result.data.metadata.title}`)
    }

    if (result.data.markdown) {
      output.push('\n---\n')
      output.push(result.data.markdown)

      const wordCount = result.data.markdown.split(/\s+/).length
      if (wordCount < 100) {
        output.push('\n---')
        output.push(`[Note: Limited content extracted - ${wordCount} words]`)
      }
    } else if (result.data.html) {
      output.push('\n---\n')
      output.push('[Note: Markdown extraction failed, using HTML content]')
      output.push(result.data.html.slice(0, 10000))
    } else {
      output.push('\n[Warning: No content could be extracted from this URL]')
    }

    return output.join('\n')
  },
})
