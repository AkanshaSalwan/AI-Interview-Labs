'use client'

import { useEffect, useRef, useState } from 'react'

// Fades/slides its children in the first time they scroll into view.
export default function Reveal({ children, delay = 0, className = '', as: Tag = 'div', ...props }) {
    const ref = useRef(null)
    const [visible, setVisible] = useState(false)
    // Drop the delay once revealed so it doesn't also delay hover effects.
    const [settled, setSettled] = useState(false)

    useEffect(() => {
        const node = ref.current
        if (!node) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true)
                    observer.disconnect()
                }
            },
            { threshold: 0.15 }
        )
        observer.observe(node)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (!visible) return
        const id = setTimeout(() => setSettled(true), delay + 750)
        return () => clearTimeout(id)
    }, [visible, delay])

    return (
        <Tag
            ref={ref}
            className={`lp-reveal ${visible ? 'lp-in' : ''} ${className}`}
            style={settled ? undefined : { transitionDelay: `${delay}ms` }}
            {...props}
        >
            {children}
        </Tag>
    )
}
