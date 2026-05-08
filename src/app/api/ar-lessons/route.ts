import { NextResponse } from 'next/server'

const LESSONS = [
    {
        id: 'human-brain',
        name: 'Human Brain',
        description: 'Explore the human brain in interactive 3D. Scan the QR code with your phone.',
        sceneType: 'human_body',
        interactions: ['Tap lobes', 'Rotate', 'Zoom'],
        qrImage: '/brain.jpeg',
    },
    {
        id: 'human-skeleton',
        name: 'Human Skeleton',
        description: 'Learn about bones and anatomy with interactive 3D models. Scan the QR code with your phone.',
        sceneType: 'human_body',
        interactions: ['Tap bones', 'Rotate', 'Zoom'],
        qrImage: '/human%20skleton.jpeg',
    },
    {
        id: 'solar-system',
        name: 'Solar System',
        description: 'Explore the planets and our solar system in interactive 3D. Scan the QR code with your phone.',
        sceneType: 'space',
        interactions: ['Tap planets', 'Rotate', 'Zoom'],
        qrImage: '/solar.png',
    },
]

export async function GET() {
    return NextResponse.json({ success: true, lessons: LESSONS })
}
