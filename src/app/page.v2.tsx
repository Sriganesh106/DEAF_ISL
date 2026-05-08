'use client'

import { motion } from 'framer-motion'
import { Hand, Camera, BookOpen, QrCode, ArrowRight, CheckCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

export default function HomeV2() {
    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Hand className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-semibold text-gray-900">Silent Learn</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                                About
                            </Button>
                            <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                                Features
                            </Button>
                            <Link href="/sign-detection">
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                    Get Started
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-20 pb-16 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                                <Sparkles className="w-4 h-4" />
                                AI-Powered Learning Platform
                            </div>
                            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                                Learn Indian Sign Language with
                                <span className="text-blue-600"> AI Technology</span>
                            </h1>
                            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                                A modern, accessible learning platform designed specifically for Deaf students in India.
                                Learn ISL through real-time AI detection, interactive lessons, and AR experiences.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link href="/sign-detection">
                                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8">
                                        <Camera className="w-5 h-5 mr-2" />
                                        Try Sign Detection
                                    </Button>
                                </Link>
                                <Button size="lg" variant="outline" className="h-12 px-8 border-gray-300">
                                    <BookOpen className="w-5 h-5 mr-2" />
                                    Browse Lessons
                                </Button>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="relative"
                        >
                            <div className="aspect-square bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 flex items-center justify-center">
                                <div className="text-center">
                                    <Hand className="w-32 h-32 text-blue-600 mx-auto mb-4" />
                                    <p className="text-gray-700 font-medium">Real-time Hand Detection</p>
                                </div>
                            </div>
                            {/* Floating cards */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="absolute top-4 -left-4 bg-white rounded-xl shadow-lg p-4 border border-gray-100"
                            >
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="text-sm font-medium text-gray-900">98% Accuracy</span>
                                </div>
                            </motion.div>
                            <motion.div
                                animate={{ y: [0, 10, 0] }}
                                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                                className="absolute bottom-4 -right-4 bg-white rounded-xl shadow-lg p-4 border border-gray-100"
                            >
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-blue-600" />
                                    <span className="text-sm font-medium text-gray-900">AI Powered</span>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Everything you need to learn ISL
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Comprehensive tools and features designed to make learning Indian Sign Language easy and effective
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Camera className="w-8 h-8" />,
                                title: "Real-time Detection",
                                description: "AI-powered hand tracking recognizes your signs instantly with high accuracy",
                                color: "blue"
                            },
                            {
                                icon: <Hand className="w-8 h-8" />,
                                title: "Interactive Practice",
                                description: "Practice ISL alphabet and words with immediate feedback and corrections",
                                color: "green"
                            },
                            {
                                icon: <QrCode className="w-8 h-8" />,
                                title: "AR Learning",
                                description: "Scan QR codes to explore 3D models and immersive learning experiences",
                                color: "red"
                            },
                            {
                                icon: <BookOpen className="w-8 h-8" />,
                                title: "Visual Lessons",
                                description: "Learn through videos, images, and animations - no sound required",
                                color: "yellow"
                            },
                            {
                                icon: <Sparkles className="w-8 h-8" />,
                                title: "Progress Tracking",
                                description: "Monitor your learning journey with detailed stats and achievements",
                                color: "purple"
                            },
                            {
                                icon: <CheckCircle className="w-8 h-8" />,
                                title: "Accessible Design",
                                description: "Built specifically for Deaf students with inclusive, visual-first approach",
                                color: "indigo"
                            }
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                            >
                                <Card className="h-full border-gray-200 hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6">
                                        <div className={`w-14 h-14 bg-${feature.color}-100 rounded-xl flex items-center justify-center mb-4 text-${feature.color}-600`}>
                                            {feature.icon}
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            {feature.title}
                                        </h3>
                                        <p className="text-gray-600">
                                            {feature.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { value: "500+", label: "Active Students" },
                            { value: "26", label: "ISL Letters" },
                            { value: "98%", label: "Accuracy Rate" },
                            { value: "50+", label: "Lessons Available" }
                        ].map((stat, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="text-center"
                            >
                                <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-gray-600 font-medium">
                                    {stat.label}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-blue-600">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        Ready to start your learning journey?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Join hundreds of students learning Indian Sign Language with AI-powered tools
                    </p>
                    <Link href="/sign-detection">
                        <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 h-14 px-10 text-lg">
                            Get Started Free
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <Hand className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-white font-semibold">Silent Learn</span>
                            </div>
                            <p className="text-sm">
                                Making education accessible for Deaf students across India
                            </p>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Product</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white">Features</a></li>
                                <li><a href="#" className="hover:text-white">Lessons</a></li>
                                <li><a href="#" className="hover:text-white">Pricing</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Resources</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white">Documentation</a></li>
                                <li><a href="#" className="hover:text-white">Tutorials</a></li>
                                <li><a href="#" className="hover:text-white">Support</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Company</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white">About</a></li>
                                <li><a href="#" className="hover:text-white">Blog</a></li>
                                <li><a href="#" className="hover:text-white">Contact</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 text-center text-sm">
                        <p>© 2025 Silent Learn. Made with ❤️ for Deaf Students in India</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
