'use client'

import { useRef } from 'react'

// Tilts its children in 3D toward the mouse.
export default function TiltCard({ children, className = '', max = 8 }) {
    const ref = useRef(null)

    const onMove = (event) => {
        const node = ref.current
        if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
        const rect = node.getBoundingClientRect()
        const x = (event.clientX - rect.left) / rect.width - 0.5
        const y = (event.clientY - rect.top) / rect.height - 0.5
        node.style.transform = `perspective(1200px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg) scale(1.01)`
    }

    const onLeave = () => {
        if (ref.current) ref.current.style.transform = ''
    }

    return (
        <div
            ref={ref}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            className={`transition-transform duration-300 ease-out will-change-transform [transform-style:preserve-3d] ${className}`}
        >
            {children}
        </div>
    )
}
