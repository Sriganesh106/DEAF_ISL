'use client'

import { useState, useEffect, useCallback } from 'react'

/* ------------------------------------------------------------------ */
/*  Badge definitions                                                  */
/* ------------------------------------------------------------------ */
export const ALL_BADGES = [
    { id: 'first-lesson', name: 'First Step', description: 'Complete your first lesson', icon: '🎯' },
    { id: 'streak-3', name: 'On Fire', description: 'Maintain a 3-day streak', icon: '🔥' },
    { id: 'streak-7', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '⚡' },
    { id: 'half-course', name: 'Halfway There', description: 'Complete half the course', icon: '🏔️' },
    { id: 'full-course', name: 'ISL Graduate', description: 'Complete all lessons', icon: '🎓' },
    { id: 'bookworm', name: 'Bookworm', description: 'Bookmark 3 lessons', icon: '📚' },
    { id: 'note-taker', name: 'Note Taker', description: 'Write notes on 3 lessons', icon: '📝' },
    { id: 'xp-100', name: 'Century', description: 'Earn 100 XP', icon: '💯' },
    { id: 'xp-500', name: 'XP Master', description: 'Earn 500 XP', icon: '🏆' },
    { id: 'level-5', name: 'Level 5', description: 'Reach level 5', icon: '⭐' },
]

const TOTAL_LESSONS = 8
const XP_PER_LESSON = 50
const XP_PER_LEVEL = 100
const STORAGE_KEY = 'learn-progress'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface LearnProgressData {
    completedLessons: string[]
    bookmarks: string[]
    notes: Record<string, string>
    xp: number
    streak: number
    lastActiveDate: string
    earnedBadges: string[]
}

interface Badge {
    id: string
    name: string
    description: string
    icon: string
}

const defaultProgress: LearnProgressData = {
    completedLessons: [],
    bookmarks: [],
    notes: {},
    xp: 0,
    streak: 0,
    lastActiveDate: '',
    earnedBadges: [],
}

