'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Webcam from 'react-webcam'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Camera,
  CameraOff,
  RotateCcw,
  VolumeX,
  CheckCircle2,
  XCircle,
  Hand,
  Sparkles,
  Info
} from 'lucide-react'

// ISL Alphabet with descriptions
const ISL_ALPHABET: Record<string, { description: string; tips: string; image: string }> = {
  'A': { description: 'Make a fist with thumb on the side', tips: 'Keep fingers tight together', image: '/signs/a.png' },
  'B': { description: 'Flat hand with thumb tucked in', tips: 'Fingers point up, palm forward', image: '/signs/b.png' },
  'C': { description: 'Curve hand like holding a ball', tips: 'Shape your hand like letter C', image: '/signs/c.png' },
  'D': { description: 'Point up with index, other fingers circle', tips: 'Index finger points up', image: '/signs/d.png' },
  'E': { description: 'Bend fingers down, thumb tucked', tips: 'Like holding something small', image: '/signs/e.png' },
  'F': { description: 'Touch index and thumb, others up', tips: 'Make circle with index and thumb', image: '/signs/f.png' },
  'G': { description: 'Point index finger sideways', tips: 'Index points to the side', image: '/signs/g.png' },
  'H': { description: 'Two fingers point sideways', tips: 'Index and middle together pointing right', image: '/signs/h.png' },
  'I': { description: 'Pinky finger up, others in fist', tips: 'Only pinky points up', image: '/signs/i.png' },
  'J': { description: 'Pinky up, draw J in air', tips: 'Move pinky in J shape', image: '/signs/j.png' },
  'K': { description: 'Index and middle up in V, thumb between', tips: 'Peace sign with thumb between', image: '/signs/k.png' },
  'L': { description: 'L shape with thumb and index', tips: 'Make clear L shape', image: '/signs/l.png' },
  'M': { description: 'Three fingers over thumb', tips: 'Thumb under three fingers', image: '/signs/m.png' },
  'N': { description: 'Two fingers over thumb', tips: 'Thumb under two fingers', image: '/signs/n.png' },
  'O': { description: 'Touch all fingertips together', tips: 'Make an O shape', image: '/signs/o.png' },
  'P': { description: 'K shape pointing down', tips: 'Like K but pointing down', image: '/signs/p.png' },
  'Q': { description: 'G shape pointing down', tips: 'Like G but pointing down', image: '/signs/q.png' },
  'R': { description: 'Cross index over middle finger', tips: 'Index and middle crossed', image: '/signs/r.png' },
  'S': { description: 'Fist with thumb over fingers', tips: 'Thumb wraps around', image: '/signs/s.png' },
  'T': { description: 'Thumb between index and middle', tips: 'Thumb pokes out', image: '/signs/t.png' },
  'U': { description: 'Two fingers up together', tips: 'Index and middle together', image: '/signs/u.png' },
  'V': { description: 'Peace sign - two fingers spread', tips: 'Index and middle in V', image: '/signs/v.png' },
  'W': { description: 'Three fingers up spread', tips: 'Index, middle, ring in W', image: '/signs/w.png' },
  'X': { description: 'Index finger bent like hook', tips: 'Index curves like hook', image: '/signs/x.png' },
  'Y': { description: 'Thumb and pinky out, others in', tips: 'Like hang loose sign', image: '/signs/y.png' },
  'Z': { description: 'Index finger draws Z in air', tips: 'Move index in Z pattern', image: '/signs/z.png' }
}

// Practice mode options
type PracticeMode = 'free' | 'guided' | 'quiz'

interface DetectionResult {
  letter: string
  confidence: number
  timestamp: Date
}

