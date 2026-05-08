'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import Webcam from 'react-webcam'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, CheckCircle2, Hand, Loader2, Shuffle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GestureAuthProps {
    onSuccess: () => void
}

// Pool of sign passwords — one is randomly selected each time
const SIGN_PASSWORDS = ['GAN', '855']

export default function GestureAuth({ onSuccess }: GestureAuthProps) {
    const webcamRef = useRef<Webcam>(null)
    const [isCameraOn, setIsCameraOn] = useState(false)
    const [detectedLetter, setDetectedLetter] = useState<string | null>(null)
    const [confidence, setConfidence] = useState(0)
    const [isProcessing, setIsProcessing] = useState(false)
    const [currentLetterIndex, setCurrentLetterIndex] = useState(0)
    const [holdCount, setHoldCount] = useState(0)
    const [isUnlocked, setIsUnlocked] = useState(false)
    const [statusText, setStatusText] = useState('Start camera to see your sign code')

    // Pick a random password on mount
    const targetWord = useMemo(() => {
        return SIGN_PASSWORDS[Math.floor(Math.random() * SIGN_PASSWORDS.length)]
    }, [])

    const REQUIRED_HOLDS = 2
    const letters = targetWord.split('')
    const currentTargetLetter = letters[currentLetterIndex] || ''

    // Set status text when camera turns on
    useEffect(() => {
        if (isCameraOn) {
            setStatusText('Scanning for gesture...')
        }
    }, [isCameraOn])

    // Capture and predict
    const captureAndPredict = useCallback(async () => {
        if (!webcamRef.current || isProcessing || isUnlocked) return

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
                setDetectedLetter(data.predictedLetter)
                setConfidence(data.confidence)

                if (data.predictedLetter === currentTargetLetter && data.confidence > 0.7) {
                    setHoldCount(prev => {
                        const newCount = prev + 1
                        if (newCount >= REQUIRED_HOLDS) {
                            const nextIndex = currentLetterIndex + 1
                            if (nextIndex >= letters.length) {
                                setIsUnlocked(true)
                                setStatusText('Access granted!')
                                setTimeout(() => onSuccess(), 1200)
                            } else {
                                setCurrentLetterIndex(nextIndex)
                                setStatusText('Accepted! Next sign...')
                            }
                            return 0
                        } else {
                            setStatusText('Hold steady...')
                            return newCount
                        }
                    })
                } else {
                    setHoldCount(0)
                    setStatusText('Scanning...')
                }
            }
        } catch (error) {
            console.error('Gesture auth error:', error)
            setStatusText('Connection error — retrying...')
        } finally {
            setIsProcessing(false)
        }
    }, [isProcessing, isUnlocked, currentTargetLetter, currentLetterIndex, letters, onSuccess])

    // Auto-capture loop
    useEffect(() => {
        if (!isCameraOn || isUnlocked) return
        const interval = setInterval(captureAndPredict, 1200)
        return () => clearInterval(interval)
    }, [isCameraOn, captureAndPredict, isUnlocked])

    const progressPercent = (currentLetterIndex / letters.length) * 100

    return (
        <div className="w-full space-y-4">
            {/* Camera View */}
            <div
                className="relative bg-gray-900 overflow-hidden"
                style={{ borderRadius: 12, aspectRatio: '4/3' }}
            >
                {isCameraOn ? (
                    <>
                        <Webcam
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            className="w-full h-full object-cover"
                            mirrored
                            videoConstraints={{
                                width: 320,
                                height: 240,
                                facingMode: 'user'
                            }}
                        />

                        {/* Progress dots — no letters shown, keeps it secret */}
                        <div className="absolute top-3 left-3 right-3 flex items-center gap-1.5">
                            {letters.map((_, i) => (
                                <div
                                    key={i}
                                    className={`flex-1 h-2 rounded-full transition-all ${i < currentLetterIndex
                                        ? 'bg-green-500'
                                        : i === currentLetterIndex
                                            ? 'bg-white/90 animate-pulse'
                                            : 'bg-white/20'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Processing Indicator */}
                        {isProcessing && (
                            <div className="absolute bottom-3 left-3">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                >
                                    <Loader2 className="w-5 h-5 text-indigo-400" />
                                </motion.div>
                            </div>
                        )}

                        {/* Detected Letter Display - REMOVED for secrecy */}

                        {/* Unlock Success Overlay */}
                        <AnimatePresence>
                            {isUnlocked && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 bg-green-600/90 backdrop-blur-sm flex flex-col items-center justify-center"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 300 }}
                                    >
                                        <CheckCircle2 className="w-16 h-16 text-white mb-3" />
                                    </motion.div>
                                    <p className="text-white font-bold text-lg">Access Granted!</p>
                                    <p className="text-white/70 text-sm">Entering classroom...</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                ) : (
                    /* Pre-camera view — NO password revealed */
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 py-10">
                        <div className="relative mb-4">
                            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
                                <Hand className="w-8 h-8 text-indigo-500" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                                <Camera className="w-3 h-3 text-indigo-600" />
                            </div>
                        </div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">Sign to Unlock</p>
                        <p className="text-xs text-gray-400 mb-4">Perform the secret sign sequence to enter</p>
                        <Button
                            onClick={() => setIsCameraOn(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm h-10 px-6"
                            style={{ borderRadius: 10 }}
                        >
                            <Camera className="w-4 h-4 mr-2" />
                            Start Camera
                        </Button>
                    </div>
                )}
            </div>

            {/* Status Bar */}
            {isCameraOn && (
                <div className="text-center">
                    <p className={`text-[12px] font-medium ${isUnlocked ? 'text-green-600' : 'text-gray-500'}`}>
                        {statusText}
                    </p>
                    {!isUnlocked && (
                        <div className="mt-2 h-1.5 bg-gray-100 overflow-hidden" style={{ borderRadius: 4 }}>
                            <motion.div
                                className="h-full bg-green-500"
                                style={{ borderRadius: 4 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
