'use client'

import { LayoutDashboard, Users, Trophy, Settings, LogOut, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function ParentSidebar() {
    const pathname = usePathname();

    const links = [
        { href: '/parents', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/parents/voice', label: 'Voice Translator', icon: Mic },
        { href: '/parents/reports', label: 'Reports', icon: Trophy },
        { href: '#', label: 'Settings', icon: Settings },
    ];

    return (
        <aside className="w-64 bg-white border-r border-gray-200 hidden lg:flex flex-col fixed h-full z-20">
            <div className="p-6">
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                        P
                    </div>
                    <span className="font-bold text-lg text-gray-800">Parent Portal</span>
                </div>

                <nav className="space-y-1">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;

                        return (
                            <Link key={link.label} href={link.href}>
                                <Button
                                    variant="ghost"
                                    className={`w-full justify-start ${isActive ? 'text-indigo-600 bg-indigo-50 font-semibold' : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'}`}
                                >
                                    <Icon className="w-4 h-4 mr-3" /> {link.label}
                                </Button>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-6 border-t border-gray-100">
                <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" asChild>
                    <Link href="/">
                        <LogOut className="w-4 h-4 mr-3" /> Sign Out
                    </Link>
                </Button>
            </div>
        </aside>
    )
}
