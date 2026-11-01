'use client'
import { useEffect, useRef, useState } from 'react'

// Single-series line chart for scores out of 10.
// points: [{ id, label, value (0–10 or null), detail }] in chronological order.
// Single series → no legend; the card title names what's plotted.
const SERIES_COLOR = '#7c3aed' // brand violet, validated: lightness band, chroma, ≥3:1 on white
const GRID_COLOR = '#e2e8f0'
const AXIS_TEXT = '#64748b'
const SURFACE = '#ffffff'
const MAX = 10

function ScoreLineChart({ points, height = 220, compact = false, ariaLabel }) {
    const containerRef = useRef(null)
    const [width, setWidth] = useState(0)
    const [active, setActive] = useState(null)

    useEffect(() => {
        const element = containerRef.current
        if (!element) return
        const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
        observer.observe(element)
        return () => observer.disconnect()
    }, [])

    const margin = compact
        ? { top: 10, right: 30, bottom: 20, left: 22 }
        : { top: 16, right: 40, bottom: 28, left: 30 }
    const innerWidth = Math.max(0, width - margin.left - margin.right)
    const innerHeight = height - margin.top - margin.bottom
    const ticks = compact ? [0, 5, 10] : [0, 2, 4, 6, 8, 10]

    const x = (index) => margin.left + (points.length === 1 ? innerWidth / 2 : (index / (points.length - 1)) * innerWidth)
    const y = (value) => margin.top + (1 - value / MAX) * innerHeight

    const plotted = points
        .map((point, index) => ({ ...point, index }))
        .filter((point) => Number.isFinite(point.value))
    const linePath = plotted.map((point, i) => `${i ? 'L' : 'M'}${x(point.index)},${y(point.value)}`).join(' ')
    const areaPath = plotted.length > 1
        ? `${linePath} L${x(plotted.at(-1).index)},${y(0)} L${x(plotted[0].index)},${y(0)} Z`
        : ''
    const last = plotted.at(-1)
    const showAllMarkers = points.length <= 24

    const xLabelIndexes = points.length <= 1
        ? [0]
        : compact
            ? [0, points.length - 1]
            : [...new Set([0, points.length >= 5 ? Math.floor((points.length - 1) / 2) : null, points.length - 1])].filter((i) => i !== null)

    const nearestIndex = (clientX) => {
        const rect = containerRef.current.getBoundingClientRect()
        const relative = clientX - rect.left
        let best = null
        for (const point of plotted) {
            if (best === null || Math.abs(x(point.index) - relative) < Math.abs(x(best.index) - relative)) best = point
        }
        return best?.index ?? null
    }

    const onKeyDown = (event) => {
        if (!plotted.length) return
        const position = plotted.findIndex((point) => point.index === active)
        if (event.key === 'ArrowRight') {
            event.preventDefault()
            setActive(plotted[Math.min(plotted.length - 1, position + 1)].index)
        } else if (event.key === 'ArrowLeft') {
            event.preventDefault()
            setActive(plotted[Math.max(0, position === -1 ? plotted.length - 1 : position - 1)].index)
        } else if (event.key === 'Escape') {
            setActive(null)
        }
    }

    const activePoint = active !== null ? points[active] : null
    const tooltipLeft = activePoint ? x(active) : 0
    const flipTooltip = tooltipLeft > width * 0.6

    return (
        <div ref={containerRef} className='relative w-full' style={{ height }}>
            {width > 0 && (
                <svg
                    width={width}
                    height={height}
                    role='img'
                    aria-label={ariaLabel}
                    tabIndex={0}
                    onKeyDown={onKeyDown}
                    onFocus={() => setActive((current) => current ?? last?.index ?? null)}
                    onBlur={() => setActive(null)}
                    className='rounded-md outline-none focus-visible:ring-2 focus-visible:ring-violet-300'
                >
                    {ticks.map((tick) => (
                        <g key={tick}>
                            <line x1={margin.left} x2={width - margin.right} y1={y(tick)} y2={y(tick)} stroke={GRID_COLOR} strokeWidth={1} />
                            <text x={margin.left - 8} y={y(tick)} dy='0.32em' textAnchor='end' fontSize={11} fill={AXIS_TEXT} style={{ fontVariantNumeric: 'tabular-nums' }}>
                                {tick}
                            </text>
                        </g>
                    ))}

                    {xLabelIndexes.map((index) => (
                        <text
                            key={index}
                            x={x(index)}
                            y={height - 6}
                            fontSize={11}
                            fill={AXIS_TEXT}
                            textAnchor={points.length === 1 ? 'middle' : index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'}
                        >
                            {points[index]?.label}
                        </text>
                    ))}

                    {areaPath && <path d={areaPath} fill={SERIES_COLOR} opacity={0.1} />}
                    {plotted.length > 1 && (
                        <path d={linePath} fill='none' stroke={SERIES_COLOR} strokeWidth={2} strokeLinejoin='round' strokeLinecap='round' />
                    )}

                    {activePoint && (
                        <line x1={x(active)} x2={x(active)} y1={margin.top} y2={y(0)} stroke='#94a3b8' strokeWidth={1} />
                    )}

                    {plotted.map((point) => {
                        const isActive = point.index === active
                        const isLast = point.index === last?.index
                        if (!showAllMarkers && !isActive && !isLast) return null
                        return (
                            <circle
                                key={point.id ?? point.index}
                                cx={x(point.index)}
                                cy={y(point.value)}
                                r={isActive ? 5.5 : 4}
                                fill={SERIES_COLOR}
                                stroke={SURFACE}
                                strokeWidth={2}
                            />
                        )
                    })}

                    {last && (
                        <text x={x(last.index) + 9} y={y(last.value)} dy='0.32em' fontSize={12} fontWeight={600} fill='#0f172a'>
                            {last.value}
                        </text>
                    )}

                    {/* Hit area: the whole plot, so the pointer only needs to be near a session. */}
                    <rect
                        x={margin.left - 12}
                        y={margin.top}
                        width={innerWidth + 24}
                        height={innerHeight}
                        fill='transparent'
                        onPointerMove={(event) => setActive(nearestIndex(event.clientX))}
                        onPointerLeave={() => setActive(null)}
                    />
                </svg>
            )}

            <div aria-live='polite' className='sr-only'>
                {activePoint ? `${activePoint.label}: ${activePoint.value} out of 10. ${activePoint.detail ?? ''}` : ''}
            </div>

            {activePoint && Number.isFinite(activePoint.value) && (
                <div
                    className='pointer-events-none absolute z-10 min-w-32 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg'
                    style={{
                        top: Math.max(0, y(activePoint.value) - 64),
                        left: flipTooltip ? undefined : tooltipLeft + 12,
                        right: flipTooltip ? width - tooltipLeft + 12 : undefined,
                    }}
                >
                    <p className='flex items-center gap-2 text-sm'>
                        <span className='h-0.5 w-3 rounded-full' style={{ background: SERIES_COLOR }} />
                        <span className='font-semibold text-slate-900'>{activePoint.value}/10</span>
                    </p>
                    <p className='mt-0.5 text-xs text-slate-500'>{activePoint.label}</p>
                    {activePoint.detail && <p className='max-w-48 truncate text-xs text-slate-500'>{activePoint.detail}</p>}
                </div>
            )}
        </div>
    )
}

export default ScoreLineChart
