// API Route: QR Code Generator
// Generates QR codes for AR learning experiences

import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

// AR Lesson QR Code mappings
const LESSON_QR_MAP: Record<string, { name: string; url: string; description: string }> = {
  'SOLAR-001': {
    name: 'Solar System AR',
    url: '/ar/solar-system',
    description: 'Explore the 8 planets in 3D'
  },
  'BODY-001': {
    name: 'Human Body AR',
    url: '/ar/human-body',
    description: 'Learn body parts and organs'
  },
  'ANIMAL-001': {
    name: 'Animal Kingdom AR',
    url: '/ar/animals',
    description: 'See wild animals in 3D'
  },
  'PLANT-001': {
    name: 'Plant Life Cycle AR',
    url: '/ar/plants',
    description: 'Watch plants grow'
  },
  'GEOM-001': {
    name: 'Geometric Shapes AR',
    url: '/ar/geometry',
    description: 'Learn 3D shapes'
  },
  'WATER-001': {
    name: 'Water Cycle AR',
    url: '/ar/water-cycle',
    description: 'Understand water movement'
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const format = searchParams.get('format') || 'png'

    // If code is provided, generate QR for specific lesson
    if (code) {
      const lesson = LESSON_QR_MAP[code]
      if (!lesson) {
        return NextResponse.json(
          { success: false, error: 'Invalid lesson code' },
          { status: 404 }
        )
      }

      // Generate QR code as base64
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const qrData = `${baseUrl}${lesson.url}`
      
      const qrBase64 = await QRCode.toDataURL(qrData, {
        width: 400,
        margin: 2,
        color: {
          dark: '#1e293b', // slate-800
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      })

      return NextResponse.json({
        success: true,
        code,
        lesson: lesson.name,
        description: lesson.description,
        targetUrl: qrData,
        qrCode: qrBase64
      })
    }

    // Generate QR codes for all lessons
    const allQRCodes = await Promise.all(
      Object.entries(LESSON_QR_MAP).map(async ([code, lesson]) => {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        const qrData = `${baseUrl}${lesson.url}`
        
        const qrBase64 = await QRCode.toDataURL(qrData, {
          width: 300,
          margin: 2,
          color: {
            dark: '#1e293b',
            light: '#ffffff'
          },
          errorCorrectionLevel: 'H'
        })

        return {
          code,
          name: lesson.name,
          description: lesson.description,
          targetUrl: qrData,
          qrCode: qrBase64
        }
      })
    )

    return NextResponse.json({
      success: true,
      count: allQRCodes.length,
      qrCodes: allQRCodes
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lessonId, lessonName, targetUrl, customData } = body

    if (!targetUrl) {
      return NextResponse.json(
        { success: false, error: 'Target URL is required' },
        { status: 400 }
      )
    }

    // Generate custom QR code
    const qrBase64 = await QRCode.toDataURL(targetUrl, {
      width: 500,
      margin: 2,
      color: {
        dark: customData?.darkColor || '#6366f1', // indigo-500
        light: customData?.lightColor || '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })

    // In production, save to database
    // const qrRecord = await prisma.qRCode.create({
    //   data: {
    //     code: generateUniqueCode(),
    //     lessonId,
    //     arAssets: JSON.stringify(customData)
    //   }
    // })

    return NextResponse.json({
      success: true,
      lessonId,
      lessonName,
      targetUrl,
      qrCode: qrBase64,
      createdAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error creating custom QR code:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create QR code' },
      { status: 500 }
    )
  }
}
