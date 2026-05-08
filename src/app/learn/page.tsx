'use client'

import { motion } from 'framer-motion'
import {
    Play, Globe, GraduationCap, Youtube, Captions
} from 'lucide-react'
import FloatingSidebar from '@/components/ui/FloatingSidebar'
import DeafYouTube from '@/components/learn/DeafYouTube'

export default function LearnPage() {
    return (
        <div className="min-h-screen bg-[#f5f5f7] font-sans flex">
            <FloatingSidebar activeId="learn" />

            <main className="flex-1 ml-[100px] min-h-screen overflow-y-auto">
                {/* ═══════ BLACK HEADER BAR ═══════ */}
                <div className="bg-gray-900 mx-6 mt-4 px-8 py-5 flex items-center justify-between sticky top-4 z-40 rounded-3xl shadow-xl">
                    <div>
                        <h1 className="text-[20px] font-bold text-white tracking-tight flex items-center gap-2">
                            Video Learning Hub
                        </h1>
                        <p className="text-[13px] text-gray-400 mt-0.5">
                            Curated signed videos for continuous learning
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 text-[12px] text-gray-300 rounded-xl">
                            <Youtube className="w-4 h-4 text-red-400" />
                            <span className="font-semibold text-white">100+</span> Videos
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 text-[12px] text-gray-300 rounded-xl">
                            <Captions className="w-4 h-4 text-yellow-400" />
                            <span className="font-semibold text-white">100%</span> Captioned
                        </div>
                    </div>
                </div>
                {/* ═══════ HEADER END ═══════ */}

                <div className="p-8 pt-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full max-w-[1600px] mx-auto"
                    >
                        {/* Stats Bar (Matching Quiz Page Style) */}
                        <div className="flex items-stretch gap-4 mb-8">
                            <div className="flex items-center gap-3 bg-white border border-gray-200/60 rounded-xl px-5 py-3 shadow-sm flex-1">
                                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <Play className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div>
                                    <div className="text-[16px] font-bold text-gray-900 leading-tight">Expert Tutors</div>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">High Quality</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-white border border-gray-200/60 rounded-xl px-5 py-3 shadow-sm flex-1">
                                <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
                                    <Globe className="w-5 h-5 text-orange-500" />
                                </div>
                                <div>
                                    <div className="text-[16px] font-bold text-gray-900 leading-tight">Deaf Culture</div>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Community</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-white border border-gray-200/60 rounded-xl px-5 py-3 shadow-sm flex-1">
                                <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center">
                                    <GraduationCap className="w-5 h-5 text-rose-500" />
                                </div>
                                <div>
                                    <div className="text-[16px] font-bold text-gray-900 leading-tight">Visual Learning</div>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Paced Lessons</div>
                                </div>
                            </div>
                        </div>

                        {/* Direct Video Grid Component */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 min-h-[500px]">
                            <DeafYouTube hideHeader={true} />
                        </div>

                    </motion.div>
                </div>
            </main>
        </div>
    )
}
