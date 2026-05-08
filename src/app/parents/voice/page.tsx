'use client'

import { useState, useEffect, useCallback } from 'react'
import ParentSidebar from '@/components/parents/ParentSidebar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Volume2, AlertCircle, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'

// Define SpeechRecognition types as they are not fully standard in TS yet
interface IWindow extends Window {
    SpeechRecognition?: any
    webkitSpeechRecognition?: any
}

export default function VoiceTranslatorPage() {
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [recognition, setRecognition] = useState<any>(null)

    // Initialize Web Speech API
    useEffect(() => {
        const { SpeechRecognition, webkitSpeechRecognition } = window as unknown as IWindow
        const SpeechRecognitionApi = SpeechRecognition || webkitSpeechRecognition

        if (!SpeechRecognitionApi) {
            setError("Your browser does not support the Web Speech API. Please try Chrome, Edge, or Safari.")
            return
        }

        const recog = new SpeechRecognitionApi()
        recog.continuous = true
        recog.interimResults = true // Show partial results while talking
        recog.lang = 'en-US'

        recog.onresult = (event: any) => {
            let currentTranscript = ''
            for (let i = event.resultIndex; i < event.results.length; i++) {
                currentTranscript += event.results[i][0].transcript
            }
            setTranscript(currentTranscript)
        }

        recog.onerror = (event: any) => {
            console.error("Speech recognition error:", event.error)
            if (event.error !== 'no-speech') {
                setError(`Microphone error: ${event.error}`)
                setIsListening(false)
            }
        }

        recog.onend = () => {
            // If it stops automatically, restart if we're supposed to be listening
            // Note: browsers may stop listening after a pause.
            setIsListening(false)
        }

        setRecognition(recog)
    }, [])

    const toggleListening = () => {
        if (!recognition) return

        if (isListening) {
            recognition.stop()
            setIsListening(false)
        } else {
            setError(null)
            try {
                recognition.start()
                setIsListening(true)
            } catch (err) {
                console.error(err)
            }
        }
    }

    const clearTranscript = () => {
        setTranscript('')
    }

    // Prepare characters for the fingerspelling view
    // Clean string, uppercase, remove spaces at ends, keep internal spaces
    const cleanTranscript = transcript.trim().toUpperCase()
    const characters = cleanTranscript.split('')

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <ParentSidebar />

            <main className="flex-1 lg:ml-64 p-4 sm:p-8 flex flex-col h-screen">
                <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col space-y-6 max-h-full">

                    {/* Header */}
                    <div className="flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                <Volume2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black tracking-tight text-gray-900">Voice to ISL Translator</h1>
                                <p className="text-gray-500 mt-1">Speak into your microphone to generate real-time Indian Sign Language spelling.</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Interface Layout */}
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 pb-8">

                        {/* Left/Top: Voice Input Area */}
                        <Card className="lg:col-span-5 flex flex-col shadow-md border-indigo-100/50">
                            <CardContent className="p-6 flex-1 flex flex-col">

                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="font-bold text-gray-800">Live Transcription</h2>
                                    {isListening ? (
                                        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 animate-pulse">
                                            <div className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                                            Listening
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200">
                                            Paused
                                        </Badge>
                                    )}
                                </div>

                                {/* Text Box */}
                                <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 p-4 mb-6 relative overflow-hidden">
                                    {transcript ? (
                                        <p className="text-xl text-gray-800 font-medium leading-relaxed overflow-y-auto h-full pr-2">
                                            {transcript}
                                        </p>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                            {isListening ? (
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="flex gap-1">
                                                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                                    </div>
                                                    <p>Go ahead, I'm listening...</p>
                                                </div>
                                            ) : (
                                                <p>Press the microphone button to start speaking.</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 rounded-lg text-sm text-red-600 flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <p>{error}</p>
                                    </div>
                                )}

                                {/* Controls */}
                                <div className="flex gap-3">
                                    <Button
                                        size="lg"
                                        className={`flex-1 transition-all shadow-md ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                        onClick={toggleListening}
                                        disabled={!recognition}
                                    >
                                        {isListening ? (
                                            <><MicOff className="w-5 h-5 mr-2" /> Stop Recording</>
                                        ) : (
                                            <><Mic className="w-5 h-5 mr-2" /> Start Recording</>
                                        )}
                                    </Button>

                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={clearTranscript}
                                        disabled={!transcript}
                                    >
                                        Clear
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Right/Bottom: ISL Translation Area */}
                        <Card className="lg:col-span-7 flex flex-col bg-slate-900 border-slate-800 text-white shadow-xl overflow-hidden">
                            <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center z-10">
                                <h2 className="font-bold text-slate-200">ISL Dataset Translation</h2>
                                {cleanTranscript.length > 0 && (
                                    <Badge className="bg-indigo-500/20 text-indigo-300 border-none">
                                        {cleanTranscript.length} characters
                                    </Badge>
                                )}
                            </div>

                            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                                <AnimatePresence mode="popLayout">
                                    {characters.length > 0 ? (
                                        <motion.div
                                            key="translation-container"
                                            className="flex flex-wrap gap-x-2 gap-y-4 items-end content-start min-h-full"
                                        >
                                            {characters.map((char, index) => {
                                                // Handle spaces between words
                                                if (char === ' ') {
                                                    return <div key={`space-${index}`} className="w-8 h-20" />
                                                }

                                                // Handle valid alphabet or numbers (A-Z, 0-9)
                                                // If it's punctuation, we might skip it or show text, but for ISL we usually skip or spell.
                                                const isValidChar = /^[A-Z0-9]$/.test(char)

                                                if (!isValidChar) return null

                                                return (
                                                    <motion.div
                                                        key={`${char}-${index}`}
                                                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        transition={{
                                                            type: 'spring',
                                                            stiffness: 400,
                                                            damping: 25,
                                                            mass: 0.5
                                                        }}
                                                        className="flex flex-col items-center"
                                                    >
                                                        <div className="w-[68px] h-[68px] sm:w-[84px] sm:h-[84px] bg-slate-800 rounded-xl border-2 border-slate-700 flex items-center justify-center overflow-hidden shadow-lg relative group">
                                                            <img
                                                                src={`http://localhost:8000/dataset-image/${char}`}
                                                                alt={`ISL Sign for ${char}`}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    // Fallback for missing characters
                                                                    e.currentTarget.style.display = 'none';
                                                                    e.currentTarget.parentElement!.innerHTML = `<span class="text-3xl font-black text-slate-500">${char}</span>`;
                                                                }}
                                                            />
                                                            {/* Overlay letter */}
                                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1 pt-3">
                                                                <p className="text-center font-bold text-white text-sm leading-none drop-shadow-md">{char}</p>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )
                                            })}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="empty-state"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="h-full flex flex-col items-center justify-center text-slate-500 text-center px-4"
                                        >
                                            <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-700">
                                                <Mic className="w-8 h-8 text-slate-400 opacity-50" />
                                            </div>
                                            <p className="text-lg font-medium text-slate-300">Awaiting speech</p>
                                            <p className="text-sm mt-2 max-w-sm">Translation will appear here instantly as you speak, mapping your words to live dataset images.</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </Card>
                    </div>

                </div>
            </main>

            {/* Global style for dark scrollbar inside the translation box */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #334155;
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: #475569;
                }
            `}} />
        </div>
    )
}
