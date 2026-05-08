'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Webcam from 'react-webcam'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Camera, CameraOff, Hand, Sparkles,
    Volume2, Trash2, Info, TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import FloatingSidebar from '@/components/ui/FloatingSidebar'

// Auto-add settings
const AUTO_ADD_STREAK = 4
const AUTO_ADD_CONFIDENCE = 0.70
const COOLDOWN_MS = 2000

// MediaPipe hand landmarker model URL (hosted by Google)
const HAND_LANDMARKER_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm'
const HAND_LANDMARKER_MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task'

// Hand skeleton connections
const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [0, 9], [9, 10], [10, 11], [11, 12],
    [0, 13], [13, 14], [14, 15], [15, 16],
    [0, 17], [17, 18], [18, 19], [19, 20],
    [5, 9], [9, 13], [13, 17]
]

// Per-hand color schemes
const HAND_COLORS = [
    { line: '#a855f7', dot: '#a855f7', tip: '#22c55e', wrist: '#ef4444' },  // Purple
    { line: '#06b6d4', dot: '#06b6d4', tip: '#f59e0b', wrist: '#ef4444' },  // Cyan
]

export default function SignDetectionGoogleStyle() {
    const [isCameraOn, setIsCameraOn] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const webcamRef = useRef<Webcam>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const [prediction, setPrediction] = useState<string | null>(null)
    const [confidence, setConfidence] = useState<number>(0)
    const [showSkeleton, setShowSkeleton] = useState(true)

    const [builtWord, setBuiltWord] = useState('')
    const [totalDetections, setTotalDetections] = useState(0)

    // Auto-add state
    const [streakLetter, setStreakLetter] = useState<string | null>(null)
    const [streakCount, setStreakCount] = useState(0)
    const [lastAddedLetter, setLastAddedLetter] = useState<string | null>(null)
    const [lastAddedTime, setLastAddedTime] = useState(0)
    const [addedFeedback, setAddedFeedback] = useState<string | null>(null)

    // Client-side MediaPipe refs
    const handLandmarkerRef = useRef<any>(null)
    const animationFrameRef = useRef<number | null>(null)
    const [handLandmarkerReady, setHandLandmarkerReady] = useState(false)
    const [handsDetected, setHandsDetected] = useState(0)

    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    // Initialize client-side MediaPipe HandLandmarker
    useEffect(() => {
        let cancelled = false

        async function initHandLandmarker() {
            try {
                const vision = await import('@mediapipe/tasks-vision')
                const { HandLandmarker, FilesetResolver } = vision

                const filesetResolver = await FilesetResolver.forVisionTasks(HAND_LANDMARKER_WASM)

                let handLandmarker
                try {
                    handLandmarker = await HandLandmarker.createFromOptions(filesetResolver, {
                        baseOptions: {
                            modelAssetPath: HAND_LANDMARKER_MODEL,
                            delegate: 'GPU'
                        },
                        runningMode: 'VIDEO',
                        numHands: 2,
                        minHandDetectionConfidence: 0.5,
                        minHandPresenceConfidence: 0.5,
                        minTrackingConfidence: 0.5
                    })
                } catch (e) {
                    console.warn('GPU HandLandmarker failed, falling back to CPU', e)
                    handLandmarker = await HandLandmarker.createFromOptions(filesetResolver, {
                        baseOptions: {
                            modelAssetPath: HAND_LANDMARKER_MODEL,
                            delegate: 'CPU'
                        },
                        runningMode: 'VIDEO',
                        numHands: 2,
                        minHandDetectionConfidence: 0.5,
                        minHandPresenceConfidence: 0.5,
                        minTrackingConfidence: 0.5
                    })
                }

                if (!cancelled) {
                    handLandmarkerRef.current = handLandmarker
                    setHandLandmarkerReady(true)
                    console.log('✓ Client-side HandLandmarker initialized')
                }
            } catch (err) {
                console.error('Failed to init HandLandmarker:', err)
            }
        }

        initHandLandmarker()
        return () => { cancelled = true }
    }, [])

    // Real-time hand tracking loop using requestAnimationFrame
    useEffect(() => {
        if (!isCameraOn || !showSkeleton || !handLandmarkerReady) {
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d')
                if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
            }
            return
        }

        let lastTimestamp = -1

        function detectAndDraw() {
            const video = webcamRef.current?.video
            const canvas = canvasRef.current
            const handLandmarker = handLandmarkerRef.current

            if (!video || !canvas || !handLandmarker || video.readyState < 2) {
                animationFrameRef.current = requestAnimationFrame(detectAndDraw)
                return
            }

            const rect = video.getBoundingClientRect()
            if (canvas.width !== rect.width || canvas.height !== rect.height) {
                canvas.width = rect.width
                canvas.height = rect.height
            }

            const ctx = canvas.getContext('2d')
            if (!ctx) {
                animationFrameRef.current = requestAnimationFrame(detectAndDraw)
                return
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height)

            const now = performance.now()
            if (now !== lastTimestamp) {
                lastTimestamp = now

                try {
                    const results = handLandmarker.detectForVideo(video, now)

                    if (results.landmarks && results.landmarks.length > 0) {
                        setHandsDetected(results.landmarks.length)

                        results.landmarks.forEach((landmarks: any[], handIndex: number) => {
                            const colors = HAND_COLORS[handIndex % HAND_COLORS.length]

                            ctx.strokeStyle = colors.line
                            ctx.lineWidth = 3
                            ctx.lineCap = 'round'
                            HAND_CONNECTIONS.forEach(([start, end]) => {
                                const s = landmarks[start]
                                const e = landmarks[end]
                                if (!s || !e) return
                                const sx = (1 - s.x) * canvas.width
                                const sy = s.y * canvas.height
                                const ex = (1 - e.x) * canvas.width
                                const ey = e.y * canvas.height
                                ctx.beginPath()
                                ctx.moveTo(sx, sy)
                                ctx.lineTo(ex, ey)
                                ctx.stroke()
                            })

                            landmarks.forEach((lm: any, index: number) => {
                                const x = (1 - lm.x) * canvas.width
                                const y = lm.y * canvas.height
                                if (index === 0) ctx.fillStyle = colors.wrist
                                else if ([4, 8, 12, 16, 20].includes(index)) ctx.fillStyle = colors.tip
                                else ctx.fillStyle = colors.dot
                                ctx.beginPath()
                                ctx.arc(x, y, 5, 0, 2 * Math.PI)
                                ctx.fill()
                                ctx.strokeStyle = '#ffffff'
                                ctx.lineWidth = 1.5
                                ctx.stroke()
                            })
                        })
                    } else {
                        setHandsDetected(0)
                    }
                } catch {
                    // Ignore transient detection errors
                }
            }

            animationFrameRef.current = requestAnimationFrame(detectAndDraw)
        }

        animationFrameRef.current = requestAnimationFrame(detectAndDraw)

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
                animationFrameRef.current = null
            }
        }
    }, [isCameraOn, showSkeleton, handLandmarkerReady])

    // Backend prediction loop
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
                setTotalDetections(prev => prev + 1)
            }
        } catch (error) {
            console.error('Prediction error:', error)
        } finally {
            setIsProcessing(false)
        }
    }, [isProcessing])

    const startCamera = useCallback(() => {
        setIsCameraOn(true)
        intervalRef.current = setInterval(() => {
            captureAndPredict()
        }, 500)
    }, [])

    const stopCamera = useCallback(() => {
        setIsCameraOn(false)
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
        setPrediction(null)
        setStreakLetter(null)
        setStreakCount(0)
        setHandsDetected(0)
    }, [])

    // Auto-add letter logic
    useEffect(() => {
        if (!prediction || prediction === 'Unknown' || prediction === '?' || confidence < AUTO_ADD_CONFIDENCE) {
            setStreakLetter(null)
            setStreakCount(0)
            return
        }

        if (prediction === streakLetter) {
            const newCount = streakCount + 1
            setStreakCount(newCount)

            if (newCount >= AUTO_ADD_STREAK) {
                const now = Date.now()
                if (prediction !== lastAddedLetter || (now - lastAddedTime) > COOLDOWN_MS) {
                    setBuiltWord(prev => prev + prediction)
                    setLastAddedLetter(prediction)
                    setLastAddedTime(now)
                    setAddedFeedback(`+${prediction}`)
                    setTimeout(() => setAddedFeedback(null), 1000)

                    if ('speechSynthesis' in window) {
                        const utterance = new SpeechSynthesisUtterance(prediction)
                        utterance.rate = 1.2
                        window.speechSynthesis.speak(utterance)
                    }
                }
                setStreakCount(0)
            }
        } else {
            setStreakLetter(prediction)
            setStreakCount(1)
        }
    }, [prediction, confidence, totalDetections])

    const addLetterToWord = useCallback(() => {
        if (prediction && prediction !== 'Unknown' && prediction !== '?' && confidence > AUTO_ADD_CONFIDENCE) {
            setBuiltWord(prev => prev + prediction)
            setLastAddedLetter(prediction)
            setLastAddedTime(Date.now())
            setAddedFeedback(`+${prediction}`)
            setTimeout(() => setAddedFeedback(null), 1000)
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(prediction)
                utterance.rate = 1.2
                window.speechSynthesis.speak(utterance)
            }
        }
    }, [prediction, confidence])

    const backspaceLetter = useCallback(() => {
        setBuiltWord(prev => prev.slice(0, -1))
    }, [])

    const addSpace = useCallback(() => {
        setBuiltWord(prev => prev + ' ')
    }, [])

    const clearWord = useCallback(() => setBuiltWord(''), [])
    const speakWord = useCallback(() => {
        if (builtWord && 'speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(builtWord)
            window.speechSynthesis.speak(utterance)
        }
    }, [builtWord])

    useEffect(() => {
        return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    }, [])

    const wordLetters = builtWord.split('')

    const autoAddProgress = streakLetter && prediction === streakLetter
        ? Math.min((streakCount / AUTO_ADD_STREAK) * 100, 100)
        : 0

    return (
        <div className="min-h-screen bg-[#f5f5f7] font-sans">
            <FloatingSidebar activeId="detection" />

            <main className="ml-[100px] min-h-screen overflow-y-auto">
                <div className="p-7">

                    {/* Top bar */}
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">Sign Detection</h1>
                        <div className="w-10 h-10 bg-purple-600 flex items-center justify-center text-white font-bold text-[13px]" style={{ borderRadius: 12 }}>
                            S
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-5 gap-6">
                        {/* Camera Column (3/5) */}
                        <div className="lg:col-span-3">
                            {/* Detection Info Card - WHITE */}
                            <div
                                className="bg-white p-5 mb-4 border border-gray-100"
                                style={{ borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">✋</span>
                                        <span className="text-gray-900 font-bold text-[14px]">Real-time Detection</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {handsDetected > 0 && (
                                            <span className="text-[11px] font-semibold px-2.5 py-1 bg-cyan-50 text-cyan-600 border border-cyan-200" style={{ borderRadius: 8 }}>
                                                {handsDetected} hand{handsDetected > 1 ? 's' : ''}
                                            </span>
                                        )}
                                        <span className={`text-[11px] font-semibold px-3 py-1 ${isCameraOn
                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                            : 'bg-gray-50 text-gray-400 border border-gray-200'
                                            }`} style={{ borderRadius: 8 }}>
                                            {isCameraOn ? 'Active' : 'Paused'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div>
                                        <div className="text-[11px] text-gray-400 font-medium mb-0.5">Current Letter</div>
                                        <div className="text-[36px] font-bold text-gray-900 leading-none">
                                            {prediction || '—'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] text-gray-400 font-medium mb-0.5">Confidence</div>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-[28px] font-bold leading-none ${confidence > 0.85 ? 'text-emerald-500' :
                                                confidence > 0.6 ? 'text-amber-500' : 'text-gray-300'
                                                }`}>
                                                {confidence > 0 ? `${(confidence * 100).toFixed(0)}%` : '—'}
                                            </span>
                                            {confidence > 0 && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                                        </div>
                                    </div>
                                    {/* Auto-add progress indicator */}
                                    {isCameraOn && autoAddProgress > 0 && (
                                        <div className="flex-1">
                                            <div className="text-[11px] text-gray-400 font-medium mb-1.5">Auto-add</div>
                                            <div className="h-2 bg-gray-100 overflow-hidden" style={{ borderRadius: 4 }}>
                                                <motion.div
                                                    className="h-full bg-purple-500"
                                                    style={{ borderRadius: 4 }}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${autoAddProgress}%` }}
                                                    transition={{ duration: 0.3 }}
                                                />
                                            </div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">
                                                Hold steady to auto-add &quot;{streakLetter}&quot;
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Camera Feed - DARK (camera stays dark for contrast) */}
                            <div
                                className="bg-[#1a1a2e] overflow-hidden mb-4"
                                style={{ borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
                            >
                                <div className="relative aspect-video bg-[#12121f]">
                                    {isCameraOn ? (
                                        <>
                                            <Webcam
                                                ref={webcamRef}
                                                screenshotFormat="image/jpeg"
                                                className="w-full h-full object-cover"
                                                mirrored
                                            />
                                            {showSkeleton && (
                                                <canvas
                                                    ref={canvasRef}
                                                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                                                />
                                            )}
                                            {isProcessing && (
                                                <div className="absolute top-4 right-4">
                                                    <div className="w-7 h-7 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                                </div>
                                            )}
                                            {/* Loading indicator for HandLandmarker */}
                                            {!handLandmarkerReady && (
                                                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 px-3 py-1.5 text-white/80 text-[11px]" style={{ borderRadius: 8 }}>
                                                    <div className="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                                                    Loading hand tracker...
                                                </div>
                                            )}
                                            {/* Auto-add feedback popup */}
                                            <AnimatePresence>
                                                {addedFeedback && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.5, y: -20 }}
                                                        className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-purple-600 text-white font-bold text-2xl px-6 py-3 shadow-lg shadow-purple-500/30"
                                                        style={{ borderRadius: 14 }}
                                                    >
                                                        {addedFeedback}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center">
                                            <Camera className="w-12 h-12 text-white/20 mb-3" />
                                            <p className="text-white/30 text-[13px]">Camera is off</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {!isCameraOn ? (
                                <Button
                                    onClick={startCamera}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-[14px] h-12"
                                    style={{ borderRadius: 14 }}
                                >
                                    Start Detection
                                </Button>
                            ) : (
                                <div className="flex gap-3">
                                    <Button
                                        onClick={stopCamera}
                                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-500 font-semibold text-[13px] h-11 border border-red-200"
                                        style={{ borderRadius: 12 }}
                                    >
                                        <CameraOff className="w-4 h-4 mr-2" />
                                        Stop
                                    </Button>
                                    <Button
                                        onClick={() => setShowSkeleton(!showSkeleton)}
                                        className={`flex-1 font-semibold text-[13px] h-11 border ${showSkeleton
                                            ? 'bg-purple-50 border-purple-200 text-purple-600'
                                            : 'bg-gray-50 border-gray-200 text-gray-400'
                                            }`}
                                        style={{ borderRadius: 12 }}
                                    >
                                        <Hand className="w-4 h-4 mr-2" />
                                        Skeleton
                                    </Button>
                                    <Button
                                        onClick={addLetterToWord}
                                        disabled={!prediction || prediction === 'Unknown' || prediction === '?' || confidence < AUTO_ADD_CONFIDENCE}
                                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[13px] h-11 disabled:opacity-30"
                                        style={{ borderRadius: 12 }}
                                    >
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Add Letter
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Word Builder Column (2/5) */}
                        <div className="lg:col-span-2 space-y-5">
                            {/* Word Builder - WHITE */}
                            <div
                                className="bg-white p-5 border border-gray-100"
                                style={{ borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
                            >
                                <div className="flex items-center gap-2 mb-5">
                                    <span className="text-lg">✨</span>
                                    <h3 className="text-gray-900 font-bold text-[15px]">Word Builder</h3>
                                    <span className="text-[10px] text-purple-600 bg-purple-50 px-2 py-0.5 ml-auto font-medium border border-purple-200" style={{ borderRadius: 6 }}>
                                        Auto-add
                                    </span>
                                </div>

                                <div className="bg-gray-50 p-5 mb-5 text-center border border-gray-100" style={{ borderRadius: 14 }}>
                                    <div className="text-[28px] font-mono font-bold text-gray-900 tracking-[0.2em] mb-1.5 min-h-[40px]">
                                        {builtWord || '_ _ _'}
                                        <span className="animate-pulse text-purple-400">_</span>
                                    </div>
                                    <p className="text-gray-400 text-[12px]">
                                        {builtWord.length > 0 ? `${builtWord.length} characters` : 'Hold signs steady to auto-build words'}
                                    </p>
                                </div>

                                {wordLetters.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-5">
                                        {wordLetters.map((letter, i) => (
                                            <motion.div
                                                key={`${i}-${letter}`}
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className={`w-10 h-10 flex items-center justify-center font-bold text-[14px] ${letter === ' '
                                                    ? 'bg-gray-100 text-gray-400 border border-gray-200'
                                                    : 'bg-purple-600 text-white'
                                                    }`}
                                                style={{ borderRadius: 10 }}
                                            >
                                                {letter === ' ' ? '␣' : letter}
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                {/* Word builder controls */}
                                <div className="grid grid-cols-4 gap-2 mb-3">
                                    <Button
                                        onClick={addSpace}
                                        className="bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium text-[12px] h-9 border border-gray-200"
                                        style={{ borderRadius: 10 }}
                                    >
                                        Space
                                    </Button>
                                    <Button
                                        onClick={backspaceLetter}
                                        disabled={!builtWord}
                                        className="bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium text-[12px] h-9 border border-gray-200 disabled:opacity-30"
                                        style={{ borderRadius: 10 }}
                                    >
                                        ⌫ Back
                                    </Button>
                                    <Button
                                        onClick={clearWord}
                                        disabled={!builtWord}
                                        className="bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium text-[12px] h-9 border border-gray-200 disabled:opacity-30"
                                        style={{ borderRadius: 10 }}
                                    >
                                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                                        Clear
                                    </Button>
                                    <Button
                                        onClick={speakWord}
                                        disabled={!builtWord}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[12px] h-9 disabled:opacity-30"
                                        style={{ borderRadius: 10 }}
                                    >
                                        <Volume2 className="w-3.5 h-3.5 mr-1" />
                                        Speak
                                    </Button>
                                </div>
                            </div>

                            {/* Tips - WHITE */}
                            <div
                                className="bg-white p-5 border border-gray-100"
                                style={{ borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
                            >
                                <h3 className="text-gray-700 text-[12px] font-semibold flex items-center gap-2 mb-3">
                                    <Info className="w-3.5 h-3.5 text-purple-500" />
                                    Detection Tips
                                </h3>
                                <div className="space-y-1.5 text-[11px] text-gray-400 leading-relaxed">
                                    <p>• Show your hand clearly in the frame</p>
                                    <p>• Skeleton tracks in real-time — appears/disappears instantly</p>
                                    <p>• Both hands tracked (purple + cyan)</p>
                                    <p>• Hold each sign steady for ~2s to auto-add</p>
                                    <p>• Confidence &gt; 70% required to add letters</p>
                                </div>
                            </div>

                            {/* Stats - WHITE */}
                            <div className="grid grid-cols-2 gap-3">
                                <div
                                    className="bg-white p-4 text-center border border-gray-100"
                                    style={{ borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
                                >
                                    <div className="text-[22px] font-bold text-gray-900">{totalDetections}</div>
                                    <div className="text-[10px] text-gray-400 font-medium">Detections</div>
                                </div>
                                <div
                                    className="bg-white p-4 text-center border border-gray-100"
                                    style={{ borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
                                >
                                    <div className="text-[22px] font-bold text-gray-900">{builtWord.length}</div>
                                    <div className="text-[10px] text-gray-400 font-medium">Letters Built</div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    )
}
