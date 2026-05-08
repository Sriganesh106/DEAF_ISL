'use client'

import { motion } from 'framer-motion'
import {
    LayoutDashboard, Users, Trophy, Clock,
    TrendingUp, Calendar as CalendarIcon, ChevronRight, Bell,
    Settings, LogOut, Search, MoreHorizontal, History
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import Link from 'next/link'
import { useState } from 'react'
import ParentSidebar from '@/components/parents/ParentSidebar'
import { useParentAggregateStats, useChildActivity } from '@/hooks/useParentData'

const DEMO_PARENT_ID = 'a0000000-0000-0000-0000-000000000001'

// Helper to format seconds
const formatTime = (seconds: number) => {
    if (!seconds) return '0m'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
}

export default function ParentDashboard() {
    const [date, setDate] = useState<Date | undefined>(new Date())

    const { stats, loading: statsLoading } = useParentAggregateStats(DEMO_PARENT_ID)
    const { activity, loading: activityLoading } = useChildActivity(DEMO_PARENT_ID, 6)

    const loading = statsLoading || activityLoading

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar (Simple for Parent View) */}
            <ParentSidebar />

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-gray-500 text-sm">Welcome back, Sarah.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" className="rounded-full">
                            <Bell className="w-4 h-4 text-gray-600" />
                        </Button>
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                            <span className="font-semibold text-indigo-700">SM</span>
                        </div>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Learning Time</p>
                                <h3 className="text-2xl font-bold text-gray-900">{formatTime(stats?.combinedLearningTime || 0)}</h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                <Trophy className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Avg Accuracy</p>
                                <h3 className="text-2xl font-bold text-gray-900">{Math.round(stats?.avgAccuracy || 0)}%</h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Highest Streak</p>
                                <h3 className="text-2xl font-bold text-gray-900">{stats?.activeStreakDays || 0} Days</h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                <History className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Signs</p>
                                <h3 className="text-2xl font-bold text-gray-900">{stats?.totalSignsLearned || 0}</h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Sections */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Activity Feed */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Recent Activity</CardTitle>
                                <CardDescription>What your children have been learning</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" className="text-indigo-600">View All</Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {activity.length === 0 ? (
                                    <div className="text-sm text-gray-500 italic py-4">No recent activity found.</div>
                                ) : activity.map((item) => {
                                    let Icon = Trophy
                                    let bg = 'bg-blue-100 text-blue-600'

                                    if (item.action_type === 'quiz_completed') {
                                        Icon = Trophy
                                        bg = 'bg-yellow-100 text-yellow-600'
                                    } else if (item.action_type === 'ar_session') {
                                        Icon = Clock
                                        bg = 'bg-purple-100 text-purple-600'
                                    } else if (item.action_type === 'lesson_completed') {
                                        Icon = Users
                                        bg = 'bg-emerald-100 text-emerald-600'
                                    } else if (item.action_type === 'sign_practiced') {
                                        Icon = TrendingUp
                                        bg = 'bg-rose-100 text-rose-600'
                                    }

                                    return (
                                        <div key={item.id} className="flex items-start gap-4">
                                            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${bg}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="text-sm font-semibold text-gray-900">
                                                        <span className="text-indigo-600">{item.childName}</span> {item.title}
                                                    </h4>
                                                    <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
                                                </div>
                                                {item.description && (
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        {item.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Calendar Overview */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Learning Schedule</CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-center pb-6">
                            <DayPicker
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm"
                                modifiers={{
                                    learningDays: [new Date(), new Date(Date.now() - 86400000 * 2), new Date(Date.now() - 86400000 * 3)]
                                }}
                                modifiersStyles={{
                                    learningDays: { fontWeight: 'bold', backgroundColor: '#e0e7ff', color: '#4f46e5', borderRadius: '100%' }
                                }}
                            />
                        </CardContent>
                        <div className="px-6 pb-6 pt-0 space-y-3">
                            <div className="text-sm font-medium text-gray-900 mb-2">Upcoming Activities</div>
                            <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100/50">
                                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                <div className="flex-1">
                                    <div className="text-sm font-semibold text-gray-900">Practice Spelling</div>
                                    <div className="text-xs text-gray-500">Today, 5:00 PM</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="w-2 h-2 rounded-full bg-gray-400" />
                                <div className="flex-1">
                                    <div className="text-sm font-semibold text-gray-900">Review Numbers</div>
                                    <div className="text-xs text-gray-500">Tomorrow</div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    )
}
