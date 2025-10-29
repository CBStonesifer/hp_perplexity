import {anthropic} from '@ai-sdk/anthropic'
import {generateText, stepCountIs} from 'ai'
import {scrapeTool} from '@/app/utils/tools/scrape_tool'
import {Source} from './ai_sourcing'

export interface CitedResponse {
    answer: string
    sources: Source[]
}

export async function generateCitedResponse(
    query: string,
    sources: Source[]
): Promise<CitedResponse> {
    console.log('📝 [ANALYSIS] Starting analysis for query:', query)
    console.log('📚 [ANALYSIS] Analyzing', sources.length, 'sources')

    const sourcesContext = sources
        .map((source, index) => `[${index + 1}] ${source.description}\nURL: ${source.link}`)
        .join('\n\n')

    const systemPrompt = `You are a helpful research assistant that provides comprehensive, well-researched answers based on source analysis.

You will be given a user's question and a list of relevant sources that have been identified as containing useful information.

Your task:
1. Use the scrape tool to extract the full content from each provided URL
2. Carefully read and analyze the scraped content from all sources
3. Synthesize the information into a comprehensive, accurate answer to the user's question
4. Include inline citations in your response using the format [1], [2], etc. corresponding to the source numbers
5. Write in a clear, engaging style similar to Perplexity AI
6. Ensure all claims are supported by evidence from the scraped sources

Important:
- Always cite your sources using [1], [2], etc.
- Scrape ALL provided sources to gather complete information
- Use multiple sources to provide a well-rounded, balanced answer
- If sources conflict, acknowledge different perspectives
- Write 2-4 paragraphs of well-structured, informative content
- Do NOT include a sources list at the end - just the answer with inline citations
- Format your response in Markdown with proper headings, bold text, lists, and other formatting as appropriate
- Use **bold** for emphasis and key terms
- Use bullet points or numbered lists when presenting multiple items
- Use proper paragraph breaks for readability`

    const prompt = `User's Question: ${query}

Available Sources:
${sourcesContext}

Please scrape each URL to get the full content, then provide a comprehensive answer to the user's question with inline citations.`

    console.log('🤖 [ANALYSIS] Calling Claude to analyze sources and generate answer...')
    const result = await generateText({
        model: anthropic('claude-sonnet-4-5-20250929'),
        system: systemPrompt,
        prompt,
        tools: {
            scrape: scrapeTool,
        },
        stopWhen: stepCountIs(15),
    })
    console.log('✅ [ANALYSIS] Claude response received')

    console.log('=== AI Response Generation ===')
    console.log('Answer length:', result.text.length, 'characters')
    console.log('Tool Calls:', result.toolCalls?.length || 0)
    console.log('Tool Results:', result.toolResults?.length || 0, 'scrapes completed')
    console.log('==============================')

    console.log('✨ [ANALYSIS] Analysis complete')

    return {
        answer: result.text,
        sources,
    }
}
