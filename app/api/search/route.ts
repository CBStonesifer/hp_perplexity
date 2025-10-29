import {NextRequest} from 'next/server'
import {generateSourcedResponse} from '@/app/utils/ai/ai_sourcing'

export async function POST(request: NextRequest) {
    try {
        const {query} = await request.json()

        if (!query || typeof query !== 'string') {
            console.log('❌ [API] Invalid query received')
            return Response.json(
                {error: 'Query is required'},
                {status: 400}
            )
        }

        console.log('🚀 [API] /api/search - Starting source search for:', query)
        const sourcedResponse = await generateSourcedResponse(query)

        if (!sourcedResponse.sources || sourcedResponse.sources.length === 0) {
            console.log('⚠️ [API] No sources found for query')
            return Response.json({
                title: sourcedResponse.title,
                sources: [],
                message: 'No sources found for your query. Please try a different search.',
            })
        }

        console.log(`✅ [API] Successfully found ${sourcedResponse.sources.length} sources`)
        return Response.json(sourcedResponse)
    } catch (error) {
        console.error('Search API error:', error)
        return Response.json(
            {error: 'Failed to find sources'},
            {status: 500}
        )
    }
}
