import { NextRequest, NextResponse } from 'next/server'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

const CATEGORY_QUERIES: Record<string, string> = {
    'isl': 'Indian Sign Language tutorial for beginners',
    'deaf-culture': 'deaf culture education awareness India',
    'communication': 'sign language communication tips for deaf India',
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const category = searchParams.get('category') || 'isl'
        const customQuery = searchParams.get('q')
        const searchQuery = searchParams.get('search')
        const maxResults = searchParams.get('maxResults') || '24'
        const order = searchParams.get('order') || 'relevance'

        const baseQuery = searchQuery
            ? searchQuery + ' Indian Sign Language'
            : customQuery || CATEGORY_QUERIES[category] || CATEGORY_QUERIES['isl']

        // Strictly exclude American and British Sign Language to ensure ISL
        const query = baseQuery + ' -ASL -"American Sign Language" -"American" -BSL -"British Sign Language"'

        if (!YOUTUBE_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'YouTube API key not configured' },
                { status: 500 }
            )
        }

        const params = new URLSearchParams({
            part: 'snippet',
            q: query,
            type: 'video',
            maxResults,
            key: YOUTUBE_API_KEY,
            videoCaption: 'closedCaption',
            relevanceLanguage: 'en',
            regionCode: 'IN', // Strongly bias towards India for ISL
            safeSearch: 'strict',
            order: order,
        })

        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?${params.toString()}`
        )

        if (!response.ok) {
            const errorData = await response.json()
            console.error('YouTube API error:', errorData)
            return NextResponse.json(
                { success: false, error: 'Failed to fetch videos from YouTube' },
                { status: response.status }
            )
        }

        const data = await response.json()

        const videos = data.items?.map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
            thumbnailHigh: item.snippet.thumbnails.high?.url,
            channel: item.snippet.channelTitle,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            duration: '',
            views: '',
            category: category,
        })) || []

        return NextResponse.json({
            success: true,
            category,
            query,
            count: videos.length,
            videos,
        })
    } catch (error) {
        console.error('YouTube API route error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
