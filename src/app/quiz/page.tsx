'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Target, ArrowLeft, BookOpen, Star, Clock,
    ChevronRight, Zap, Award, Hash, MessageSquare,
    Play, Camera, GraduationCap, Flame, Trophy, Keyboard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import FloatingSidebar from '@/components/ui/FloatingSidebar'
import QuizSystem from '@/components/quiz/QuizSystem'
import { supabase } from '@/lib/supabase'

const DEMO_STUDENT_ID = '00000000-0000-0000-0000-000000000001'

interface QuizTopic {
    id: string
    lessonId: string
    title: string
    description: string
    icon: React.ElementType
    questionCount: number
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
    difficultyColor: string
    bgGradient: string
    iconBg: string
    category: string
    mode: 'interactive' | 'spell'
    gameType: 'standard' | 'speed-run' | 'memory-flash' | 'spelling-bee'
}

const quizTopics: QuizTopic[] = [
    {
        id: 'isl-a-j',
        lessonId: 'isl-a-j',
        title: 'Alphabets A–J',
        description: 'Master the first 10 letters of ISL. Perfect for beginners.',
        icon: BookOpen,
        questionCount: 10,
        difficulty: 'Beginner',
        difficultyColor: 'bg-green-50 text-green-600 border-green-200',
        bgGradient: 'from-emerald-500 to-teal-600',
        iconBg: 'bg-emerald-100',
        category: 'Alphabets',
        mode: 'interactive',
        gameType: 'standard',
    },
    {
        id: 'isl-k-t',
        lessonId: 'isl-k-t',
        title: 'Alphabets K–T',
        description: 'Next 10 letters. Slightly obscure hand shapes.',
        icon: Zap,
        questionCount: 10,
        difficulty: 'Intermediate',
        difficultyColor: 'bg-amber-50 text-amber-600 border-amber-200',
        bgGradient: 'from-amber-500 to-orange-600',
        iconBg: 'bg-amber-100',
        category: 'Alphabets',
        mode: 'interactive',
        gameType: 'standard',
    },
    {
        id: 'isl-u-z',
        lessonId: 'isl-u-z',
        title: 'Alphabets U–Z',
        description: 'Final 6 letters including dynamic signs like Z.',
        icon: Award,
        questionCount: 6,
        difficulty: 'Advanced',
        difficultyColor: 'bg-red-50 text-red-600 border-red-200',
        bgGradient: 'from-rose-500 to-pink-600',
        iconBg: 'bg-rose-100',
        category: 'Alphabets',
        mode: 'interactive',
        gameType: 'standard',
    },
    {
        id: 'isl-numbers',
        lessonId: 'isl-numbers',
        title: 'Numbers 1–9',
        description: 'Learn to count from 1 to 9 in ISL.',
        icon: Hash,
        questionCount: 9,
        difficulty: 'Beginner',
        difficultyColor: 'bg-blue-50 text-blue-600 border-blue-200',
        bgGradient: 'from-blue-500 to-cyan-600',
        iconBg: 'bg-blue-100',
        category: 'Numbers',
        mode: 'interactive',
        gameType: 'memory-flash',
    },
    {
        id: 'isl-mixed',
        lessonId: 'isl-mixed',
        title: 'Mixed Challenge',
        description: 'Random mix of Alphabets and Numbers. The ultimate test!',
        icon: Star,
        questionCount: 15,
        difficulty: 'Advanced',
        difficultyColor: 'bg-purple-50 text-purple-600 border-purple-200',
        bgGradient: 'from-violet-600 to-purple-800',
        iconBg: 'bg-violet-100',
        category: 'Mixed',
        mode: 'interactive',
        gameType: 'speed-run',
    },
    {
        id: 'isl-spell',
        lessonId: 'isl-spell',
        title: 'Spell the Word',
        description: 'Sign each letter to spell words! Camera + Letters combined.',
        icon: Keyboard,
        questionCount: 8,
        difficulty: 'Advanced',
        difficultyColor: 'bg-indigo-50 text-indigo-600 border-indigo-200',
        bgGradient: 'from-indigo-500 to-blue-700',
        iconBg: 'bg-indigo-100',
        category: 'Hybrid',
        mode: 'spell',
        gameType: 'spelling-bee',
    },
]

