'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Play, X, Loader2, Youtube, Clock, User, Captions } from 'lucide-react'

interface Video {
    id: string
    title: string
    description: string
    thumbnail: string
    thumbnailHigh?: string
    channelTitle: string
    publishedAt: string
}

const CATEGORIES = [
    { id: 'isl', label: 'ISL Tutorials', emoji: '🤟' },
    { id: 'deaf-culture', label: 'Deaf Culture', emoji: '🌍' },
    { id: 'communication', label: 'Daily Phrases', emoji: '💬' },
    { id: 'vocabulary', label: 'Vocabulary', emoji: '📚' },
    { id: 'stories', label: 'Stories & Poems', emoji: '📖' },
    { id: 'comedy', label: 'Comedy', emoji: '😂' },
    { id: 'news', label: 'News in ISL', emoji: '📰' },
]

function timeAgo(dateStr: string) {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    const months = Math.floor(days / 30)
    if (months < 12) return `${months}mo ago`
    return `${Math.floor(months / 12)}y ago`
}

function decodeHtml(html: string) {
    const txt = document.createElement('textarea')
    txt.innerHTML = html
    return txt.value
}

export interface DeafYouTubeProps {
    category?: string
    hideHeader?: boolean
}

export default function DeafYouTube({ category, hideHeader }: DeafYouTubeProps) {
    const [activeCategory, setActiveCategory] = useState(category || 'isl')
    const [videos, setVideos] = useState<Video[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeVideo, setActiveVideo] = useState<Video | null>(null)

    const fetchVideos = useCallback(async (category: string, query?: string) => {
        setLoading(true)
        setError(null)
        try {
            const params = new URLSearchParams()
            if (query) {
                params.set('q', query + ' sign language deaf')
            } else {
                params.set('category', category)
            }
            const res = await fetch(`/api/youtube?${params.toString()}`)
            const data = await res.json()
            if (data.success) {
                setVideos(data.videos)
            } else {
                setError(data.error || 'Failed to load videos')
            }
        } catch {
            setError('Failed to fetch videos')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (category) {
            setActiveCategory(category)
        }
    }, [category])

    useEffect(() => {
        fetchVideos(activeCategory)
    }, [activeCategory, fetchVideos])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            fetchVideos(activeCategory, searchQuery.trim())
        }
    }

    const handleCategoryChange = (id: string) => {
        setActiveCategory(id)
        setSearchQuery('')
    }

    return (
        <div>
            {/* Header */}
            {!hideHeader && (
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-red-600 flex items-center justify-center" style={{ borderRadius: 12 }}>
                        <Youtube className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-[18px] font-bold text-gray-900 tracking-tight">Video Learning Hub</h2>
                        <p className="text-[12px] text-gray-400 flex items-center gap-1">
                            <Captions className="w-3.5 h-3.5" />
                            Curated videos with captions for deaf students
                        </p>
                    </div>
                </div>
            )}

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search sign language videos..."
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
                        style={{ borderRadius: 12 }}
                    />
                </div>
            </form>

            {/* Category Tabs (Hide if controlled externally) */}
            {!category && (
                <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryChange(cat.id)}
                            className={`flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold whitespace-nowrap border transition-all ${activeCategory === cat.id
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                }`}
                            style={{ borderRadius: 10 }}
                        >
                            <span className="text-[14px]">{cat.emoji}</span>
                            {cat.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    <span className="ml-3 text-[13px] text-gray-400">Loading videos...</span>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div className="text-center py-16">
                    <p className="text-red-500 text-[14px] font-medium mb-2">{error}</p>
                    <button
                        onClick={() => fetchVideos(activeCategory)}
                        className="text-[12px] text-gray-500 underline hover:text-gray-700"
                    >
                        Try again
                    </button>
                </div>
            )}

            {/* Video Grid */}
            {!loading && !error && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {videos.map((video, i) => (
                        <motion.div
                            key={video.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            whileHover={{ y: -3 }}
                            onClick={() => setActiveVideo(video)}
                            className="bg-white border border-gray-100 overflow-hidden cursor-pointer group"
                            style={{ borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
                        >
                            {/* Thumbnail */}
                            <div className="relative aspect-video bg-gray-100 overflow-hidden">
                                <img
                                    src={video.thumbnail}
                                    alt={video.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                    <div className="w-10 h-10 bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all" style={{ borderRadius: '50%' }}>
                                        <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                                    </div>
                                </div>
                                {/* CC Badge */}
                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 flex items-center gap-1" style={{ borderRadius: 4 }}>
                                    <Captions className="w-3 h-3" /> CC
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-3.5">
                                <h3 className="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2 mb-2">
                                    {decodeHtml(video.title)}
                                </h3>
                                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {video.channelTitle}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {timeAgo(video.publishedAt)}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && videos.length === 0 && (
                <div className="text-center py-16">
                    <Youtube className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-[14px] text-gray-500 font-medium">No videos found</p>
                    <p className="text-[12px] text-gray-400 mt-1">Try a different search or category</p>
                </div>
            )}

            {/* Video Player Modal */}
            <AnimatePresence>
                {activeVideo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
                        onClick={() => setActiveVideo(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full max-w-4xl overflow-hidden"
                            style={{ borderRadius: 20 }}
                        >
                            {/* Close */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                <h3 className="text-[15px] font-bold text-gray-900 truncate pr-4">
                                    {decodeHtml(activeVideo.title)}
                                </h3>
                                <button
                                    onClick={() => setActiveVideo(null)}
                                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
                                    style={{ borderRadius: 8 }}
                                >
                                    <X className="w-4 h-4 text-gray-600" />
                                </button>
                            </div>

                            {/* Embedded Player */}
                            <div className="aspect-video bg-black">
                                <iframe
                                    src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&cc_load_policy=1&cc_lang_pref=en`}
                                    title={activeVideo.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full"
                                />
                            </div>

                            {/* Video Info */}
                            <div className="p-4 flex items-center gap-2 text-[12px] text-gray-500">
                                <User className="w-3.5 h-3.5" />
                                <span className="font-medium">{activeVideo.channelTitle}</span>
                                <span>•</span>
                                <span>{timeAgo(activeVideo.publishedAt)}</span>
                                <span className="ml-auto flex items-center gap-1 text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5" style={{ borderRadius: 6 }}>
                                    <Captions className="w-3.5 h-3.5" /> Captions Enabled
                                </span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
