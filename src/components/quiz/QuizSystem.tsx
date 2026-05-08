'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Webcam from 'react-webcam'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
    Camera, CameraOff, Sparkles, CheckCircle2,
    Trophy, Flame, Clock, RefreshCw, XCircle
} from 'lucide-react'

interface QuizSystemProps {
    lessonId: string
    lessonTitle: string
    mode: 'interactive' | 'spell'
    gameType: 'standard' | 'speed-run' | 'memory-flash' | 'spelling-bee'
    onComplete: (score: number, passed: boolean) => void
}

const QUIZ_DATA: Record<string, string[]> = {
    'isl-a-j': ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
    'isl-k-t': ['K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'],
    'isl-u-z': ['U', 'V', 'W', 'X', 'Y', 'Z'],
    'isl-numbers': ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
    'isl-mixed': ['A', 'B', 'C', '1', '2', '3', 'X', 'Y', 'Z', 'M', 'P', 'R', '5', '7', '9'],
    'isl-spell': ['CAT', 'DOG', 'SUN', 'HAT', 'BOY', 'RED']
}

export default function QuizSystem({ lessonId, lessonTitle, mode, gameType, onComplete }: QuizSystemProps) {
    const [questions, setQuestions] = useState<string[]>(() => {
        const base = [...(QUIZ_DATA[lessonId] || ['A', 'B', 'C'])]
        return gameType === 'speed-run' ? base.sort(() => Math.random() - 0.5) : base
    })
    const [currentIndex, setCurrentIndex] = useState(0)

    // For spell mode
    const currentWord = questions[currentIndex] || ''
    const [spellIndex, setSpellIndex] = useState(0)

    // Camera & ML State
    const webcamRef = useRef<Webcam>(null)
    const [isCameraOn, setIsCameraOn] = useState(true)
    const [isProcessing, setIsProcessing] = useState(false)
    const [predictedLetter, setPredictedLetter] = useState<string | null>(null)
    const [confidence, setConfidence] = useState(0)

    // Quiz State
    const [score, setScore] = useState(0)
    const [streak, setStreak] = useState(0)
    const [timeLeft, setTimeLeft] = useState(gameType === 'speed-run' ? 30 : 60)
    const [showSuccessOverlay, setShowSuccessOverlay] = useState(false)
    const [isQuizComplete, setIsQuizComplete] = useState(false)
    const [showFlash, setShowFlash] = useState(true)

    // Handle Memory Flash: Hide target after 2 seconds
    useEffect(() => {
        if (gameType === 'memory-flash' && !isQuizComplete) {
            setShowFlash(true)
            const flashTimer = setTimeout(() => setShowFlash(false), 2000)
            return () => clearTimeout(flashTimer)
        }
    }, [currentIndex, gameType, isQuizComplete])

    const currentTarget = mode === 'interactive' ? (questions[currentIndex] || '') : (currentWord[spellIndex] || '')

    // Timer
    useEffect(() => {
        if (isQuizComplete || !isCameraOn) return
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer)
                    handleQuizComplete()
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [isQuizComplete, isCameraOn])

    const handleQuizComplete = useCallback(() => {
        setIsQuizComplete(true)
        setIsCameraOn(false)
        const passed = score >= (questions.length * 10 * 0.7) // 70% to pass
        onComplete(score, passed)
    }, [score, questions.length, onComplete])

    // Handle correct prediction
    const handleCorrectSign = useCallback(() => {
        setShowSuccessOverlay(true)
        setScore(prev => prev + 10 + (streak * 2)) // bonus points for streak
        setStreak(prev => prev + 1)

        setTimeout(() => {
            setShowSuccessOverlay(false)
            if (mode === 'interactive') {
                if (currentIndex < questions.length - 1) {
                    setCurrentIndex(prev => prev + 1)
                } else {
                    handleQuizComplete()
                }
            } else {
                // Spell mode progression
                if (spellIndex < currentWord.length - 1) {
                    setSpellIndex(prev => prev + 1)
                } else {
                    // Word finished
                    if (currentIndex < questions.length - 1) {
                        setCurrentIndex(prev => prev + 1)
                        setSpellIndex(0)
                    } else {
                        handleQuizComplete()
                    }
                }
            }
        }, 1200)
    }, [currentIndex, spellIndex, questions.length, currentWord, mode, streak, handleQuizComplete])


    // Predict loop
    const captureAndPredict = useCallback(async () => {
        if (!webcamRef.current || isProcessing || isQuizComplete || showSuccessOverlay) return

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
                setPredictedLetter(data.predictedLetter)
                setConfidence(data.confidence)

                if (data.predictedLetter === currentTarget && data.confidence > 0.8) {
                    handleCorrectSign()
                } else if (data.confidence > 0.8 && data.predictedLetter !== currentTarget && data.predictedLetter !== '?') {
                    // Reset streak if confident but wrong
                    setStreak(0)
                }
            }
        } catch (error) {
            console.error('Prediction error:', error)
        } finally {
            setIsProcessing(false)
        }
    }, [isProcessing, isQuizComplete, showSuccessOverlay, currentTarget, handleCorrectSign])

    // Auto-capture 
    useEffect(() => {
        if (!isCameraOn || isQuizComplete || showSuccessOverlay) return
        const interval = setInterval(captureAndPredict, 800) // Polling every 800ms
        return () => clearInterval(interval)
    }, [isCameraOn, isQuizComplete, showSuccessOverlay, captureAndPredict])


    if (isQuizComplete) {
        const _passed = score >= (questions.length * 10 * 0.7)
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="w-full h-full flex items-center justify-center p-6"
            >
                <Card className="max-w-md w-full text-center p-8 bg-white border-none shadow-2xl rounded-3xl">
                    <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${_passed ? 'bg-green-100' : 'bg-red-100'}`}>
                        {_passed ? <Trophy className="w-12 h-12 text-green-600" /> : <XCircle className="w-12 h-12 text-red-600" />}
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        {_passed ? 'Quiz Passed!' : 'Quiz Failed'}
                    </h2>
                    <p className="text-gray-500 mb-8">
                        {_passed ? "Great job! You've mastered this section." : "Keep practicing and try again."}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-indigo-50 rounded-2xl p-4">
                            <div className="text-3xl font-bold text-indigo-600 mb-1">{score}</div>
                            <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Total Score</div>
                        </div>
                        <div className="bg-orange-50 rounded-2xl p-4">
                            <div className="text-3xl font-bold text-orange-600 mb-1">{streak}</div>
                            <div className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">Best Streak</div>
                        </div>
                    </div>

                    <Button onClick={() => window.location.reload()} className="w-full bg-indigo-600 hover:bg-indigo-700 py-6 rounded-xl text-lg font-bold">
                        <RefreshCw className="w-5 h-5 mr-2" /> Play Again
                    </Button>
                </Card>
            </motion.div>
        )
    }

    return (
        <div className="w-full h-full flex flex-col lg:flex-row gap-6">
            {/* Left Col: Camera */}
            <div className="flex-1 flex flex-col h-full bg-slate-900 rounded-3xl overflow-hidden relative shadow-2xl">

                {/* Top Overlay Stats */}
                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10 bg-gradient-to-b from-black/80 to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-white font-bold border border-white/10 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-400" />
                            00:{timeLeft.toString().padStart(2, '0')}
                        </div>
                        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-white font-bold border border-white/10 flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-amber-400" />
                            {score} XP
                        </div>
                    </div>
                    {streak > 2 && (
                        <motion.div
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="bg-orange-500/20 backdrop-blur-md px-4 py-2 rounded-xl text-orange-300 font-bold border border-orange-500/30 flex items-center gap-2"
                        >
                            <Flame className="w-4 h-4" /> {streak} Streak!
                        </motion.div>
                    )}
                </div>

                {isCameraOn ? (
                    <div className="relative w-full h-full min-h-[400px]">
                        <Webcam
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            className="w-full h-full object-cover mirror"
                            mirrored
                        />

                        <AnimatePresence>
                            {showSuccessOverlay && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="absolute inset-0 bg-emerald-500/80 backdrop-blur-sm flex items-center justify-center z-20"
                                >
                                    <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="text-center">
                                        <CheckCircle2 className="w-24 h-24 text-white mx-auto mb-4" />
                                        <h3 className="text-4xl font-bold text-white tracking-widest">+10 XP</h3>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Current Target Overlay (Bottom) */}
                        <div className="absolute bottom-8 left-0 right-0 flex justify-center z-10">
                            <div className="bg-black/60 backdrop-blur-md border border-white/20 p-6 rounded-3xl flex items-center gap-6 shadow-2xl">
                                <div>
                                    <p className="text-white/60 text-sm font-bold uppercase tracking-widest mb-1">
                                        {gameType === 'memory-flash' ? (showFlash ? 'Remember This' : 'Sign It Now!') : 'Target Sign'}
                                    </p>
                                    {mode === 'interactive' ? (
                                        <div className={`text-6xl font-black transition-all duration-500 ${gameType === 'memory-flash' && !showFlash ? 'opacity-0 scale-50 blur-xl' : 'text-white'}`}>
                                            {currentTarget}
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            {currentWord?.split('').map((letter, i) => (
                                                <div
                                                    key={i}
                                                    className={`text-5xl font-black ${i < spellIndex ? 'text-emerald-400'
                                                        : i === spellIndex ? 'text-white'
                                                            : 'text-white/20'
                                                        }`}
                                                >
                                                    {letter}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="hidden sm:block w-px h-16 bg-white/20" />
                                <div className="hidden sm:block">
                                    <p className="text-white/60 text-sm font-bold uppercase tracking-widest mb-2">Progress</p>
                                    <div className="text-xl font-bold text-white">
                                        {currentIndex + 1} <span className="text-white/40">/ {questions.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 bg-slate-900">
                        <CameraOff className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg">Camera is disabled</p>
                    </div>
                )}
            </div>

            {/* Right Col: ML Status */}
            <div className="w-full lg:w-[320px] shrink-0 space-y-4 flex flex-col">
                <Card className="bg-white border-none shadow-sm rounded-2xl overflow-hidden flex-1 max-h-[300px]">
                    <CardContent className="p-6 h-full flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-[15px] font-bold text-gray-900">Live Detection</h3>
                                <p className="text-xs text-gray-500">AI Analyzing Hand Gestures</p>
                            </div>
                        </div>

                        <div className="text-center mb-6 bg-slate-50 py-8 rounded-2xl border border-slate-100">
                            <div className="text-7xl font-black text-indigo-600 mb-2">
                                {predictedLetter || '-'}
                            </div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                Predicted
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                <span className="text-gray-500">Confidence</span>
                                <span className={confidence > 0.8 ? 'text-emerald-500' : 'text-amber-500'}>
                                    {Math.round(confidence * 100)}%
                                </span>
                            </div>
                            <Progress value={confidence * 100} className={`h-2 ${confidence > 0.8 ? '[&>div]:bg-emerald-500' : '[&>div]:bg-amber-500 bg-slate-100'}`} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white border-none shadow-lg rounded-2xl">
                    <CardContent className="p-6">
                        <h3 className="font-bold mb-2 text-lg">Pro Tip</h3>
                        <p className="text-white/80 text-sm leading-relaxed mb-4">
                            Hold your hand steady in front of the camera. Ensure good lighting and a plain background for best results.
                        </p>
                        <Button
                            variant="secondary"
                            className="bg-white/20 hover:bg-white/30 text-white border-none w-full font-bold shadow-none"
                            onClick={() => setIsCameraOn(!isCameraOn)}
                        >
                            {isCameraOn ? <CameraOff className="w-4 h-4 mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
                            {isCameraOn ? 'Pause Camera' : 'Resume Camera'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
