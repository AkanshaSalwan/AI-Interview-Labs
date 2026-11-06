import Image from 'next/image'
import { BarChart3, BrainCircuit, Code2, MessageSquare, Mic, Sparkles, Target, Users } from 'lucide-react'

// Robot mascot with skill icons orbiting on two counter-rotating rings. Pure CSS animation.
const INNER = [Mic, BrainCircuit, BarChart3, MessageSquare]
const OUTER = [Code2, Users, Target, Sparkles]

function Ring({ icons, size, reverse = false, duration }) {
    return (
        <div
            className={`absolute left-1/2 top-1/2 rounded-full border border-dashed border-white/40 ${reverse ? 'lp-orbit-rev' : 'lp-orbit'}`}
            style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, animationDuration: `${duration}s` }}
        >
            {icons.map((Icon, index) => {
                const angle = (360 / icons.length) * index
                return (
                    <div
                        key={index}
                        className='absolute left-1/2 top-1/2'
                        style={{ transform: `rotate(${angle}deg) translateY(${-size / 2}px)` }}
                    >
                        {/* undo the ring + slot rotation so icons stay upright */}
                        <div style={{ transform: `rotate(${-angle}deg)` }}>
                            <span
                                className={`-ml-5 -mt-5 flex size-10 items-center justify-center rounded-xl bg-white text-orange-500 shadow-lg ${reverse ? 'lp-orbit' : 'lp-orbit-rev'}`}
                                style={{ animationDuration: `${duration}s` }}
                            >
                                <Icon className='size-5' />
                            </span>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default function OrbitGraphic() {
    return (
        <div className='relative size-72 shrink-0 md:size-80' aria-hidden='true'>
            <div className='absolute left-1/2 top-1/2 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25 blur-2xl lp-glow-soft' />
            <Ring icons={INNER} size={190} duration={18} />
            <Ring icons={OUTER} size={290} duration={26} reverse />
            <Image
                src='/Smiling Orange Robot Mascot.png'
                alt=''
                width={1312}
                height={1199}
                className='lp-float absolute left-1/2 top-1/2 h-auto w-32 -translate-x-1/2 -translate-y-1/2 drop-shadow-2xl'
            />
        </div>
    )
}