export default function SignDetection() {
  const webcamRef = useRef<Webcam>(null)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [predictedLetter, setPredictedLetter] = useState<string | null>(null)
  const [confidence, setConfidence] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('free')
  const [targetLetter, setTargetLetter] = useState<string>('A')
  const [detectionHistory, setDetectionHistory] = useState<DetectionResult[]>([])
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)

  // Word builder state
  const [builtWord, setBuiltWord] = useState<string>('')
  const [lastAddedLetter, setLastAddedLetter] = useState<string | null>(null)
  const [showLetterAdded, setShowLetterAdded] = useState(false)

  // Hand skeleton visualization - now supports multiple hands
  const [showSkeleton, setShowSkeleton] = useState(false)
  const [handLandmarks, setHandLandmarks] = useState<Array<Array<{ x: number, y: number, z: number }>> | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Generate random target letter for quiz mode
  const generateTargetLetter = useCallback(() => {
    const letters = Object.keys(ISL_ALPHABET)
    const randomIndex = Math.floor(Math.random() * letters.length)
    setTargetLetter(letters[randomIndex])
  }, [])

  // Start camera
  const startCamera = () => {
    setIsCameraOn(true)
  }

  // Stop camera
  const stopCamera = () => {
    setIsCameraOn(false)
    setPredictedLetter(null)
    setConfidence(0)
  }

  // Capture and predict
  const captureAndPredict = useCallback(async () => {
    if (!webcamRef.current || isProcessing) return

    const imageSrc = webcamRef.current.getScreenshot()
    if (!imageSrc) return

    setIsProcessing(true)

    try {
      // Call API for prediction
      const response = await fetch('/api/predict-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageSrc })
      })

      const data = await response.json()

      if (data.success) {
        setPredictedLetter(data.predictedLetter)
        setConfidence(data.confidence)

        // Store hand landmarks if available (now supports multiple hands)
        if (data.landmarks) {
          // landmarks is now an array of hands, each hand has 21 points
          console.log('Received landmarks for', data.landmarks.length, 'hand(s)')
          console.log('Landmarks data:', data.landmarks)
          console.log('Is array?', Array.isArray(data.landmarks))
          if (data.landmarks.length > 0) {
            console.log('First hand has', data.landmarks[0].length, 'points')
          }
          setHandLandmarks(data.landmarks)
        } else {
          console.log('No landmarks in response')
          console.log('Full response:', data)
        }

        // Add to history
        const result: DetectionResult = {
          letter: data.predictedLetter,
          confidence: data.confidence,
          timestamp: new Date()
        }
        setDetectionHistory(prev => [result, ...prev].slice(0, 10))

        // Check for quiz mode success
        if (practiceMode === 'quiz' && data.predictedLetter === targetLetter && data.confidence > 0.8) {
          setShowSuccess(true)
          setScore(prev => prev + 10)
          setStreak(prev => prev + 1)
          setTimeout(() => {
            setShowSuccess(false)
            generateTargetLetter()
          }, 1500)
        }

        // Word builder: Add letter if confidence is high and it's different from last added
        if (practiceMode === 'free' && data.confidence > 0.85 && data.predictedLetter !== lastAddedLetter) {
          setBuiltWord(prev => prev + data.predictedLetter)
          setLastAddedLetter(data.predictedLetter)
          setShowLetterAdded(true)
          setTimeout(() => setShowLetterAdded(false), 500)

          // Reset last added letter after 2 seconds to allow same letter again
          setTimeout(() => setLastAddedLetter(null), 2000)
        }
      }
    } catch (error) {
      console.error('Prediction error:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [isProcessing, practiceMode, targetLetter, generateTargetLetter, lastAddedLetter])

  // Auto-capture in camera mode
  useEffect(() => {
    if (!isCameraOn) return

    const interval = setInterval(captureAndPredict, 1000) // Predict every second
    return () => clearInterval(interval)
  }, [isCameraOn, captureAndPredict])

  // Handle practice mode change
  useEffect(() => {
    if (practiceMode === 'quiz') {
      generateTargetLetter()
      setScore(0)
      setStreak(0)
    }
  }, [practiceMode, generateTargetLetter])

  // Draw hand skeleton on canvas
  useEffect(() => {
    if (!showSkeleton || !handLandmarks || !canvasRef.current || !webcamRef.current) return

    const canvas = canvasRef.current
    const video = webcamRef.current.video
    if (!video) return

    // Function to update canvas size and redraw
    const updateCanvas = () => {
      // Get the actual rendered size of the video container
      const rect = video.getBoundingClientRect()

      // Set canvas internal dimensions to match the displayed size exactly
      canvas.width = rect.width
      canvas.height = rect.height

      // Also set the CSS size to match (prevent any scaling)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // MediaPipe hand connections (finger bones)
      const connections = [
        // Thumb
        [0, 1], [1, 2], [2, 3], [3, 4],
        // Index finger
        [0, 5], [5, 6], [6, 7], [7, 8],
        // Middle finger
        [0, 9], [9, 10], [10, 11], [11, 12],
        // Ring finger
        [0, 13], [13, 14], [14, 15], [15, 16],
        // Pinky
        [0, 17], [17, 18], [18, 19], [19, 20],
        // Palm
        [5, 9], [9, 13], [13, 17]
      ]

      // Loop through all detected hands and draw each one
      handLandmarks.forEach((singleHandLandmarks) => {
        // Draw connections (bones) for this hand
        ctx.strokeStyle = '#a855f7' // Purple
        ctx.lineWidth = 3
        connections.forEach(([start, end]) => {
          const startPoint = singleHandLandmarks[start]
          const endPoint = singleHandLandmarks[end]

          // Mirror X coordinates to match the mirrored webcam
          const startX = (1 - startPoint.x) * canvas.width
          const startY = startPoint.y * canvas.height
          const endX = (1 - endPoint.x) * canvas.width
          const endY = endPoint.y * canvas.height

          ctx.beginPath()
          ctx.moveTo(startX, startY)
          ctx.lineTo(endX, endY)
          ctx.stroke()
        })

        // Draw landmarks (joints) for this hand
        singleHandLandmarks.forEach((landmark, index) => {
          // Mirror X coordinate to match the mirrored webcam
          const x = (1 - landmark.x) * canvas.width
          const y = landmark.y * canvas.height

          // Different colors for different parts
          if (index === 0) {
            ctx.fillStyle = '#ef4444' // Red for wrist
          } else if ([4, 8, 12, 16, 20].includes(index)) {
            ctx.fillStyle = '#22c55e' // Green for fingertips
          } else {
            ctx.fillStyle = '#3b82f6' // Blue for joints
          }

          ctx.beginPath()
          ctx.arc(x, y, 6, 0, 2 * Math.PI)
          ctx.fill()

          // Add white border
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 2
          ctx.stroke()
        })
      })
    }

    // Initial draw
    updateCanvas()

    // Redraw on window resize
    const handleResize = () => updateCanvas()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [showSkeleton, handLandmarks])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Hand className="w-7 h-7 text-purple-400" />
            ISL Sign Detection
          </h2>
          <p className="text-gray-400">Show your hand to the camera and practice Indian Sign Language</p>
        </div>

        {/* Practice Mode Selector */}
        <div className="flex gap-2">
          <Button
            variant={practiceMode === 'free' ? 'default' : 'outline'}
            onClick={() => setPracticeMode('free')}
            className={practiceMode === 'free' ? 'bg-purple-600 hover:bg-purple-700' : 'border-gray-600'}
          >
            Free Practice
          </Button>
          <Button
            variant={practiceMode === 'guided' ? 'default' : 'outline'}
            onClick={() => setPracticeMode('guided')}
            className={practiceMode === 'guided' ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-600'}
          >
            Guided
          </Button>
          <Button
            variant={practiceMode === 'quiz' ? 'default' : 'outline'}
            onClick={() => setPracticeMode('quiz')}
            className={practiceMode === 'quiz' ? 'bg-green-600 hover:bg-green-700' : 'border-gray-600'}
          >
            Quiz
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Camera Section */}
        <div className="space-y-4">
          <Card className="bg-slate-800/50 border-white/10">
            <CardContent className="p-0">
              <div className="relative aspect-video bg-slate-900 rounded-t-lg overflow-hidden">
                {isCameraOn ? (
                  <>
                    <Webcam
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      className="w-full h-full object-cover mirror"
                      mirrored
                    />

                    {/* Hand Skeleton Canvas Overlay */}
                    {showSkeleton && (
                      <canvas
                        ref={canvasRef}
                        className="absolute top-0 left-0 pointer-events-none"
                        style={{ transform: 'scaleX(-1)' }} // Mirror to match webcam
                      />
                    )}

                    {/* Processing indicator */}
                    {isProcessing && (
                      <div className="absolute top-4 right-4">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"
                        />
                      </div>
                    )}

                    {/* Success overlay */}
                    <AnimatePresence>
                      {showSuccess && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="absolute inset-0 bg-green-500/80 flex items-center justify-center"
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-center"
                          >
                            <CheckCircle2 className="w-20 h-20 text-white mx-auto mb-2" />
                            <p className="text-2xl font-bold text-white">Correct!</p>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Target letter for quiz mode */}
                    {practiceMode === 'quiz' && (
                      <div className="absolute top-4 left-4 bg-slate-800/90 backdrop-blur-sm rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">Show this letter:</p>
                        <motion.div
                          key={targetLetter}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-4xl font-bold text-white"
                        >
                          {targetLetter}
                        </motion.div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <Camera className="w-16 h-16 mb-4" />
                    <p className="text-lg mb-4">Camera is off</p>
                    <Button
                      onClick={startCamera}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Start Camera
                    </Button>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              {isCameraOn && (
                <div className="p-4 flex justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={stopCamera}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                  >
                    <CameraOff className="w-5 h-5 mr-2" />
                    Stop Camera
                  </Button>
                  <Button
                    variant="outline"
                    onClick={captureAndPredict}
                    disabled={isProcessing}
                    className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Detect Now
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowSkeleton(!showSkeleton)}
                    className={showSkeleton
                      ? 'border-green-500/50 text-green-400 bg-green-500/20'
                      : 'border-blue-500/50 text-blue-400 hover:bg-blue-500/20'
                    }
                  >
                    <Hand className="w-5 h-5 mr-2" />
                    {showSkeleton ? 'Hide' : 'Show'} Skeleton
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quiz Score */}
          {practiceMode === 'quiz' && (
            <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-white/10">
              <CardContent className="p-4">
                <div className="flex justify-around text-center">
                  <div>
                    <p className="text-3xl font-bold text-white">{score}</p>
                    <p className="text-sm text-gray-400">Score</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-yellow-400">{streak}</p>
                    <p className="text-sm text-gray-400">Streak 🔥</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-green-400">
                      {detectionHistory.filter(d => d.letter === targetLetter && d.confidence > 0.8).length}
                    </p>
                    <p className="text-sm text-gray-400">Correct</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Word Builder */}
          {practiceMode === 'free' && (
            <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Word Builder
                </CardTitle>
                <CardDescription>Form words by showing signs!</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Built Word Display */}
                <div className="relative">
                  <div className="bg-slate-900/50 rounded-lg p-6 min-h-[100px] flex items-center justify-center border-2 border-purple-500/30">
                    {builtWord ? (
                      <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: showLetterAdded ? 1.1 : 1 }}
                        className="text-4xl font-bold text-white tracking-wider"
                      >
                        {builtWord}
                      </motion.div>
                    ) : (
                      <p className="text-gray-500 text-lg">Start signing to build a word...</p>
                    )}
                  </div>

                  {/* Letter Added Animation */}
                  <AnimatePresence>
                    {showLetterAdded && (
                      <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.5 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute -top-8 right-4 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold"
                      >
                        +{lastAddedLetter}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Word Builder Controls */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBuiltWord(prev => prev + ' ')}
                    disabled={!builtWord}
                    className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                  >
                    Add Space
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBuiltWord(prev => prev.slice(0, -1))}
                    disabled={!builtWord}
                    className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20"
                  >
                    ← Backspace
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBuiltWord('')
                      setLastAddedLetter(null)
                    }}
                    disabled={!builtWord}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </div>

                {/* Tips */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-sm text-blue-300 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Hold each sign steady for 2 seconds. Letters are added automatically when confidence is high!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Detection Results Section */}
        <div className="space-y-4">
          {/* Current Detection */}
          <Card className="bg-slate-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                Detected Sign
              </CardTitle>
            </CardHeader>
            <CardContent>
              {predictedLetter ? (
                <div className="text-center">
                  <motion.div
                    key={predictedLetter}
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="inline-block"
                  >
                    <div className="text-8xl font-bold text-white mb-4">
                      {predictedLetter}
                    </div>
                  </motion.div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Confidence</span>
                      <span className="text-white font-medium">{Math.round(confidence * 100)}%</span>
                    </div>
                    <Progress value={confidence * 100} className="h-3" />
                  </div>

                  {ISL_ALPHABET[predictedLetter] && (
                    <div className="bg-slate-700/50 rounded-lg p-4 text-left">
                      <div className="flex items-start gap-2 mb-2">
                        <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                        <div>
                          <p className="text-white font-medium">
                            {ISL_ALPHABET[predictedLetter].description}
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            💡 {ISL_ALPHABET[predictedLetter].tips}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quiz mode feedback */}
                  {practiceMode === 'quiz' && (
                    <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${predictedLetter === targetLetter
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                      }`}>
                      {predictedLetter === targetLetter ? (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Correct! Keep holding the sign.</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5" />
                          <span>Try again! Show letter {targetLetter}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <Hand className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Start camera to detect signs</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detection History */}
          <Card className="bg-slate-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-lg">Recent Detections</CardTitle>
            </CardHeader>
            <CardContent>
              {detectionHistory.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {detectionHistory.map((detection, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`px-3 py-2 rounded-lg ${detection.confidence > 0.8
                        ? 'bg-green-500/20 border border-green-500/30'
                        : detection.confidence > 0.5
                          ? 'bg-yellow-500/20 border border-yellow-500/30'
                          : 'bg-red-500/20 border border-red-500/30'
                        }`}
                    >
                      <span className="text-xl font-bold text-white">{detection.letter}</span>
                      <span className="text-xs text-gray-400 ml-1">
                        {Math.round(detection.confidence * 100)}%
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center">No detections yet</p>
              )}
            </CardContent>
          </Card>

          {/* Alphabet Reference */}
          <Card className="bg-slate-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-lg">ISL Alphabet Reference</CardTitle>
              <CardDescription>Click any letter to see how to make the sign</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                {Object.keys(ISL_ALPHABET).map((letter) => (
                  <button
                    key={letter}
                    onClick={() => {
                      setPredictedLetter(letter)
                      setConfidence(1)
                    }}
                    className={`aspect-square rounded-lg flex items-center justify-center text-lg font-bold transition-all ${predictedLetter === letter
                      ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                      : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600'
                      }`}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
