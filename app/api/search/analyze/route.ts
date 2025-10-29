import {NextRequest} from 'next/server'
import {generateCitedResponse} from '@/app/utils/ai/ai_response'
import {Source} from '@/app/utils/ai/ai_sourcing'

export async function POST(request: NextRequest) {
    try {
        const {query, sources} = await request.json()

        if (!query || typeof query !== 'string') {
            console.log('❌ [API] Invalid query received')
            return Response.json(
                {error: 'Query is required'},
                {status: 400}
            )
        }

        if (!sources || !Array.isArray(sources) || sources.length === 0) {
            console.log('❌ [API] Invalid sources received')
            return Response.json(
                {error: 'Sources array is required and must not be empty'},
                {status: 400}
            )
        }

        console.log(`🚀 [API] /api/search/analyze - Starting analysis with ${sources.length} sources`)
        const citedResponse = await generateCitedResponse(query, sources as Source[])

        console.log('✅ [API] Analysis complete, returning answer')
        return Response.json(citedResponse)
    } catch (error) {
        console.error('Analyze API error:', error)
        return Response.json(
            {error: 'Failed to analyze sources'},
            {status: 500}
        )
    }
}
