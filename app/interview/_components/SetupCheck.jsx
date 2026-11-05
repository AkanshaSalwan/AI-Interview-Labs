'use client'
import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Globe, Loader2, Mic, MonitorCheck, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// Level (0–1) the microphone has to reach once before we say "we can hear you".
const HEARD_LEVEL = 0.08

const STATUS_ICON = {
    checking: <Loader2 className='size-4 animate-spin text-slate-400' />,
    ok: <CheckCircle2 className='size-4 text-emerald-500' />,
    warn: <AlertTriangle className='size-4 text-amber-500' />,
    fail: <XCircle className='size-4 text-red-500' />,
    idle: <span className='size-4 rounded-full border-2 border-slate-200' />,
}

function CheckRow({ icon: Icon, title, status, detail, children }) {
    return (
        <li className='flex items-start gap-3 py-2.5'>
            <span className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-orange-100'>
                <Icon className='size-4' />
            </span>
            <div className='min-w-0 flex-1'>
                <p className='text-[13px] font-medium text-slate-900'>{title}</p>
                <p className={cn('text-xs', status === 'fail' ? 'text-red-600' : status === 'warn' ? 'text-amber-700' : 'text-slate-500')}>{detail}</p>
                {children}
            </div>
            <span className='mt-1.5 shrink-0'>{STATUS_ICON[status]}</span>
        </li>
    )
}

// Checks browser support, connection and microphone before the voice interview starts.
// Calls onReadyChange(true) once the microphone is allowed — the one thing the interview can't run without.
function SetupCheck({ onReadyChange }) {
    const [browser, setBrowser] = useState('checking')
    const [connection, setConnection] = useState({ status: 'checking', detail: 'Checking your connection…' })
    const [mic, setMic] = useState({ status: 'idle', detail: 'Click “Test microphone” and say a few words.' })
    const [level, setLevel] = useState(0)
    const cleanupRef = useRef(null)

    // Browser support and connection are checked once, in the browser.
    useEffect(() => {
        let cancelled = false
        const supported = Boolean(navigator.mediaDevices?.getUserMedia && (window.AudioContext || window.webkitAudioContext))
        const check = async () => {
            setBrowser(supported ? 'ok' : 'fail')
            // Connection: time a tiny request to this site.
            if (!navigator.onLine) {
                setConnection({ status: 'fail', detail: 'You seem to be offline.' })
                return
            }
            const started = performance.now()
            try {
                await fetch(`/favicon.ico?check=${Date.now()}`, { cache: 'no-store' })
                const ms = Math.round(performance.now() - started)
                if (!cancelled) {
                    setConnection(ms < 800
                        ? { status: 'ok', detail: `Good connection (${ms} ms)` }
                        : { status: 'warn', detail: `Slow connection (${ms} ms). The AI may lag; try a stronger network.` })
                }
            } catch {
                if (!cancelled) setConnection({ status: 'fail', detail: 'Could not reach the server. Check your internet.' })
            }
        }
        check()
        return () => { cancelled = true }
    }, [])

    // Release the microphone when leaving the page, so the interview can use it.
    useEffect(() => () => cleanupRef.current?.(), [])

    const testMicrophone = async () => {
        cleanupRef.current?.()
        setMic({ status: 'checking', detail: 'Waiting for permission…' })
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const AudioContextClass = window.AudioContext || window.webkitAudioContext
            const context = new AudioContextClass()
            const analyser = context.createAnalyser()
            analyser.fftSize = 512
            context.createMediaStreamSource(stream).connect(analyser)
            const samples = new Uint8Array(analyser.fftSize)
            let frame
            let heard = false

            const tick = () => {
                analyser.getByteTimeDomainData(samples)
                const peak = samples.reduce((max, value) => Math.max(max, Math.abs(value - 128) / 128), 0)
                setLevel(peak)
                if (!heard && peak > HEARD_LEVEL) {
                    heard = true
                    setMic({ status: 'ok', detail: 'We can hear you clearly.' })
                }
                frame = requestAnimationFrame(tick)
            }
            tick()

            cleanupRef.current = () => {
                cancelAnimationFrame(frame)
                stream.getTracks().forEach((track) => track.stop())
                context.close()
            }
            setMic({ status: 'warn', detail: 'Microphone allowed. Say something to test it.' })
            onReadyChange(true)
        } catch (error) {
            const denied = error?.name === 'NotAllowedError'
            setMic({
                status: 'fail',
                detail: denied
                    ? 'Microphone blocked. Click the lock icon in the address bar, allow the microphone, then test again.'
                    : 'No microphone found. Connect one and test again.',
            })
            onReadyChange(false)
        }
    }

    return (
        <div className='rounded-xl bg-orange-50/50 px-3.5 py-1 ring-1 ring-orange-100'>
            <ul className='divide-y divide-orange-100/70'>
                <CheckRow
                    icon={MonitorCheck}
                    title='Browser'
                    status={browser}
                    detail={{ ok: 'Your browser supports voice interviews.', fail: 'Please use the latest Chrome, Edge or Safari.' }[browser] ?? 'Checking…'}
                />
                <CheckRow icon={Globe} title='Internet' status={connection.status} detail={connection.detail} />
                <CheckRow icon={Mic} title='Microphone' status={mic.status} detail={mic.detail}>
                    <div className='mt-2 flex items-center gap-2.5'>
                        <button
                            type='button'
                            onClick={testMicrophone}
                            disabled={browser !== 'ok' || mic.status === 'checking'}
                            className='h-7 shrink-0 cursor-pointer rounded-md border border-orange-200 bg-white px-2.5 text-xs font-medium text-orange-700 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50'
                        >
                            {mic.status === 'idle' || mic.status === 'fail' ? 'Test microphone' : 'Test again'}
                        </button>
                        {(mic.status === 'ok' || mic.status === 'warn') && (
                            <div className='h-1.5 flex-1 overflow-hidden rounded-full bg-orange-100' aria-hidden>
                                <div className='h-full rounded-full bg-orange-500 transition-[width] duration-75' style={{ width: `${Math.min(100, level * 250)}%` }} />
                            </div>
                        )}
                    </div>
                </CheckRow>
            </ul>
        </div>
    )
}

export default SetupCheck
