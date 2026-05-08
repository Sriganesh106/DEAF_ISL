'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Newspaper, Loader2, X, Play } from 'lucide-react'

interface NewsVideo {
    id: string
    title: string
    description: string
    channelTitle: string
    publishedAt: string
}

function timeAgo(dateStr: string) {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    if (days < 365) return `${Math.floor(days / 30)}mo ago`
    return `${Math.floor(days / 365)}y ago`
}

function decodeHtml(html: string) {
    if (typeof document === 'undefined') return html
    const txt = document.createElement('textarea')
    txt.innerHTML = html
    return txt.value
}

export default function NewsFeed() {
    const [newsItems, setNewsItems] = useState<NewsVideo[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const [activeVideo, setActiveVideo] = useState<NewsVideo | null>(null)

    useEffect(() => {
        const fetchNews = async () => {
            try {
                // Fetch latest news related to deaf students from YouTube sorted by date
                const res = await fetch('/api/youtube?q=deaf students education news India&maxResults=5&order=date')
                const data = await res.json()
                if (data.success && data.videos) {
                    setNewsItems(data.videos)
                }
            } catch (err) {
                console.error("Failed to fetch news", err)
            } finally {
                setLoading(false)
            }
        }
        fetchNews()
    }, [])

    useEffect(() => {
        if (newsItems.length <= 1 || activeVideo) return // pause slider if modal open

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % newsItems.length)
        }, 4000)
        return () => clearInterval(timer)
    }, [newsItems.length, activeVideo])

    return (
        <div
            className="bg-white p-5 border border-gray-100 overflow-hidden relative"
            style={{ borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
        >
            <div className="flex items-center gap-2 mb-4">
                <Newspaper className="w-4 h-4 text-gray-400" />
                <h2 className="text-[15px] font-bold text-gray-900">Student News Feed</h2>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400 mb-2" />
                    <p className="text-xs text-gray-500">Fetching latest news...</p>
                </div>
            ) : newsItems.length > 0 ? (
                <>
                    <div className="relative h-[85px] w-full">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                onClick={() => setActiveVideo(newsItems[currentIndex])}
                                className="absolute inset-0 w-full p-3 bg-gray-50 border border-gray-100 cursor-pointer flex flex-col justify-center shadow-sm hover:shadow-md transition-shadow"
                                style={{ borderRadius: 12 }}
                            >
                                <div className="flex items-center justify-between mb-1 gap-2">
                                    <span className="text-[13px] font-semibold text-gray-900 truncate flex-1" title={decodeHtml(newsItems[currentIndex].title)}>
                                        {decodeHtml(newsItems[currentIndex].title)}
                                    </span>
                                    <span className="text-[10px] whitespace-nowrap font-bold px-1.5 py-0.5 bg-blue-50 text-blue-600 flex items-center gap-1" style={{ borderRadius: 4 }}>
                                        <Play className="w-2.5 h-2.5" fill="currentColor" /> Watch
                                    </span>
                                </div>
                                <p className="text-[11px] text-gray-500 mb-1 truncate">{newsItems[currentIndex].channelTitle}</p>
                                <span className="text-[10px] text-gray-400 font-medium">{timeAgo(newsItems[currentIndex].publishedAt)}</span>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="flex justify-center mt-4 gap-1.5 relative z-10">
                        {newsItems.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentIndex(i)}
                                className={`transition-all rounded-full h-1.5 ${i === currentIndex ? 'w-4 bg-indigo-600' : 'w-1.5 bg-gray-200 hover:bg-gray-300'}`}
                                aria-label={`Go to slide ${i + 1}`}
                            />
                        ))}
                    </div>
                </>
            ) : (
                <div className="py-6 text-center text-sm text-gray-500">No news available at the moment.</div>
            )}

            {/* Video Modal */}
            <AnimatePresence>
                {activeVideo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
                        onClick={() => setActiveVideo(null)}
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
                                    {decodeHtml(activeVideo.title)}
                                </h3>
                                <button
                                    onClick={() => setActiveVideo(null)}
                                    className="w-8 h-8 bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors shrink-0"
                                    style={{ borderRadius: 8 }}
                                >
                                    <X className="w-4 h-4 text-gray-700" />
                                </button>
                            </div>
                            <div className="aspect-video bg-black w-full">
                                <iframe
                                    src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1`}
                                    title={activeVideo.title}
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