export default function QuizPage() {
    const [selectedTopic, setSelectedTopic] = useState<QuizTopic | null>(null)

    return (
        <div className="min-h-screen bg-[#f5f5f7] font-sans flex">
            <FloatingSidebar activeId="quiz" />

            <main className="flex-1 ml-[100px] min-h-screen overflow-y-auto">
                {/* ═══════ BLACK HEADER BAR (Start) ═══════ */}
                {/* Reusing exact style from LearnPage */}
                <div className="bg-gray-900 mx-6 mt-4 px-8 py-5 flex items-center justify-between sticky top-4 z-40 rounded-3xl shadow-xl">
                    <div>
                        <h1 className="text-[20px] font-bold text-white tracking-tight">
                            Interactive Quizzes
                        </h1>
                        <p className="text-[13px] text-gray-400 mt-0.5">
                            Test your skills with camera-based challenges
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 text-[12px] text-gray-300 rounded-xl">
                            <Target className="w-4 h-4" />
                            <span className="font-semibold text-white">{quizTopics.length}</span> Challenges
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 text-[12px] text-gray-300 rounded-xl">
                            <Flame className="w-4 h-4 text-orange-400" />
                            <span className="font-semibold text-white">0</span> Streak
                        </div>
                    </div>
                </div>
                {/* ═══════ HEADER END ═══════ */}

                <div className="p-8 pt-6">
                    <AnimatePresence mode="wait">
                        {!selectedTopic ? (
                            <motion.div
                                key="topics"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="w-full max-w-[1600px] mx-auto"
                            >
                                {/* Stats Bar (Matching Learn Page Style) */}
                                <div className="flex items-stretch gap-4 mb-8">
                                    <div className="flex items-center gap-3 bg-white border border-gray-200/60 rounded-xl px-5 py-3 shadow-sm flex-1">
                                        <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                                            <Camera className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        <div>
                                            <div className="text-[16px] font-bold text-gray-900 leading-tight">Camera Ready</div>
                                            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Interactive Mode</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white border border-gray-200/60 rounded-xl px-5 py-3 shadow-sm flex-1">
                                        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                                            <Trophy className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        <div>
                                            <div className="text-[16px] font-bold text-gray-900 leading-tight">Mastery</div>
                                            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Track Progress</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white border border-gray-200/60 rounded-xl px-5 py-3 shadow-sm flex-1">
                                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                                            <Clock className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <div className="text-[16px] font-bold text-gray-900 leading-tight">~2 Mins</div>
                                            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Avg Time</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Topic Grid */}
                                <div className="flex items-center gap-2 mb-4">
                                    <Target className="w-4 h-4 text-indigo-600" />
                                    <h2 className="text-[15px] font-bold text-gray-900">Select a Challenge</h2>
                                </div>

                                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                    {quizTopics.map((topic, i) => {
                                        const Icon = topic.icon
                                        return (
                                            <motion.div
                                                key={topic.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                whileHover={{ y: -4 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setSelectedTopic(topic)}
                                                className="bg-white border border-gray-200/60 rounded-xl cursor-pointer group overflow-hidden shadow-sm hover:shadow-md transition-all"
                                            >
                                                {/* Image/Gradient Area */}
                                                <div className={`h-28 bg-gradient-to-br ${topic.bgGradient} relative overflow-hidden`}>
                                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                                                    <div className="absolute bottom-3 left-4 flex items-center gap-2">
                                                        <span className="px-2 py-0.5 bg-black/30 backdrop-blur-md rounded text-[10px] font-bold text-white border border-white/10">
                                                            {topic.category}
                                                        </span>
                                                    </div>
                                                    <div className="absolute top-3 right-3 w-8 h-8 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/10">
                                                        <Icon className="w-4 h-4 text-white" />
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="p-4">
                                                    <h3 className="text-[14px] font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                                                        {topic.title}
                                                    </h3>
                                                    <p className="text-[12px] text-gray-500 leading-relaxed mb-4 line-clamp-2 h-9">
                                                        {topic.description}
                                                    </p>

                                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${topic.difficultyColor}`}>
                                                            {topic.difficulty}
                                                        </span>
                                                        <div className="flex items-center text-[10px] text-gray-400 font-medium">
                                                            <Clock className="w-3 h-3 mr-1" /> {topic.questionCount} Qs
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="quiz"
                                initial={{ opacity: 0, scale: 0.99 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.99 }}
                                className="w-full h-full"
                            >
                                {/* Quiz Header Bar */}
                                <div className="mb-6 flex items-center justify-between">
                                    <Button
                                        onClick={() => setSelectedTopic(null)}
                                        variant="ghost"
                                        size="sm"
                                        className="text-gray-500 hover:text-gray-900 -ml-2 text-[13px]"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-1.5" />
                                        Back to Topics
                                    </Button>
                                    <div className="text-[13px] font-bold text-gray-500 uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-gray-200">
                                        Playing: <span className="text-indigo-600 ml-1">{selectedTopic.title}</span>
                                    </div>
                                </div>

                                <div className="h-[calc(100vh-220px)] min-h-[500px]">
                                    <QuizSystem
                                        lessonId={selectedTopic.lessonId}
                                        lessonTitle={selectedTopic.title}
                                        mode={selectedTopic.mode}
                                        gameType={selectedTopic.gameType}
                                        onComplete={async (score, passed) => {
                                            console.log(`Quiz completed: ${score} points, ${passed ? 'Passed' : 'Failed'}`)

                                            // Save to quiz_results
                                            await supabase.from('quiz_results').insert({
                                                student_id: DEMO_STUDENT_ID,
                                                lesson_id: selectedTopic.lessonId,
                                                score_percent: score, // Store points here for now, or calculate percentage
                                                passed: passed
                                            })

                                            // Save to activity_log
                                            await supabase.from('activity_log').insert({
                                                student_id: DEMO_STUDENT_ID,
                                                action_type: 'quiz_completed',
                                                title: `Completed ${selectedTopic.title} Quiz`,
                                                description: `Scored ${score} points`,
                                                accuracy: passed ? 100 : 50 // Mocking accuracy for visual purposes
                                            })
                                        }}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    )
}
