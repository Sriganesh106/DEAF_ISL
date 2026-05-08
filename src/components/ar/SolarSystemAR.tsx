'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const PLANETS = [
    { name: 'Sun', radius: 2, distance: 0, color: 0xfdb813 },
    { name: 'Mercury', radius: 0.2, distance: 4, color: 0x8c7853 },
    { name: 'Venus', radius: 0.35, distance: 6, color: 0xc4a35a },
    { name: 'Earth', radius: 0.4, distance: 8, color: 0x223399 },
    { name: 'Mars', radius: 0.25, distance: 10, color: 0xc1440e },
    { name: 'Jupiter', radius: 0.9, distance: 14, color: 0xd8ca9d },
    { name: 'Saturn', radius: 0.75, distance: 18, color: 0xf4d59e },
    { name: 'Uranus', radius: 0.5, distance: 22, color: 0x4fd0e7 },
    { name: 'Neptune', radius: 0.48, distance: 26, color: 0x4166f5 },
]

export default function SolarSystemAR() {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const width = container.clientWidth
        const height = Math.max(400, container.clientHeight || 400)

        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x0a0a12)

        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
        camera.position.set(0, 12, 28)
        camera.lookAt(0, 0, 0)

        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        container.appendChild(renderer.domElement)

        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.05
        controls.minDistance = 5
        controls.maxDistance = 80
        controls.maxPolarAngle = Math.PI / 2 + 0.2

        const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
        scene.add(ambientLight)

        const pointLight = new THREE.PointLight(0xffffff, 1.2, 100)
        pointLight.position.set(0, 0, 0)
        pointLight.castShadow = true
        scene.add(pointLight)

        const planetMeshes: THREE.Mesh[] = []

        PLANETS.forEach((planet, i) => {
            const geometry = new THREE.SphereGeometry(planet.radius, 32, 32)
            const material = new THREE.MeshStandardMaterial({
                color: planet.color,
                emissive: i === 0 ? 0xfdb813 : 0x000000,
                emissiveIntensity: i === 0 ? 0.4 : 0,
                metalness: i === 0 ? 0 : 0.2,
                roughness: 0.8,
            })
            const mesh = new THREE.Mesh(geometry, material)
            mesh.castShadow = true
            mesh.receiveShadow = true
            mesh.position.x = planet.distance
            mesh.userData = { name: planet.name }
            scene.add(mesh)
            planetMeshes.push(mesh)
        })

        let animationId: number

        const animate = () => {
            animationId = requestAnimationFrame(animate)
            const time = performance.now() * 0.0002
            planetMeshes.forEach((mesh, i) => {
                if (i > 0) {
                    const planet = PLANETS[i]
                    mesh.position.x = Math.cos(time + planet.distance * 0.5) * planet.distance
                    mesh.position.z = Math.sin(time + planet.distance * 0.5) * planet.distance
                }
            })
            controls.update()
            renderer.render(scene, camera)
        }
        animate()

        const handleResize = () => {
            const w = container.clientWidth
            const h = Math.max(400, container.clientHeight || 400)
            camera.aspect = w / h
            camera.updateProjectionMatrix()
            renderer.setSize(w, h)
        }
        window.addEventListener('resize', handleResize)

        return () => {
            cancelAnimationFrame(animationId)
            window.removeEventListener('resize', handleResize)
            container.removeChild(renderer.domElement)
            renderer.dispose()
            planetMeshes.forEach((m) => {
                m.geometry.dispose()
                ;(m.material as THREE.Material).dispose()
            })
            scene.clear()
        }
    }, [])

    return (
        <div
            ref={containerRef}
            className="w-full min-h-[400px] bg-[#0a0a12]"
            style={{ minHeight: 400 }}
        />
    )
}
