'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ParentSidebar from '@/components/parents/ParentSidebar'
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts'
import { Target, TrendingUp, AlertTriangle, BookOpen, Clock, Activity, Box } from 'lucide-react'

import { useParentAggregateStats, useParentARStats, useWeeklyReport } from '@/hooks/useParentData'

const DEMO_PARENT_ID = 'a0000000-0000-0000-0000-000000000001'

// Helper to format seconds
const formatTime = (seconds: number) => {
    if (!seconds) return '0m'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
}

export default function ReportsPage() {
    const { stats, loading: statsLoading } = useParentAggregateStats(DEMO_PARENT_ID)
    const { arData, loading: arLoading } = useParentARStats(DEMO_PARENT_ID)
    const { weeklyData, loading: weeklyLoading } = useWeeklyReport(DEMO_PARENT_ID)

    const loading = statsLoading || arLoading || weeklyLoading

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        )
    }
    return (
        <div className="min-h-screen bg-slate-50 flex">
            <ParentSidebar />

            <main className="flex-1 lg:ml-64 p-8 overflow-y-auto w-full">
                <div className="max-w-7xl mx-auto space-y-8">

                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-gray-900">Learning Reports</h1>
                        <p className="text-gray-500 mt-2">Comprehensive analytics of your child's ISL progress.</p>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Total Signs Mastered</CardTitle>
                                <BookOpen className="w-4 h-4 text-indigo-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900">{stats?.totalSignsLearned || 0}</div>
                                <p className="text-xs text-green-600 mt-1 flex items-center">
                                    <TrendingUp className="w-3 h-3 mr-1" /> Active Tracking
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Avg. Quiz Accuracy</CardTitle>
                                <Target className="w-4 h-4 text-indigo-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900">{Math.round(stats?.avgAccuracy || 0)}%</div>
                                <p className="text-xs text-green-600 mt-1 flex items-center">
                                    <TrendingUp className="w-3 h-3 mr-1" /> Steady Growth
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Total Learning Time</CardTitle>
                                <Clock className="w-4 h-4 text-indigo-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900">{formatTime(stats?.combinedLearningTime || 0)}</div>
                                <p className="text-xs text-green-600 mt-1 flex items-center">
                                    <TrendingUp className="w-3 h-3 mr-1" /> Great engagement
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border-orange-200 bg-orange-50/30">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-orange-800">Needs Review</CardTitle>
                                <AlertTriangle className="w-4 h-4 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-2 mt-1">
                                    <Badge variant="outline" className="border-orange-300 text-orange-700 bg-white justify-center">Emotions Module</Badge>
                                    <Badge variant="outline" className="border-orange-300 text-orange-700 bg-white justify-center">Animals Module</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* Learning Velocity */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Weekly Learning Velocity</CardTitle>
                                <CardDescription>Number of new signs learned vs time spent reviewing.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={weeklyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        <Line yAxisId="left" type="monotone" name="Signs Learned" dataKey="signsLearned" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                        <Line yAxisId="right" type="monotone" name="Review Time (mins)" dataKey="reviewTime" stroke="#10B981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* AR Activity Tracking */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Box className="w-5 h-5 text-indigo-500" />
                                    Child AR Learning Activity
                                </CardTitle>
                                <CardDescription>Detailed breakdown of sessions spent interacting with 3D Augmented Reality models.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Total AR Categories Explored</p>
                                            <p className="text-3xl font-bold text-gray-900 mt-1">{arData.length}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
                                            <Activity className="w-6 h-6 text-indigo-600" />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-sm font-semibold text-gray-900">Categories Explored</h4>
                                        {arData.map((item) => (
                                            <div key={item.title} className="flex flex-col gap-1">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600 font-medium">{item.title}</span>
                                                    <span className="font-bold text-gray-900">{item.count > 0 ? `${item.count} sessions` : ''}</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-indigo-500 h-2 rounded-full"
                                                        style={{ width: `${Math.min((item.count / 20) * 100, 100)}%` }}
                                                    />
                                                </div>
                                                <p className="text-[10px] text-gray-400 text-right">{item.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                    </div>

                </div>
            </main>
        </div>
    )
}
