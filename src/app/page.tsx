'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import {
    User, Lock, ArrowRight, Sparkles, GraduationCap,
    ShieldCheck, Mail, Eye, EyeOff, LayoutDashboard,
    ChevronRight, Star, Hand, Camera
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const GestureAuth = dynamic(() => import('@/components/auth/GestureAuth'), { ssr: false })

export default function LoginPage() {
    const router = useRouter()
    const [role, setRole] = useState<'student' | 'parent'>('student')
    const [loginMethod, setLoginMethod] = useState<'sign' | 'pin'>('sign')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        // Mock login delay
        setTimeout(() => {
            setIsLoading(false)
            if (role === 'student') {
                router.push('/dashboard')
            } else {
                router.push('/parents')
            }
        }, 1500)
    }

    return (
        <div className="min-h-screen w-full bg-slate-50/50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorations (Subtle consistent) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-4xl bg-white border border-gray-200 shadow-xl rounded-2xl overflow-hidden relative z-10 grid md:grid-cols-2 min-h-[550px]"
            >
                {/* Left Side (Banner) - Consistent for both */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-28 h-28 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 ring-1 ring-white/20 shadow-lg">
                            <Image src="/ar-logo.svg" alt="Silent Learn Logo" width={64} height={64} className="" />
                        </div>

                        <h1 className="text-3xl font-bold text-white mb-2">
                            Silent Learn
                        </h1>

                        <p className="text-indigo-100 text-lg mb-8 max-w-xs">
                            Learning without sound barriers.
                        </p>

                        {/* Role Toggle Switch */}
                        <div className="bg-black/20 p-1 rounded-xl flex w-full max-w-[280px] relative mt-2">
                            {/* Sliding Background */}
                            <motion.div
                                className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm"
                                initial={false}
                                animate={{
                                    left: role === 'student' ? '4px' : '50%',
                                    width: 'calc(50% - 4px)',
                                    x: role === 'parent' ? -2 : 0
                                }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />

                            <button
                                onClick={() => setRole('student')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-lg relative z-10 transition-colors ${role === 'student' ? 'text-indigo-700' : 'text-indigo-100 hover:text-white'}`}
                            >
                                <GraduationCap className="w-4 h-4" /> Student
                            </button>
                            <button
                                onClick={() => setRole('parent')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-lg relative z-10 transition-colors ${role === 'parent' ? 'text-indigo-700' : 'text-indigo-100 hover:text-white'}`}
                            >
                                <ShieldCheck className="w-4 h-4" /> Parent
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Side (Form) */}
                <div className="p-8 md:p-12 flex flex-col justify-center bg-white relative">
                    <AnimatePresence mode="wait">
                        {role === 'student' ? (
                            <motion.div
                                key="student"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2 }}
                                className="w-full"
                            >
                                <div className="space-y-5">
                                    <div className="text-center mb-2">
                                        <h3 className="text-xl font-bold text-gray-900">Student Login</h3>
                                        <p className="text-gray-500 text-sm">Choose how to enter your classroom</p>
                                    </div>

                                    {/* Login Method Toggle */}
                                    <div className="bg-gray-100 p-1 rounded-xl flex">
                                        <button
                                            type="button"
                                            onClick={() => setLoginMethod('sign')}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${loginMethod === 'sign'
                                                ? 'bg-white text-indigo-700 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            <Hand className="w-4 h-4" /> Sign to Unlock
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLoginMethod('pin')}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${loginMethod === 'pin'
                                                ? 'bg-white text-indigo-700 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            <Lock className="w-4 h-4" /> Use PIN
                                        </button>
                                    </div>

                                    <AnimatePresence mode="wait">
                                        {loginMethod === 'sign' ? (
                                            <motion.div
                                                key="sign-login"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <GestureAuth
                                                    onSuccess={() => router.push('/dashboard')}
                                                />
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="pin-login"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <form onSubmit={handleLogin} className="space-y-4">
                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="classCode">Class Code</Label>
                                                            <Input
                                                                id="classCode"
                                                                placeholder="e.g. CLASS-A"
                                                                className="bg-gray-50 border-gray-200 focus:bg-white transition-all h-12 rounded-lg"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="pin">Secret PIN</Label>
                                                            <Input
                                                                id="pin"
                                                                placeholder="••••"
                                                                type="password"
                                                                maxLength={4}
                                                                className="bg-gray-50 border-gray-200 focus:bg-white transition-all h-12 tracking-widest rounded-lg"
                                                            />
                                                        </div>
                                                    </div>

                                                    <Button
                                                        type="submit"
                                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 shadow-lg shadow-indigo-200 font-bold rounded-lg text-base"
                                                        disabled={isLoading}
                                                    >
                                                        {isLoading ? (
                                                            <motion.div
                                                                animate={{ rotate: 360 }}
                                                                transition={{ repeat: Infinity, duration: 1 }}
                                                                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                                            />
                                                        ) : (
                                                            <>Enter Classroom <ArrowRight className="w-4 h-4 ml-2" /></>
                                                        )}
                                                    </Button>

                                                    <p className="text-center text-xs text-gray-400">
                                                        Ask your teacher if you forgot your PIN
                                                    </p>
                                                </form>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="parent"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="w-full"
                            >
                                <form onSubmit={handleLogin} className="space-y-6">
                                    <div className="text-center mb-6">
                                        <h3 className="text-xl font-bold text-gray-900">Parent Login</h3>
                                        <p className="text-gray-500 text-sm">Monitor progress & manage settings</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="parent@example.com"
                                                    className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all rounded-lg"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <Label htmlFor="password">Password</Label>
                                                <Link href="#" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                                                    Forgot password?
                                                </Link>
                                            </div>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                                                <Input
                                                    id="password"
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all pr-10 rounded-lg"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 scale-90"
                                                >
                                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 shadow-lg shadow-indigo-200 font-bold rounded-lg"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ repeat: Infinity, duration: 1 }}
                                                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                            />
                                        ) : (
                                            <>Access Dashboard <ChevronRight className="w-4 h-4 ml-2" /></>
                                        )}
                                    </Button>

                                    <p className="text-center text-xs text-gray-500 mt-4">
                                        Don't have an account? <Link href="#" className="text-indigo-600 font-bold hover:underline">Sign up</Link>
                                    </p>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Footer */}
            <div className="absolute bottom-6 w-full text-center text-xs text-gray-400">
                &copy; 2024 Silent Learn • Learning for Everyone
            </div>
        </div>
    )
}
