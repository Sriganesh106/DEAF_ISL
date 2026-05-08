'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Webcam from 'react-webcam'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Camera, CameraOff, Hand, Sparkles, CheckCircle2,
    XCircle, Trash2, Delete, Volume2, Play, Pause,
    Award, Target, Zap, TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function SignDetectionV2() {
    // Camera state
    const [isCameraOn, setIsCameraOn] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const webcamRef = useRef<Webcam>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Detection state
    const [prediction, setPrediction] = useState<string | null>(null)
    const [confidence, setConfidence] = useState<number>(0)
    const [handLandmarks, setHandLandmarks] = useState<Array<Array<{ x: number, y: number, z: number }>> | null>(null)
    const [showSkeleton, setShowSkeleton] = useState(true)

    // Word builder
    const [builtWord, setBuiltWord] = useState('')
    const [showLetterAdded, setShowLetterAdded] = useState(false)

    // Stats
    const [totalDetections, setTotalDetections] = useState(0)
    const [correctDetections, setCorrectDetections] = useState(0)
    const [streak, setStreak] = useState(0)

    // Auto-capture
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    // Start camera
    const startCamera = useCallback(() => {
        setIsCameraOn(true)
        // Auto-capture every 500ms
        intervalRef.current = setInterval(() => {
            captureAndPredict()
        }, 500)
    }, [])

    // Stop camera
    const stopCamera = useCallback(() => {
        setIsCameraOn(false)
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
        setPrediction(null)
        setHandLandmarks(null)
    }, [])

    // Capture and predict
    const captureAndPredict = useCallback(async () => {
        if (!webcamRef.current || isProcessing) return

        const imageSrc = webcamRef.current.getScreenshot()
        if (!imageSrc) return

        setIsProcessing(true)

        try {
            const response = await fetch('/api/predict-sign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageSrc })
            })

            const data = await response.json()

            if (data.success) {
                setPrediction(data.predictedLetter)
                setConfidence(data.confidence)
                setHandLandmarks(data.landmarks || null)
                setTotalDetections(prev => prev + 1)

                if (data.confidence > 0.8 && data.predictedLetter !== 'Unknown') {
                    setCorrectDetections(prev => prev + 1)
                    setStreak(prev => prev + 1)
                } else if (data.predictedLetter === 'Unknown') {
                    setStreak(0)
                }
            }
        } catch (error) {
            console.error('Prediction error:', error)
        } finally {
            setIsProcessing(false)
        }
    }, [isProcessing])

    // Add letter to word
    const addLetterToWord = useCallback(() => {
        if (prediction && prediction !== 'Unknown' && confidence > 0.85) {
            setBuiltWord(prev => prev + prediction)
            setShowLetterAdded(true)
            setTimeout(() => setShowLetterAdded(false), 300)

            // Speak the letter
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(prediction)
                utterance.rate = 1.2
                window.speechSynthesis.speak(utterance)
            }
        }
    }, [prediction, confidence])

    // Clear word
    const clearWord = useCallback(() => {
        setBuiltWord('')
    }, [])

    // Delete last letter
    const deleteLastLetter = useCallback(() => {
        setBuiltWord(prev => prev.slice(0, -1))
    }, [])

    // Speak word
    const speakWord = useCallback(() => {
        if (builtWord && 'speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(builtWord)
            window.speechSynthesis.speak(utterance)
        }
    }, [builtWord])

    // Draw skeleton
    useEffect(() => {
        if (!showSkeleton || !handLandmarks || !canvasRef.current || !webcamRef.current) return

        const canvas = canvasRef.current
        const video = webcamRef.current.video

        if (!video) return

        const updateCanvas = () => {
            const rect = video.getBoundingClientRect()
            canvas.width = rect.width
            canvas.height = rect.height

            const ctx = canvas.getContext('2d')
            if (!ctx) return

            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Hand connections
            const connections = [
                [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
                [0, 5], [5, 6], [6, 7], [7, 8], // Index
                [0, 9], [9, 10], [10, 11], [11, 12], // Middle
                [0, 13], [13, 14], [14, 15], [15, 16], // Ring
                [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
                [5, 9], [9, 13], [13, 17] // Palm
            ]

            handLandmarks.forEach((singleHandLandmarks) => {
                // Draw connections
                ctx.strokeStyle = '#a855f7'
                ctx.lineWidth = 3
                connections.forEach(([start, end]) => {
                    const startPoint = singleHandLandmarks[start]
                    const endPoint = singleHandLandmarks[end]

                    const startX = (1 - startPoint.x) * canvas.width
                    const startY = startPoint.y * canvas.height
                    const endX = (1 - endPoint.x) * canvas.width
                    const endY = endPoint.y * canvas.height

                    ctx.beginPath()
                    ctx.moveTo(startX, startY)
                    ctx.lineTo(endX, endY)
                    ctx.stroke()
                })

                // Draw landmarks
                singleHandLandmarks.forEach((landmark, index) => {
                    const x = (1 - landmark.x) * canvas.width
                    const y = landmark.y * canvas.height

                    if (index === 0) {
                        ctx.fillStyle = '#ef4444' // Red wrist
                    } else if ([4, 8, 12, 16, 20].includes(index)) {
                        ctx.fillStyle = '#22c55e' // Green fingertips
                    } else {
                        ctx.fillStyle = '#3b82f6' // Blue joints
                    }

                    ctx.beginPath()
                    ctx.arc(x, y, 6, 0, 2 * Math.PI)
                    ctx.fill()

                    ctx.strokeStyle = '#ffffff'
                    ctx.lineWidth = 2
                    ctx.stroke()
                })
            })
        }

        updateCanvas()

        const handleResize = () => updateCanvas()
        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [showSkeleton, handLandmarks])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [])

    const accuracy = totalDetections > 0 ? (correctDetections / totalDetections * 100).toFixed(1) : 0

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-2"
                >
                    <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                        ISL Sign Detection
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Real-time Indian Sign Language Recognition
                    </p>
                </motion.div>

                {/* Stats Bar */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                    <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-white/10 backdrop-blur-xl">
                        <CardContent className="p-4 text-center">
                            <Target className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                            <p className="text-3xl font-bold text-white">{totalDetections}</p>
                            <p className="text-sm text-gray-400">Detections</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-white/10 backdrop-blur-xl">
                        <CardContent className="p-4 text-center">
                            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-400" />
                            <p className="text-3xl font-bold text-white">{accuracy}%</p>
                            <p className="text-sm text-gray-400">Accuracy</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-white/10 backdrop-blur-xl">
                        <CardContent className="p-4 text-center">
                            <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
                            <p className="text-3xl font-bold text-white">{streak}</p>
                            <p className="text-sm text-gray-400">Streak 🔥</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-white/10 backdrop-blur-xl">
                        <CardContent className="p-4 text-center">
                            <Award className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                            <p className="text-3xl font-bold text-white">{correctDetections}</p>
                            <p className="text-sm text-gray-400">Correct</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-6">

                    {/* Camera Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-2 space-y-4"
                    >
                        <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden">
                            <CardContent className="p-0">
                                <div className="relative aspect-video bg-slate-900/50">
                                    {isCameraOn ? (
                                        <>
                                            <Webcam
                                                ref={webcamRef}
                                                screenshotFormat="image/jpeg"
                                                className="w-full h-full object-cover"
                                                mirrored
                                            />

                                            {/* Skeleton Overlay */}
                                            {showSkeleton && (
                                                <canvas
                                                    ref={canvasRef}
                                                    className="absolute top-0 left-0 pointer-events-none"
                                                    style={{ transform: 'scaleX(-1)' }}
                                                />
                                            )}

                                            {/* Processing Indicator */}
                                            {isProcessing && (
                                                <div className="absolute top-4 right-4">
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                        className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"
                                                    />
                                                </div>
                                            )}

                                            {/* Live Prediction Overlay */}
                                            {prediction && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="absolute top-4 left-4 bg-black/60 backdrop-blur-md rounded-2xl p-4 border border-white/20"
                                                >
                                                    <p className="text-xs text-gray-400 mb-1">Detected Sign</p>
                                                    <div className="flex items-center gap-3">
                                                        <motion.div
                                                            key={prediction}
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="text-5xl font-bold text-white"
                                                        >
                                                            {prediction}
                                                        </motion.div>
                                                        <div>
                                                            <Badge
                                                                className={
                                                                    confidence > 0.85 ? 'bg-green-500' :
                                                                        confidence > 0.6 ? 'bg-yellow-500' :
                                                                            'bg-red-500'
                                                                }
                                                            >
                                                                {(confidence * 100).toFixed(0)}%
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center">
                                            <Camera className="w-20 h-20 text-gray-600 mb-4" />
                                            <p className="text-gray-400 text-lg mb-6">Camera is off</p>
                                            <Button
                                                onClick={startCamera}
                                                size="lg"
                                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                            >
                                                <Camera className="w-5 h-5 mr-2" />
                                                Start Camera
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Controls */}
                                {isCameraOn && (
                                    <div className="p-4 bg-black/20 flex flex-wrap justify-center gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={stopCamera}
                                            className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                                        >
                                            <CameraOff className="w-4 h-4 mr-2" />
                                            Stop
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowSkeleton(!showSkeleton)}
                                            className={showSkeleton
                                                ? 'border-green-500/50 text-green-400 bg-green-500/20'
                                                : 'border-blue-500/50 text-blue-400 hover:bg-blue-500/20'
                                            }
                                        >
                                            <Hand className="w-4 h-4 mr-2" />
                                            {showSkeleton ? 'Hide' : 'Show'} Skeleton
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={addLetterToWord}
                                            disabled={!prediction || prediction === 'Unknown' || confidence < 0.85}
                                            className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                                        >
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            Add to Word
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Word Builder Sidebar */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                    >
                        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-white/10 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-400" />
                                    Word Builder
                                </CardTitle>
                                <CardDescription>Build words with signs!</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Word Display */}
                                <div className="bg-slate-900/50 rounded-xl p-6 min-h-[120px] flex items-center justify-center border-2 border-purple-500/30">
                                    {builtWord ? (
                                        <motion.div
                                            initial={{ scale: 0.9 }}
                                            animate={{ scale: showLetterAdded ? 1.1 : 1 }}
                                            className="text-4xl font-bold text-white tracking-wider break-all text-center"
                                        >
                                            {builtWord}
                                        </motion.div>
                                    ) : (
                                        <p className="text-gray-500 text-center">
                                            No word yet<br />
                                            <span className="text-sm">Show signs to build a word</span>
                                        </p>
                                    )}
                                </div>

                                {/* Word Controls */}
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={deleteLastLetter}
                                        disabled={!builtWord}
                                        className="border-orange-500/50 text-orange-400 hover:bg-orange-500/20"
                                    >
                                        <Delete className="w-4 h-4 mr-2" />
                                        Delete
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={clearWord}
                                        disabled={!builtWord}
                                        className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Clear
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={speakWord}
                                        disabled={!builtWord}
                                        className="col-span-2 border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
                                    >
                                        <Volume2 className="w-4 h-4 mr-2" />
                                        Speak Word
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tips Card */}
                        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-white/10 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="text-white text-sm">💡 Tips</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-gray-300">
                                <p>• Show your hand clearly to the camera</p>
                                <p>• Hold the sign steady for best results</p>
                                <p>• Green skeleton = Hand detected</p>
                                <p>• Confidence &gt; 85% to add to word</p>
                                <p>• "Unknown" = Not an ISL sign</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
