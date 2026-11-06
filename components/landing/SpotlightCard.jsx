'use client'

// A card with an orange glow that follows the mouse.
export default function SpotlightCard({ children, className = '' }) {
    const onMove = (event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        event.currentTarget.style.setProperty('--spot-x', `${event.clientX - rect.left}px`)
        event.currentTarget.style.setProperty('--spot-y', `${event.clientY - rect.top}px`)
    }

    return (
        <div onMouseMove={onMove} className={`lp-spotlight ${className}`}>
            {children}
        </div>
    )
}
