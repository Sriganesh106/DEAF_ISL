'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Hand, Camera, BookOpen, Target, TrendingUp,
    Clock, Flame, Award, ArrowRight, ChevronRight,
    Headset, Play, Star, Eye,
    Orbit, User, PawPrint, Leaf, Shapes, Droplets
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import FloatingSidebar from '@/components/ui/FloatingSidebar'
import NewsFeed from '@/components/dashboard/NewsFeed'
import SignOfTheDay from '@/components/dashboard/SignOfTheDay'
import { useStudentStats, useARStats, useRecentActivity } from '@/hooks/useStudentData'

const DEMO_STUDENT_ID = 'b0000000-0000-0000-0000-000000000001'

// Helper to format seconds
const formatTime = (seconds: number) => {
    if (!seconds) return '0m'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
}

// AR scene data
const AR_SCENES = [
    { id: 'solar_system', name: 'Solar System', icon: Orbit, available: true, color: 'text-blue-500' },
    { id: 'human_body', name: 'Human Body', icon: User, available: false, color: 'text-rose-500' },
    { id: 'animals', name: 'Animals', icon: PawPrint, available: false, color: 'text-amber-500' },
    { id: 'plants', name: 'Plants', icon: Leaf, available: false, color: 'text-emerald-500' },
    { id: 'geometry', name: 'Geometry', icon: Shapes, available: false, color: 'text-indigo-500' },
    { id: 'water_cycle', name: 'Water Cycle', icon: Droplets, available: false, color: 'text-blue-500' },
]

