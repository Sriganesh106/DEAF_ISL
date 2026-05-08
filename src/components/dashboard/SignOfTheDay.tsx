'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, X, Loader2, Youtube } from 'lucide-react'

// Define the shape of a video object
interface Video {
    id: string
    title: string
    thumbnail: string
}

function decodeHtml(html: string) {
    if (typeof document === 'undefined') return html
    const txt = document.createElement('textarea')
    txt.innerHTML = html
    return txt.value
}

export default function SignOfTheDay() {
    const [video, setVideo] = useState<Video | null>(null)
    const [loading, setLoading] = useState(true)
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        const fetchSignOfTheDay = async () => {
            try {
                // Fetch a single sign of the day video
                // Our YouTube API route backend (/api/youtube) automatically appends strict ASL exclusion filters string to all queries
                const res = await fetch('/api/youtube?q="Indian Sign Language" ISL sign of the day vocabulary&maxResults=1')
                const data = await res.json()
                if (data.success && data.videos && data.videos.length > 0) {
                    setVideo(data.videos[0])
                }
            } catch (err) {
                console.error("Failed to fetch sign of the day", err)
            } finally {
                setLoading(false)
            }
        }
        fetchSignOfTheDay()
    }, [])

    return (
        <div
            className="bg-white p-5 border border-gray-100 mt-6"
            style={{ borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
        >
            <div className="flex items-center gap-2 mb-4">
                <Youtube className="w-5 h-5 text-red-500" />
                <h2 className="text-[15px] font-bold text-gray-900">Sign of the Day</h2>
            </div>

            <div
                className="p-4 bg-indigo-50 border border-indigo-100 flex flex-col items-center text-center group cursor-pointer transition-shadow hover:shadow-md relative overflow-hidden"
                style={{ borderRadius: 12 }}
                onClick={() => video && setIsOpen(true)}
            >
                {loading ? (
                    <div className="py-6 flex flex-col items-center justify-center w-full">
                        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mb-2" />
                        <span className="text-[11px] text-indigo-500 font-medium">Fetching video...</span>
                    </div>
                ) : video ? (
                    <>
                        <div className="w-full aspect-video bg-black rounded-lg shadow-sm border border-indigo-100 overflow-hidden mb-3 relative flex items-center justify-center">
                            <img
                                src={video.thumbnail}
                                alt={decodeHtml(video.title)}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                                </div>
                            </div>
                        </div>
                        <h3 className="font-bold text-indigo-900 line-clamp-2 text-sm px-1 mb-1 leading-snug">
                            {decodeHtml(video.title)}
                        </h3>
                        <p className="text-[11px] text-indigo-600 font-medium mt-1">Practice this sign today via YouTube!</p>
                    </>
                ) : (
                    <div className="py-6 text-sm text-gray-500">Failed to load Sign of the Day</div>
                )}
            </div>

            {/* Video Modal */}
            <AnimatePresence>
                {isOpen && video && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full max-w-3xl overflow-hidden shadow-2xl relative"
                            style={{ borderRadius: 20 }}
                        >
                            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                                <h3 className="text-[15px] font-bold text-gray-900 truncate pr-4">
                                    {decodeHtml(video.title)}
                                </h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-8 h-8 bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors shrink-0"
                                    style={{ borderRadius: 8 }}
                                >
                                    <X className="w-4 h-4 text-gray-700" />
                                </button>
                            </div>
                            <div className="aspect-video bg-black w-full">
                                <iframe
                                    src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
                                    title={video.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full border-0"
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
