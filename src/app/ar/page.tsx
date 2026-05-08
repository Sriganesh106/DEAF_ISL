'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Headset, Info, Heart } from 'lucide-react'
import FloatingSidebar from '@/components/ui/FloatingSidebar'

interface ARLesson {
    id: string
    name: string
    description: string
    sceneType: string
    interactions: string[]
    qrImage?: string | null
}

export default function ARPage() {
    const [lessons, setLessons] = useState<ARLesson[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLessons = async () => {
            try {
                const res = await fetch('/api/ar-lessons')
                const data = await res.json()
                if (data.success) setLessons(data.lessons)
            } catch (err) {
                console.error('Failed to fetch AR lessons:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchLessons()
    }, [])

    return (
        <div className="min-h-screen bg-[#f8f9fa] font-sans">
            <FloatingSidebar activeId="ar" />

            <main className="ml-[100px] min-h-screen overflow-y-auto">
                <div className="p-8 w-full max-w-5xl">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">
                                AR Experiences
                            </h1>
                            <p className="text-sm text-gray-500">
                                Scan the QR code to view in AR
                            </p>
                        </div>
                        <div className="w-10 h-10 bg-gray-900 flex items-center justify-center text-white rounded-xl shadow-sm">
                            <Headset className="w-5 h-5" />
                        </div>
                    </div>

                    {/* How It Works */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-gray-200 p-6 mb-8 flex items-start gap-5 shadow-sm rounded-2xl"
                    >
                        <div className="w-10 h-10 bg-gray-50 flex items-center justify-center shrink-0 rounded-lg border border-gray-100">
                            <Info className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 mb-2">How to use AR</h3>
                            <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside leading-relaxed">
                                <li>Open your phone camera and scan the QR code below.</li>
                                <li>Point your device at a flat surface to place the 3D model.</li>
                                <li>Rotate, zoom, and tap to explore!</li>
                            </ol>
                        </div>
                    </motion.div>

                    {/* Human Skeleton QR Card */}
                    {loading ? (
                        <div className="bg-white border border-gray-100 animate-pulse overflow-hidden rounded-2xl p-8">
                            <div className="h-64 bg-gray-100 rounded-xl mb-4" />
                            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                            <div className="h-3 bg-gray-100 rounded w-full" />
                        </div>
                    ) : lessons.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {lessons.map((lesson) => (
                                <motion.div
                                    key={lesson.id}
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white border border-gray-100 overflow-hidden rounded-2xl flex flex-col"
                                    style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}
                                >
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-12 h-12 flex items-center justify-center bg-rose-50 text-rose-600 rounded-xl">
                                                <Heart className="w-6 h-6" strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">{lesson.name}</h2>
                                                <p className="text-sm text-gray-500 line-clamp-2">{lesson.description}</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-center justify-center flex-1">
                                            <img
                                                src={lesson.qrImage || '/human%20skleton.jpeg'}
                                                alt={`${lesson.name} AR QR Code`}
                                                className="w-48 h-48 object-contain"
                                            />
                                        </div>

                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {lesson.interactions.map((int) => (
                                                <span
                                                    key={int}
                                                    className="text-xs bg-gray-100 text-gray-600 font-medium px-3 py-1.5 rounded-lg"
                                                >
                                                    {int}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>


                    ) : null}
                </div>
            </main>
        </div>
    )
}