import { supabase } from '@/lib/supabase'

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */
export function useLearnProgress(studentId?: string) {
    const [progress, setProgress] = useState<LearnProgressData>(defaultProgress)
    const [newBadge, setNewBadge] = useState<Badge | null>(null)

    // Load from Supabase (or localStorage fallback if no studentId)
    useEffect(() => {
        async function loadData() {
            if (!studentId) {
                // Fallback to local storage
                try {
                    const stored = localStorage.getItem(STORAGE_KEY)
                    if (stored) {
                        const parsed = JSON.parse(stored)
                        setProgress({ ...defaultProgress, ...parsed })
                    }
                } catch { }
                return
            }

            // 1. Fetch learning progress
            const { data: lpData } = await supabase
                .from('learning_progress')
                .select('*')
                .eq('student_id', studentId)

            // 2. Fetch bookmarks
            const { data: bmData } = await supabase
                .from('bookmarks')
                .select('*')
                .eq('student_id', studentId)

            // 3. Fetch stats
            const { data: statsData } = await supabase
                .from('student_stats')
                .select('*')
                .eq('student_id', studentId)
                .single()

            if (lpData || bmData || statsData) {
                const loadedProgress: LearnProgressData = {
                    ...defaultProgress,
                    completedLessons: lpData ? lpData.filter(d => d.status === 'completed').map(d => d.lesson_id) : [],
                    bookmarks: bmData ? bmData.filter(b => !b.note).map(b => b.lesson_id) : [],
                    notes: bmData ? bmData.reduce((acc, curr) => {
                        if (curr.note) acc[curr.lesson_id] = curr.note;
                        return acc;
                    }, {} as Record<string, string>) : {},
                    xp: statsData?.total_xp || 0,
                    streak: statsData?.practice_streak || 0,
                    lastActiveDate: statsData?.last_active_date ? new Date(statsData.last_active_date).toISOString().split('T')[0] : '',
                }
                setProgress(loadedProgress)
            }
        }

        loadData()
    }, [studentId])

    // Save to Supabase
    const save = useCallback(async (data: LearnProgressData) => {
        setProgress(data)

        // Always save to localStorage as backup
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        } catch { }

        if (!studentId) return

        // We only update stats here, specific lesson/bookmark updates will be handled in their respective functions
        await supabase
            .from('student_stats')
            .upsert({
                student_id: studentId,
                total_xp: data.xp,
                practice_streak: data.streak,
                last_active_date: data.lastActiveDate,
                updated_at: new Date().toISOString()
            }, { onConflict: 'student_id' })

    }, [studentId])

    // Update streak based on date
    const updateStreak = useCallback((data: LearnProgressData): LearnProgressData => {
        const today = new Date().toISOString().split('T')[0]
        if (data.lastActiveDate === today) return data

        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
        const newStreak = data.lastActiveDate === yesterday ? data.streak + 1 : 1

        return { ...data, streak: newStreak, lastActiveDate: today }
    }, [])

    // Check and award badges
    const checkBadges = useCallback((data: LearnProgressData): LearnProgressData => {
        const earned = [...data.earnedBadges]
        let awarded: Badge | null = null

        const tryAward = (id: string) => {
            if (!earned.includes(id)) {
                earned.push(id)
                const badge = ALL_BADGES.find(b => b.id === id)
                if (badge && !awarded) awarded = badge
            }
        }

        if (data.completedLessons.length >= 1) tryAward('first-lesson')
        if (data.streak >= 3) tryAward('streak-3')
        if (data.streak >= 7) tryAward('streak-7')
        if (data.completedLessons.length >= Math.ceil(TOTAL_LESSONS / 2)) tryAward('half-course')
        if (data.completedLessons.length >= TOTAL_LESSONS) tryAward('full-course')
        if (data.bookmarks.length >= 3) tryAward('bookworm')
        if (Object.values(data.notes).filter(n => n.trim().length > 0).length >= 3) tryAward('note-taker')
        if (data.xp >= 100) tryAward('xp-100')
        if (data.xp >= 500) tryAward('xp-500')

        const level = Math.floor(data.xp / XP_PER_LEVEL) + 1
        if (level >= 5) tryAward('level-5')

        if (awarded) setNewBadge(awarded)

        return { ...data, earnedBadges: earned }
    }, [])

    // Mark lesson complete
    const markComplete = useCallback(async (lessonId: string) => {
        setProgress(prev => {
            if (prev.completedLessons.includes(lessonId)) return prev

            let data = {
                ...prev,
                completedLessons: [...prev.completedLessons, lessonId],
                xp: prev.xp + XP_PER_LESSON,
            }
            data = updateStreak(data)
            data = checkBadges(data)
            save(data)

            // Async Supabase update
            if (studentId) {
                supabase.from('learning_progress').upsert({
                    student_id: studentId,
                    lesson_id: lessonId,
                    status: 'completed',
                    xp_earned: XP_PER_LESSON,
                    completed_at: new Date().toISOString()
                }).then()

                supabase.from('activity_log').insert({
                    student_id: studentId,
                    action_type: 'lesson_completed',
                    title: `Completed Lesson ${lessonId}`
                }).then()
            }

            return data
        })
    }, [save, updateStreak, checkBadges, studentId])

    // Toggle bookmark
    const toggleBookmark = useCallback((lessonId: string) => {
        setProgress(prev => {
            const isBookmarked = prev.bookmarks.includes(lessonId)
            const newBookmarks = isBookmarked
                ? prev.bookmarks.filter(id => id !== lessonId)
                : [...prev.bookmarks, lessonId]

            let data = { ...prev, bookmarks: newBookmarks }
            data = checkBadges(data)
            save(data)

            if (studentId) {
                if (isBookmarked) {
                    // Removing bookmark (assuming no note, or we might just clear the bookmark)
                    // For simplicity, we just delete it if there's no note
                    if (!data.notes[lessonId]) {
                        supabase.from('bookmarks').delete().match({ student_id: studentId, lesson_id: lessonId }).then()
                    }
                } else {
                    supabase.from('bookmarks').upsert({
                        student_id: studentId,
                        lesson_id: lessonId
                    }, { onConflict: 'student_id,lesson_id' }).then()
                }
            }

            return data
        })
    }, [save, checkBadges, studentId])

    // Save note
    const saveNote = useCallback((lessonId: string, text: string) => {
        setProgress(prev => {
            let data = { ...prev, notes: { ...prev.notes, [lessonId]: text } }
            data = checkBadges(data)
            save(data)

            if (studentId) {
                if (text.trim() === '' && !data.bookmarks.includes(lessonId)) {
                    supabase.from('bookmarks').delete().match({ student_id: studentId, lesson_id: lessonId }).then()
                } else {
                    supabase.from('bookmarks').upsert({
                        student_id: studentId,
                        lesson_id: lessonId,
                        note: text
                    }, { onConflict: 'student_id,lesson_id' }).then()
                }
            }

            return data
        })
    }, [save, checkBadges, studentId])

    const getNote = useCallback((lessonId: string) => {
        return progress.notes[lessonId] || ''
    }, [progress.notes])

    const isCompleted = useCallback((lessonId: string) => {
        return progress.completedLessons.includes(lessonId)
    }, [progress.completedLessons])

    const isBookmarked = useCallback((lessonId: string) => {
        return progress.bookmarks.includes(lessonId)
    }, [progress.bookmarks])

    const dismissBadge = useCallback(() => {
        setNewBadge(null)
    }, [])

    const level = Math.floor(progress.xp / XP_PER_LEVEL) + 1
    const xpInLevel = progress.xp % XP_PER_LEVEL

    return {
        progress,
        markComplete,
        toggleBookmark,
        saveNote,
        getNote,
        isCompleted,
        isBookmarked,
        newBadge,
        dismissBadge,
        level,
        xpInLevel,
        xpPerLevel: XP_PER_LEVEL,
    }
}
