import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface StudentStats {
    signs_learned: number
    practice_streak: number
    avg_accuracy: number
    total_time_seconds: number
    total_xp: number
}

export interface ActivityEntry {
    id: string
    action_type: string
    title: string
    description: string
    created_at: string
}

export interface ARSession {
    id: string
    scene_name: string
    scene_icon: string
    duration_seconds: number
    created_at: string
}

export function useStudentStats(studentId: string) {
    const [stats, setStats] = useState<StudentStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!studentId) return

        async function fetchStats() {
            setLoading(true)
            const { data, error } = await supabase
                .from('student_stats')
                .select('*')
                .eq('student_id', studentId)
                .single()

            if (!error && data) {
                setStats(data as StudentStats)
            }
            setLoading(false)
        }

        fetchStats()

        // Realtime subscription
        const channel = supabase
            .channel('student_stats_changes')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'student_stats', filter: `student_id=eq.${studentId}` }, (payload) => {
                setStats(payload.new as StudentStats)
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [studentId])

    return { stats, loading }
}

export function useRecentActivity(studentId: string, limit = 5) {
    const [activity, setActivity] = useState<ActivityEntry[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!studentId) return

        async function fetchActivity() {
            setLoading(true)
            const { data, error } = await supabase
                .from('activity_log')
                .select('*')
                .eq('student_id', studentId)
                .order('created_at', { ascending: false })
                .limit(limit)

            if (!error && data) {
                setActivity(data as ActivityEntry[])
            }
            setLoading(false)
        }

        fetchActivity()

        const channel = supabase
            .channel('activity_log_changes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log', filter: `student_id=eq.${studentId}` }, (payload) => {
                setActivity(prev => [payload.new as ActivityEntry, ...prev].slice(0, limit))
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [studentId, limit])

    return { activity, loading }
}

export function useARStats(studentId: string) {
    const [sessions, setSessions] = useState<ARSession[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!studentId) return

        async function fetchSessions() {
            setLoading(true)
            const { data, error } = await supabase
                .from('ar_sessions')
                .select('*')
                .eq('student_id', studentId)
                .order('created_at', { ascending: false })
                .limit(5)

            if (!error && data) {
                setSessions(data as ARSession[])
            }
            setLoading(false)
        }

        fetchSessions()
    }, [studentId])

    const totalARTime = sessions.reduce((acc, curr) => acc + curr.duration_seconds, 0)
    const favoriteScene = sessions.length > 0 ? sessions[0].scene_name : null // simplified logic

    return { sessions, totalARTime, favoriteScene, loading }
}
