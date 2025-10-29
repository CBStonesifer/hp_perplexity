import {anthropic} from '@ai-sdk/anthropic'
import {generateText, stepCountIs} from 'ai'
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
            const url = urlMatch[1].trim()
            if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
                currentSource.link = url
            }
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

    console.log(`🔍 [SOURCING] Parsed ${sources.length} valid sources from output`)
    return sources
}

export async function generateSourcedResponse(query: string): Promise<SourcedResponse> {
    console.log('🔍 [SOURCING] Starting source generation for query:', query)

    const systemPrompt = `You are a helpful search assistant specialized in finding high-quality, relevant sources.

Your task is to use the search tool to identify the most relevant and authoritative sources that can answer the user's question.

IMPORTANT INSTRUCTIONS:
1. ALWAYS call the search tool to find sources - never skip this step
2. Use a limit of 10 results to ensure you get enough sources
3. DO NOT include YouTube videos as sources
4. Focus on authoritative websites, news outlets, research papers, and reputable blogs
5. Make sure to call the search tool with relevant search queries

Focus on finding:
- Recent, up-to-date information
- Authoritative and credible sources (e.g., .edu, .gov, major news outlets, industry leaders)
- Diverse perspectives when applicable
- Sources that directly address the query
- Consider all aspects of the query and links that will be relevant beyond the immediate ask`


    console.log('🤖 [SOURCING] Calling Claude to find sources...')
    const result = await generateText({
        model: anthropic('claude-sonnet-4-5-20250929'),
        system: systemPrompt,
        prompt: `Use the search tool to find the best sources to answer this question: ${query}

Make sure to use the search tool with limit=10 to get comprehensive results.`,
        temperature: 0.1,
        tools: {
            search: searchTool,
        },
    })
    console.log('✅ [SOURCING] Claude response received')

    console.log('=== Search Tool Response ===')
    console.log('Tool Calls:', result.toolCalls?.length || 0)
    console.log('Tool Results:', result.toolResults?.length || 0)

    if (result.toolCalls && result.toolCalls.length > 0) {
        console.log('Tool call details:', JSON.stringify(result.toolCalls[0], null, 2))
    }

    if (result.toolResults && result.toolResults.length > 0) {
        const searchResult = result.toolResults[0]
        const output = searchResult.output
        if (typeof output === 'string') {
            console.log('Search output length:', output.length)
            console.log('First 500 chars:', output.substring(0, 500))
        } else {
            console.log('Search output type:', typeof output)
            console.log('Search output:', output)
        }
    }
    console.log('============================')

    if (!result.toolResults || result.toolResults.length === 0) {
        console.error('❌ [SOURCING] No tool results found - Claude did not call the search tool')
        console.error('Claude response text:', result.text)
        return {
            title: query,
            sources: [],
        }
    }

    const searchOutput = String(result.toolResults[0].output || '')

    if (!searchOutput || searchOutput.trim().length === 0) {
        console.error('❌ [SOURCING] Search output is empty')
        return {
            title: query,
            sources: [],
        }
    }

    const sources = parseSearchResults(searchOutput)

    if (sources.length === 0) {
        console.error('❌ [SOURCING] No sources parsed from search output')
        console.error('Search output to parse:', searchOutput.substring(0, 1000))
    }

    console.log(`📊 [SOURCING] Extracted ${sources.length} sources, returning top 3`)

    return {
        title: query,
        sources: sources.slice(0, 3),
    }
}
