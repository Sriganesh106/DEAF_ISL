'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Hand, Home, BookOpen, Headset, LogOut, Target } from 'lucide-react'
import Link from 'next/link'

interface SidebarProps {
    activeId: string
}

const sidebarItems = [
    { icon: Home, label: 'Dashboard', id: 'dashboard', href: '/dashboard' },
    { icon: Headset, label: 'AR', id: 'ar', href: '/ar' },
    { icon: Hand, label: 'Practice', id: 'detection', href: '/sign-detection' },
    { icon: BookOpen, label: 'Learn', id: 'learn', href: '/learn' },
    { icon: Target, label: 'Quiz', id: 'quiz', href: '/quiz' },
]

export default function FloatingSidebar({ activeId }: SidebarProps) {
    const [expanded, setExpanded] = useState(false)

    return (
        <motion.aside
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => setExpanded(false)}
            animate={{ width: expanded ? 220 : 72 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-4 top-4 bottom-4 z-50 bg-[#1a1a2e] flex flex-col overflow-hidden"
            style={{ borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
        >
            {/* Logo - Centered */}
            <div className="flex items-center justify-center pt-6 pb-6 min-h-[72px] w-full">
                <div className="w-10 h-10 bg-white/10 flex items-center justify-center shrink-0" style={{ borderRadius: 10 }}>
                    <img src="/ar-logo.svg" alt="Logo" width={24} height={24} className="" suppressHydrationWarning />
                </div>
                <motion.span
                    animate={{
                        opacity: expanded ? 1 : 0,
                        width: expanded ? 'auto' : 0,
                        marginLeft: expanded ? 12 : 0,
                    }}
                    transition={{ duration: 0.15 }}
                    className="text-white font-bold text-[15px] tracking-tight whitespace-nowrap overflow-hidden"
                >
                    Silent Learn
                </motion.span>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 space-y-1">
                {sidebarItems.map((item) => {
                    const Icon = item.icon
                    const isActive = activeId === item.id
                    return (
                        <Link key={item.id} href={item.href}>
                            <div
                                className={`flex items-center gap-3 h-10 px-3 transition-all duration-150 cursor-pointer ${isActive
                                    ? 'bg-purple-600/20 text-purple-400'
                                    : 'text-white/40 hover:bg-white/[0.05] hover:text-white/80'
                                    }`}
                                style={{ borderRadius: 10 }}
                            >
                                <Icon className="w-[18px] h-[18px] shrink-0" />
                                <motion.span
                                    animate={{ opacity: expanded ? 1 : 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="text-[13px] font-medium whitespace-nowrap overflow-hidden"
                                >
                                    {item.label}
                                </motion.span>
                            </div>
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom */}
            <div className="px-3 pb-4 space-y-1">
                <Link href="/">
                    <div
                        className="flex items-center gap-3 h-10 px-3 text-white/30 hover:bg-white/[0.05] hover:text-white/60 transition-all duration-150 cursor-pointer"
                        style={{ borderRadius: 10 }}
                    >
                        <LogOut className="w-[18px] h-[18px] shrink-0" />
                        <motion.span
                            animate={{ opacity: expanded ? 1 : 0 }}
                            transition={{ duration: 0.15 }}
                            className="text-[13px] font-medium whitespace-nowrap overflow-hidden"
                        >
                            Logout
                        </motion.span>
                    </div>
                </Link>
            </div>
        </motion.aside>
    )
}