export default function DashboardPage() {
    const { stats, loading: statsLoading } = useStudentStats(DEMO_STUDENT_ID)
    const { sessions: arRecentSessions, totalARTime, favoriteScene, loading: arLoading } = useARStats(DEMO_STUDENT_ID)
    const { activity: recentActivity, loading: activityLoading } = useRecentActivity(DEMO_STUDENT_ID, 4)

    const loading = statsLoading || arLoading || activityLoading

    const learningModules = [
        {
            icon: Camera,
            title: 'Free Practice',
            desc: 'Open sign detection with real-time tracking',
            href: '/sign-detection',
            color: 'bg-indigo-600',
            lightColor: 'bg-indigo-50 border-indigo-200',
            textColor: 'text-indigo-600',
        },
        {
            icon: BookOpen,
            title: 'Learn Signs',
            desc: 'Reference cards for alphabets & numbers',
            href: '/learn',
            color: 'bg-emerald-600',
            lightColor: 'bg-emerald-50 border-emerald-200',
            textColor: 'text-emerald-600',
        },
        {
            icon: Target,
            title: 'Quiz Mode',
            desc: 'Test yourself with random sign challenges',
            href: '/quiz',
            color: 'bg-amber-500',
            lightColor: 'bg-amber-50 border-amber-200',
            textColor: 'text-amber-600',
        },
        {
            icon: Hand,
            title: 'Word Builder',
            desc: 'Spell words using sign language',
            href: '/sign-detection',
            color: 'bg-rose-500',
            lightColor: 'bg-rose-50 border-rose-200',
            textColor: 'text-rose-600',
        },
    ]

    const exploredScenesCount = new Set(arRecentSessions.map(s => s.scene_name)).size
    const exploredPercent = Math.round((exploredScenesCount / AR_SCENES.length) * 100) || 0

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f5f5f7] font-sans flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f5f5f7] font-sans">
            <FloatingSidebar activeId="dashboard" />

            <main className="ml-[100px] min-h-screen overflow-y-auto">
                <div className="p-7">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-[24px] font-bold text-gray-900 tracking-tight mb-0.5">Dashboard</h1>
                            <p className="text-[13px] text-gray-400">Welcome back! Here&apos;s your learning progress.</p>
                        </div>
                        <div className="w-10 h-10 bg-indigo-600 flex items-center justify-center text-white font-bold text-[13px]" style={{ borderRadius: 12 }}>
                            S
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        {[
                            { icon: Hand, label: 'Signs Learned', value: `${stats?.signs_learned || 0}/26`, color: 'text-indigo-500', bgColor: 'bg-indigo-50' },
                            { icon: Flame, label: 'Practice Streak', value: `${stats?.practice_streak || 0} days`, color: 'text-orange-500', bgColor: 'bg-orange-50' },
                            { icon: TrendingUp, label: 'Avg Accuracy', value: `${Math.round(stats?.avg_accuracy || 0)}%`, color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
                            { icon: Clock, label: 'Time Practiced', value: formatTime(stats?.total_time_seconds || 0), color: 'text-blue-500', bgColor: 'bg-blue-50' },
                        ].map((stat, i) => {
                            const Icon = stat.icon
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                    className="bg-white p-5 border border-gray-100"
                                    style={{ borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
                                >
                                    <div className={`w-10 h-10 ${stat.bgColor} flex items-center justify-center mb-3`} style={{ borderRadius: 12 }}>
                                        <Icon className={`w-5 h-5 ${stat.color}`} />
                                    </div>
                                    <div className="text-[22px] font-bold text-gray-900 mb-0.5">{stat.value}</div>
                                    <div className="text-[11px] text-gray-400 font-medium">{stat.label}</div>
                                </motion.div>
                            )
                        })}
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Left Column (2/3) */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* AR Activity Stats Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white p-6 border border-gray-100"
                                style={{ borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
                            >
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-900 flex items-center justify-center" style={{ borderRadius: 12 }}>
                                            <Headset className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-[16px] font-bold text-gray-900">AR Activity</h2>
                                            <p className="text-[12px] text-gray-400 mt-0.5">Your augmented reality learning journey</p>
                                        </div>
                                    </div>
                                    <Link href="/ar">
                                        <span className="text-indigo-600 text-[12px] font-semibold hover:text-indigo-700 flex items-center gap-1">
                                            View all <ChevronRight className="w-3.5 h-3.5" />
                                        </span>
                                    </Link>
                                </div>

                                {/* AR Stats Row */}
                                <div className="grid grid-cols-4 gap-3 mb-5">
                                    {[
                                        { label: 'Total Sessions', value: arRecentSessions.length.toString(), icon: Play, color: 'text-blue-500', bg: 'bg-blue-50' },
                                        { label: 'Time in AR', value: formatTime(totalARTime), icon: Clock, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                        { label: 'Scenes Explored', value: `${exploredScenesCount}/${AR_SCENES.length}`, icon: Eye, color: 'text-amber-500', bg: 'bg-amber-50' },
                                        { label: 'Favorite Scene', value: favoriteScene || 'None yet', icon: Star, color: 'text-rose-500', bg: 'bg-rose-50' },
                                    ].map((item, i) => {
                                        const Icon = item.icon
                                        return (
                                            <div
                                                key={i}
                                                className="bg-gray-50 p-3.5 border border-gray-100"
                                                style={{ borderRadius: 12 }}
                                            >
                                                <div className={`w-7 h-7 ${item.bg} flex items-center justify-center mb-2`} style={{ borderRadius: 8 }}>
                                                    <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                                                </div>
                                                <div className="text-[15px] font-bold text-gray-900 mb-0.5 truncate">{item.value}</div>
                                                <div className="text-[10px] text-gray-400 font-medium">{item.label}</div>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Exploration Progress Bar */}
                                <div className="mb-5">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[12px] font-semibold text-gray-700">Scene Exploration</span>
                                        <span className="text-[11px] text-gray-400">{exploredPercent}% discovered</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 overflow-hidden" style={{ borderRadius: 4 }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${exploredPercent}%` }}
                                            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                                            className="h-full bg-gradient-to-r from-indigo-500 to-blue-500"
                                            style={{ borderRadius: 4 }}
                                        />
                                    </div>
                                </div>

                                {/* AR Scenes Grid */}
                                <div className="grid grid-cols-6 gap-2 mb-5">
                                    {AR_SCENES.map((scene, i) => (
                                        <motion.div
                                            key={scene.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                            whileHover={{ scale: 1.08, y: -2 }}
                                            className={`relative flex flex-col items-center p-3 border cursor-pointer transition-all ${scene.available
                                                ? 'bg-indigo-50 border-indigo-200'
                                                : 'bg-gray-50 border-gray-100 opacity-60'
                                                }`}
                                            style={{ borderRadius: 12 }}
                                        >
                                            <div className={`mb-2 ${scene.color}`}>
                                                <scene.icon className="w-6 h-6" />
                                            </div>
                                            <span className="text-[9px] font-semibold text-gray-600 text-center leading-tight">{scene.name}</span>
                                            {scene.available && (
                                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-white" style={{ borderRadius: '50%' }} />
                                            )}
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Recent AR Sessions */}
                                <div className="mb-4">
                                    <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Sessions</h3>
                                    <div className="space-y-2">
                                        {arRecentSessions.length === 0 ? (
                                            <div className="text-[13px] text-gray-500 italic p-3 text-center">No AR sessions yet.</div>
                                        ) : arRecentSessions.map((session, i) => (
                                            <motion.div
                                                key={session.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.08 }}
                                                className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors"
                                                style={{ borderRadius: 10 }}
                                            >
                                                <span className="text-[20px]">{session.scene_icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[13px] font-semibold text-gray-900">{session.scene_name}</div>
                                                    <div className="text-[11px] text-gray-400">{new Date(session.created_at).toLocaleDateString()}</div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[11px] text-gray-500 font-medium bg-white px-2 py-0.5 border border-gray-100" style={{ borderRadius: 6 }}>
                                                        {formatTime(session.duration_seconds)}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Continue in AR Button */}
                                <Link href="/ar">
                                    <Button
                                        className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold text-[13px] h-11 gap-2"
                                        style={{ borderRadius: 12 }}
                                    >
                                        <Headset className="w-4 h-4" />
                                        Continue Learning in AR
                                        <ArrowRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </Link>
                            </motion.div>

                            {/* Learning Modules */}
                            <div>
                                <h2 className="text-[16px] font-bold text-gray-900 mb-4">Learning Modules</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    {learningModules.map((mod, i) => {
                                        const Icon = mod.icon
                                        return (
                                            <Link key={i} href={mod.href}>
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.08 }}
                                                    whileHover={{ y: -2 }}
                                                    className="bg-white p-5 border border-gray-100 cursor-pointer group"
                                                    style={{ borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className={`w-11 h-11 ${mod.color} flex items-center justify-center`} style={{ borderRadius: 12 }}>
                                                            <Icon className="w-5 h-5 text-white" />
                                                        </div>
                                                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                                                    </div>
                                                    <h3 className="text-[14px] font-bold text-gray-900 mb-1">{mod.title}</h3>
                                                    <p className="text-[12px] text-gray-400 leading-relaxed">{mod.desc}</p>
                                                </motion.div>
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Right Column (1/3) */}
                        <div className="space-y-6">

                            {/* Recent Activity */}
                            <div
                                className="bg-white p-5 border border-gray-100"
                                style={{ borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
                            >
                                <h2 className="text-[15px] font-bold text-gray-900 mb-4">Recent Activity</h2>
                                <div className="space-y-3">
                                    {recentActivity.length === 0 ? (
                                        <div className="text-[13px] text-gray-500 italic p-3 text-center">No recent activity.</div>
                                    ) : recentActivity.map((activity, i) => {
                                        let iconChar = '📝'
                                        if (activity.action_type === 'ar_session') iconChar = '🌍'
                                        if (activity.action_type === 'sign_practiced' || activity.action_type === 'sign_mastered') iconChar = activity.title.split(' ').pop()?.charAt(0) || 'H'
                                        if (activity.action_type === 'quiz_completed') iconChar = '🏆'

                                        return (
                                            <motion.div
                                                key={activity.id}
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="flex items-center gap-3"
                                            >
                                                <div className={`w-10 h-10 bg-indigo-600 flex items-center justify-center text-white font-bold text-[14px] shrink-0`} style={{ borderRadius: 10 }}>
                                                    {iconChar}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[13px] font-semibold text-gray-900">{activity.title}</span>
                                                    </div>
                                                    <span className="text-[11px] text-gray-400">{new Date(activity.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Student News Feed */}
                            <NewsFeed />

                            {/* Sign of the Day Widget */}
                            <SignOfTheDay />


                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
