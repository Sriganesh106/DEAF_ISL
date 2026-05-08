// API Route: ISL Sign Language Prediction
// Receives image data and returns predicted sign letter
// This connects to Python ML backend or uses mock predictions for demo

import { NextRequest, NextResponse } from 'next/server'

// ISL Alphabet classes (26 letters)
const ISL_ALPHABET = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
  'U', 'V', 'W', 'X', 'Y', 'Z'
]

// Sign language descriptions for each letter
const SIGN_DESCRIPTIONS: Record<string, { description: string; tips: string }> = {
  'A': { description: 'Make a fist with thumb on the side', tips: 'Keep fingers tight together' },
  'B': { description: 'Flat hand with thumb tucked in', tips: 'Fingers point up, palm faces forward' },
  'C': { description: 'Curve hand like holding a ball', tips: 'Shape your hand like letter C' },
  'D': { description: 'Point up with index, other fingers make circle', tips: 'Index finger points up' },
  'E': { description: 'Bend fingers down with thumb tucked', tips: 'Like you are holding something small' },
  'F': { description: 'Touch index and thumb, other fingers up', tips: 'Make a circle with index and thumb' },
  'G': { description: 'Point index finger sideways', tips: 'Index finger points to the side' },
  'H': { description: 'Two fingers point sideways', tips: 'Index and middle finger together, pointing right' },
  'I': { description: 'Pinky finger up, others in fist', tips: 'Only pinky points up' },
  'J': { description: 'Pinky up, draw J shape', tips: 'Move pinky in J shape in the air' },
  'K': { description: 'Index and middle finger up in V, thumb between', tips: 'Like peace sign with thumb between fingers' },
  'L': { description: 'L shape with thumb and index', tips: 'Make an L shape with thumb and index finger' },
  'M': { description: 'Three fingers over thumb', tips: 'Thumb under index, middle, and ring fingers' },
  'N': { description: 'Two fingers over thumb', tips: 'Thumb under index and middle fingers' },
  'O': { description: 'Touch all fingertips together', tips: 'Make an O shape with fingers' },
  'P': { description: 'K shape pointing down', tips: 'Like K but fingers point down' },
  'Q': { description: 'G shape pointing down', tips: 'Like G but finger points down' },
  'R': { description: 'Cross index over middle finger', tips: 'Index and middle crossed' },
  'S': { description: 'Fist with thumb over fingers', tips: 'Thumb wraps around fingers' },
  'T': { description: 'Thumb between index and middle', tips: 'Thumb pokes out between fingers' },
  'U': { description: 'Two fingers up together', tips: 'Index and middle together pointing up' },
  'V': { description: 'Peace sign - two fingers spread', tips: 'Index and middle in V shape' },
  'W': { description: 'Three fingers up spread apart', tips: 'Index, middle, and ring in W shape' },
  'X': { description: 'Index finger bent like hook', tips: 'Index finger curves like a hook' },
  'Y': { description: 'Thumb and pinky out, others in', tips: 'Like hanging loose sign' },
  'Z': { description: 'Index finger draws Z in air', tips: 'Move index in Z pattern' }
}

export async function GET() {
  // Return API info and available signs
  return NextResponse.json({
    success: true,
    message: 'ISL Sign Language Detection API',
    endpoint: '/api/predict-sign',
    method: 'POST',
    contentType: 'application/json',
    supportedSigns: ISL_ALPHABET,
    usage: {
      body: { image: 'base64 encoded image data' },
      response: {
        predictedLetter: 'string (A-Z)',
        confidence: 'number (0-1)',
        description: 'string - how to make the sign',
        tips: 'string - tips for correct sign'
      }
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image } = body

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Image data is required' },
        { status: 400 }
      )
    }

    // Always try the real ML backend first
    const mlBackendUrl = process.env.ML_BACKEND_URL || 'http://localhost:8000'

    try {
      const mlResponse = await fetch(`${mlBackendUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image })
      })

      if (mlResponse.ok) {
        const mlResult = await mlResponse.json()
        return NextResponse.json({
          success: true,
          predictedLetter: mlResult.predicted_letter,
          confidence: mlResult.confidence,
          description: SIGN_DESCRIPTIONS[mlResult.predicted_letter]?.description,
          tips: SIGN_DESCRIPTIONS[mlResult.predicted_letter]?.tips,
          landmarks: mlResult.landmarks, // Pass through the 21 hand landmarks for skeleton visualization
          source: 'ml-backend'
        })
      }
    } catch (mlError) {
      console.error('ML backend not available, using demo mode:', mlError)
    }

    // Demo mode fallback: when ML backend is not running
    const randomIndex = Math.floor(Math.random() * ISL_ALPHABET.length)
    const predictedLetter = ISL_ALPHABET[randomIndex]
    const confidence = 0.75 + Math.random() * 0.20

    return NextResponse.json({
      success: true,
      predictedLetter,
      confidence: Math.round(confidence * 100) / 100,
      description: SIGN_DESCRIPTIONS[predictedLetter]?.description,
      tips: SIGN_DESCRIPTIONS[predictedLetter]?.tips,
      allProbabilities: ISL_ALPHABET.reduce((acc, letter) => {
        acc[letter] = letter === predictedLetter ? confidence : Math.random() * 0.1
        return acc
      }, {} as Record<string, number>),
      source: 'demo-mode',
      message: 'ML backend not available. Using demo predictions.'
    })
  } catch (error) {
    console.error('Sign prediction error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process sign prediction' },
      { status: 500 }
    )
  }
}
