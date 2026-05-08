'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { QrCode, Download, Loader2 } from 'lucide-react'
import FloatingSidebar from '@/components/ui/FloatingSidebar'

interface QRCodeItem {
    code: string
    name: string
    description: string
    targetUrl: string
    qrCode: string
}

export default function QRCodesPageGoogle() {
    const [qrCodes, setQrCodes] = useState<QRCodeItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchQRCodes() {
            try {
                const response = await fetch('/api/qr-generate')
                const data = await response.json()
                if (data.success) {
                    setQrCodes(data.qrCodes)
                } else {
                    setError('Failed to load QR codes')
                }
            } catch {
                setError('Failed to fetch QR codes')
            } finally {
                setLoading(false)
            }
        }
        fetchQRCodes()
    }, [])

    const downloadQR = (qrCode: string, name: string) => {
        const link = document.createElement('a')
        link.href = qrCode
        link.download = `${name.replace(/\s+/g, '-').toLowerCase()}-qr.png`
        link.click()
    }

    const iconMap: Record<string, string> = {
        'SOLAR-001': '🌍', 'BODY-001': '🧍', 'ANIMAL-001': '🦁',
        'PLANT-001': '🌱', 'GEOM-001': '📐', 'WATER-001': '💧',
    }

    return (
        <div className="min-h-screen bg-[#f5f5f7] font-sans">
            <FloatingSidebar activeId="ar" />

            <main className="ml-[100px] min-h-screen overflow-y-auto">
                <div className="p-7">

                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-[24px] font-bold text-gray-900 tracking-tight flex items-center gap-3 mb-1">
                                <QrCode className="w-6 h-6 text-purple-600" />
                                AR Learning QR Codes
                            </h1>
                            <p className="text-[13px] text-gray-500">
                                Scan these QR codes to launch augmented reality experiences
                            </p>
                        </div>
                        <div className="w-10 h-10 bg-purple-600 flex items-center justify-center text-white font-bold text-[13px]" style={{ borderRadius: 12 }}>
                            S
                        </div>
                    </div>

                    {loading && (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-7 h-7 text-purple-600 animate-spin" />
                            <span className="ml-3 text-[14px] text-gray-500">Loading QR codes...</span>
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-20">
                            <p className="text-red-600 text-[15px] font-medium">{error}</p>
                            <Button
                                className="mt-4 bg-purple-600 hover:bg-purple-700 font-semibold text-[13px] h-10"
                                style={{ borderRadius: 12 }}
                                onClick={() => window.location.reload()}
                            >
                                Try Again
                            </Button>
                        </div>
                    )}

                    {!loading && !error && (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {qrCodes.map((qr, index) => (
                                <motion.div
                                    key={qr.code}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.08 }}
                                    whileHover={{ y: -3 }}
                                    className="bg-white overflow-hidden"
                                    style={{ borderRadius: 16, boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}
                                >
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-[36px]">{iconMap[qr.code] || '📱'}</span>
                                            <span className="bg-purple-100 text-purple-700 text-[11px] font-semibold px-2.5 py-1" style={{ borderRadius: 8 }}>
                                                {qr.code}
                                            </span>
                                        </div>
                                        <h3 className="text-gray-900 text-[16px] font-bold tracking-tight mb-1">{qr.name}</h3>
                                        <p className="text-gray-400 text-[12px] font-medium mb-4">{qr.description}</p>

                                        <div className="bg-[#f7f7f8] p-4 mb-4 flex items-center justify-center" style={{ borderRadius: 14 }}>
                                            <img
                                                src={qr.code === 'BODY-001' ? '/human%20skleton.jpeg' : qr.qrCode}
                                                alt={qr.code === 'BODY-001' ? 'Human Skeleton' : `QR Code for ${qr.name}`}
                                                className="w-44 h-44 object-contain"
                                            />
                                        </div>

                                        <p className="text-[11px] text-gray-400 text-center mb-4 truncate font-medium">
                                            {qr.targetUrl}
                                        </p>

                                        <Button
                                            className="w-full bg-purple-600 hover:bg-purple-700 font-semibold text-[13px] h-10"
                                            style={{ borderRadius: 12 }}
                                            onClick={() => downloadQR(qr.qrCode, qr.name)}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download QR Code
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {!loading && !error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="mt-8 bg-purple-50 p-6"
                            style={{ borderRadius: 20 }}
                        >
                            <h3 className="text-[15px] font-bold text-gray-900 mb-3">
                                📱 How to use these QR Codes
                            </h3>
                            <ol className="space-y-1.5 text-[13px] text-gray-600">
                                <li>1. Download or scan any QR code above</li>
                                <li>2. Open your phone camera and point it at the QR code</li>
                                <li>3. Tap the link that appears to open the AR experience</li>
                                <li>4. Point your phone at a flat surface to place the 3D model</li>
                            </ol>
                        </motion.div>
                    )}
                </div>
            </main>
        </div>
    )
}
