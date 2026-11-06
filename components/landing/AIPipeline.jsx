import { BadgeCheck, BrainCircuit, FileText, Mic, Wand2 } from 'lucide-react'

// Animated pipeline graphic: data "packets" flow along a curved path through five stages,
// and each stage lights up as a packet reaches it. Pure SVG/CSS, no JS needed.
const STAGES = [
    { icon: FileText, title: 'Job description', text: 'Paste a role or JD' },
    { icon: Wand2, title: 'AI questions', text: 'Role-specific set generated' },
    { icon: Mic, title: 'Voice interview', text: 'AI interviews the candidate' },
    { icon: BrainCircuit, title: 'AI scoring', text: 'Skills scored & summarized' },
    { icon: BadgeCheck, title: 'Hire decision', text: 'Compare, shortlist, hire' },
]

const CYCLE = 6 // seconds for one packet to cross the whole pipeline
// Path through the five node centres (x = 100, 300, 500, 700, 900; y = 100), waving between them.
const PATH = 'M100 100 C 170 30, 230 30, 300 100 S 430 170, 500 100 S 630 30, 700 100 S 830 170, 900 100'

export default function AIPipeline() {
    return (
        <div className='relative'>
            {/* connecting path + flowing packets (desktop) */}
            <svg viewBox='0 0 1000 200' preserveAspectRatio='none' className='absolute inset-x-0 top-0 hidden h-[200px] w-full md:block' aria-hidden='true'>
                <defs>
                    <linearGradient id='pipe-stroke' x1='0' x2='1'>
                        <stop offset='0%' stopColor='#fdba74' />
                        <stop offset='50%' stopColor='#f97316' />
                        <stop offset='100%' stopColor='#a855f7' />
                    </linearGradient>
                    <filter id='pipe-glow' x='-50%' y='-50%' width='200%' height='200%'>
                        <feGaussianBlur stdDeviation='4' result='blur' />
                        <feMerge>
                            <feMergeNode in='blur' />
                            <feMergeNode in='SourceGraphic' />
                        </feMerge>
                    </filter>
                </defs>
                <path d={PATH} fill='none' stroke='#fed7aa' strokeWidth='6' strokeLinecap='round' vectorEffect='non-scaling-stroke' />
                <path d={PATH} fill='none' stroke='url(#pipe-stroke)' strokeWidth='3' strokeLinecap='round' strokeDasharray='10 14' className='lp-dash' vectorEffect='non-scaling-stroke' />
                {[0, 1, 2].map((index) => (
                    <circle key={index} r='7' fill='#f97316' filter='url(#pipe-glow)'>
                        <animateMotion dur={`${CYCLE}s`} repeatCount='indefinite' path={PATH} begin={`-${(index * CYCLE) / 3}s`} />
                    </circle>
                ))}
            </svg>

            <ol className='relative grid gap-10 md:grid-cols-5 md:gap-4'>
                {STAGES.map((stage, index) => (
                    <li key={stage.title} className='flex flex-col items-center text-center'>
                        <div className='relative flex h-[200px] items-center justify-center max-md:h-auto'>
                            {/* pulse ring timed to the packet passing */}
                            <span
                                className='lp-node-pulse absolute size-24 rounded-full bg-orange-400/30'
                                style={{ animationDelay: `${(index * CYCLE) / 4 - CYCLE}s`, animationDuration: `${CYCLE / 3}s` }}
                            />
                            <span className='relative flex size-20 items-center justify-center rounded-3xl bg-white shadow-xl shadow-orange-900/10 ring-1 ring-orange-100'>
                                <span className='absolute inset-1 rounded-[20px] bg-gradient-to-br from-orange-50 to-white' />
                                <stage.icon className='relative size-8 text-orange-500' />
                                <span className='absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-[#ff7a1a] to-[#e8590c] text-xs font-bold text-white shadow-md'>
                                    {index + 1}
                                </span>
                            </span>
                        </div>
                        <h3 className='text-lg font-semibold text-slate-800'>{stage.title}</h3>
                        <p className='mt-1 text-sm text-slate-500'>{stage.text}</p>
                    </li>
                ))}
            </ol>
        </div>
    )
}
