import {anthropic} from '@ai-sdk/anthropic'
import {generateText} from 'ai'
import {searchTool} from '@/app/utils/tools/search_tool'

export interface Source {
    description: string
    link: string
}

export interface SourcedResponse {
    title: string
    sources: Source[]
}

function parseSearchResults(output: string): Source[] {
    const sources: Source[] = []
    const lines = output.split('\n')

    let currentSource: Partial<Source> = {}

    for (const line of lines) {
        const urlMatch = line.match(/\*\*URL:\*\* (.+)/)
        if (urlMatch) {
            currentSource.link = urlMatch[1].trim()
        }

        const descMatch = line.match(/\*\*Description:\*\* (.+)/)
        if (descMatch) {
            currentSource.description = descMatch[1].trim()
        }

        if (currentSource.link && currentSource.description) {
            sources.push({
                link: currentSource.link,
                description: currentSource.description,
            })
            currentSource = {}
        }
    }

    return sources
}

export async function generateSourcedResponse(query: string): Promise<SourcedResponse> {
    console.log('🔍 [SOURCING] Starting source generation for query:', query)

    const systemPrompt = `You are a helpful search assistant specialized in finding high-quality, relevant sources.

Your task is to use the search tool to identify the most relevant and authoritative sources that can answer the user's question.
DO NOT include YouTube as a source

Focus on finding:
- Recent, up-to-date information
- Authoritative and credible sources
- Diverse perspectives when applicable
- Sources that directly address the query
- Consider all aspects of the query and links that will be relevant beyond the immediate ask`


    console.log('🤖 [SOURCING] Calling Claude to find sources...')
    const result = await generateText({
        model: anthropic('claude-sonnet-4-5-20250929'),
        system: systemPrompt,
        prompt: `Find the best sources to answer this question: ${query}`,
        temperature: 0.4,
        tools: {
            search: searchTool,
        },
    })
    console.log('✅ [SOURCING] Claude response received')

    console.log('=== Search Tool Response ===')
    console.log('Tool Calls:', result.toolCalls?.length || 0)
    console.log('Tool Results:', result.toolResults?.length || 0)

    if (result.toolResults && result.toolResults.length > 0) {
        const searchResult = result.toolResults[0]
        const output = searchResult.output
        if (typeof output === 'string') {
            console.log('Search output length:', output.length)
        }
    }
    console.log('============================')

    if (!result.toolResults || result.toolResults.length === 0) {
        console.error('No tool results found')
        return {
            title: query,
            sources: [],
        }
    }

    const searchOutput = String(result.toolResults[0].output || '')
    const sources = parseSearchResults(searchOutput)

    console.log(`📊 [SOURCING] Extracted ${sources.length} sources, returning top 7`)

    return {
        title: query,
        sources: sources.slice(0, 7),
    }
}
