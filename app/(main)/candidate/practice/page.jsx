'use client'
import { useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { ArrowLeft, ArrowRight, Check, FileText, Gauge, Clock, LayoutGrid, Loader2, PenLine, Upload, X } from 'lucide-react'
import { INTERVIEW_TOPICS, DIFFICULTIES } from '@/services/interviewTopics'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import QuestionList from '../../dashboard/create-interview/_components/QuestionList'
import PaperBackdrop from '../../_components/PaperBackdrop'

const SOURCES = [
    { id: 'topic', label: 'Choose a topic', icon: LayoutGrid },
    { id: 'resume', label: 'Use my resume', icon: FileText },
    { id: 'custom', label: 'Custom role', icon: PenLine },
]

const DURATIONS = ['5', '15', '30']

const inputClass =
    'mt-1.5 w-full rounded-lg border border-orange-100 bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-3 focus:ring-orange-100'

function Header({ title, description }) {
    return (
        <div className='mb-6'>
            <h1 className='text-[28px] font-semibold tracking-tight text-slate-900'>{title}</h1>
            {description && <p className='mt-1 text-sm text-slate-500'>{description}</p>}
        </div>
    )
}

function ChoiceChips({ options, value, onChange, format = (option) => option }) {
    return (
        <div className='flex flex-wrap gap-2'>
            {options.map((option) => (
                <button
                    key={option}
                    type='button'
                    onClick={() => onChange(option)}
                    className={cn(
                        'h-8 cursor-pointer rounded-lg border px-3.5 text-[13px] font-medium transition-colors',
                        value === option
                            ? 'btn-orange border-transparent text-white'
                            : 'border-orange-100 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600'
                    )}
                >
                    {format(option)}
                </button>
            ))}
        </div>
    )
}

function PracticePage() {
    const router = useRouter()
    const fileInputRef = useRef(null)
    const [source, setSource] = useState('topic')
    const [topicId, setTopicId] = useState(null)
    const [resume, setResume] = useState(null) // { name, text, pages, words }
    const [parsingResume, setParsingResume] = useState(false)
    const [targetRole, setTargetRole] = useState('')
    const [customRole, setCustomRole] = useState('')
    const [customDescription, setCustomDescription] = useState('')
    const [duration, setDuration] = useState('15')
    const [difficulty, setDifficulty] = useState('Intermediate')
    const [practiceForm, setPracticeForm] = useState(null)

    const uploadResume = async (file) => {
        if (!file) return
        setParsingResume(true)
        try {
            const body = new FormData()
            body.append('file', file)
            const { data } = await axios.post('/api/resume-parse', body)
            setResume({ name: file.name, ...data })
        } catch (error) {
            toast.add({ title: error?.response?.data?.error || 'Unable to read this resume.' })
        } finally {
            setParsingResume(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const buildForm = () => {
        const base = { interviewDuration: duration, difficulty, isPractice: true }

        if (source === 'topic') {
            const topic = INTERVIEW_TOPICS.find((item) => item.id === topicId)
            if (!topic) return null
            return { ...base, jobPosition: topic.jobPosition, jobDescription: topic.jobDescription, types: topic.types }
        }
        if (source === 'resume') {
            if (!resume) return null
            const role = targetRole.trim() || 'Resume-based interview'
            return {
                ...base,
                jobPosition: role,
                jobDescription: `Interview based on the candidate's resume${targetRole.trim() ? ` for a ${role} role` : ''}.`,
                types: ['Technical', 'Experienced', 'Behavioral'],
                resumeText: resume.text,
            }
        }
        if (!customRole.trim() || !customDescription.trim()) return null
        return {
            ...base,
            jobPosition: customRole.trim(),
            jobDescription: customDescription.trim(),
            types: ['Technical', 'Behavioral', 'Problem Solving'],
        }
    }

    const startGenerating = () => {
        const form = buildForm()
        if (!form) {
            toast.add({
                title: source === 'topic' ? 'Pick a topic first'
                    : source === 'resume' ? 'Upload your resume first'
                        : 'Enter a role and a short description',
            })
            return
        }
        setPracticeForm(form)
    }

    if (practiceForm) {
        return (
            <div className='mx-auto max-w-3xl'>
                <button
                    type='button'
                    onClick={() => setPracticeForm(null)}
                    className='mb-4 inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-orange-600'
                >
                    <ArrowLeft className='size-4' /> Change setup
                </button>
                <Header
                    title={practiceForm.jobPosition}
                    description={`${practiceForm.interviewDuration} minutes · ${practiceForm.difficulty}${practiceForm.resumeText ? ' · Based on your resume' : ''}`}
                />
                <QuestionList
                    formData={practiceForm}
                    finishLabel='Start Practice Interview'
                    onCreateLink={(interviewId) => router.push(`/interview/${interviewId}`)}
                />
            </div>
        )
    }

    return (
        <div className='isolate pb-6'>
            <PaperBackdrop />
            <div className='relative mb-6 lg:pr-[240px]'>
                <h1 className='relative inline-block text-[28px] font-semibold tracking-tight text-slate-900'>
                    Practice interview
                    <svg aria-hidden viewBox='0 0 40 40' className='absolute -right-7 -top-2 size-6 text-orange-500'>
                        <path d='M8 4 L12 16' stroke='currentColor' strokeWidth='3.5' strokeLinecap='round' />
                        <path d='M20 14 L31 7' stroke='currentColor' strokeWidth='3.5' strokeLinecap='round' />
                        <path d='M22 25 L35 26' stroke='currentColor' strokeWidth='3.5' strokeLinecap='round' />
                    </svg>
                </h1>
                <p className='mt-1 text-sm text-slate-500'>Rehearse with the AI interviewer. Pick a topic, use your resume, or describe any role.</p>

                <div aria-hidden className='pointer-events-none absolute -top-8 right-0 hidden w-[220px] lg:block'>
                    <div className='absolute inset-x-0 bottom-0 top-8 bg-[radial-gradient(ellipse_at_center,rgba(255,214,176,0.6),transparent_70%)]' />
                    <Image
                        src='/Cheerful Robot Workspace Cutout.png'
                        alt=''
                        width={1536}
                        height={1024}
                        priority
                        className='relative h-auto w-full'
                    />
                </div>
            </div>

            {/* Source tabs */}
            <div className='card-soft inline-flex gap-0.5 rounded-xl p-1'>
                {SOURCES.map((item) => (
                    <button
                        key={item.id}
                        type='button'
                        onClick={() => setSource(item.id)}
                        className={cn(
                            'flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors',
                            source === item.id ? 'btn-orange text-white' : 'text-slate-600 hover:bg-orange-50/70 hover:text-slate-900'
                        )}
                    >
                        <item.icon className='size-3.5' />
                        <span className='hidden sm:inline'>{item.label}</span>
                    </button>
                ))}
            </div>

            <div className='mt-5'>
                {source === 'topic' && (
                    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'>
                        {INTERVIEW_TOPICS.map((topic) => {
                            const selected = topicId === topic.id
                            return (
                                <button
                                    key={topic.id}
                                    type='button'
                                    onClick={() => setTopicId(topic.id)}
                                    className={cn(
                                        'card-soft relative cursor-pointer rounded-xl p-4 text-left transition-all',
                                        selected
                                            ? 'border-orange-300 bg-gradient-to-br from-orange-50 via-[#fff7f0] to-white ring-1 ring-orange-200'
                                            : 'hover:-translate-y-0.5 hover:border-orange-200'
                                    )}
                                >
                                                                        <span className={cn(
                                        'flex size-9 items-center justify-center rounded-lg',
                                        selected ? 'bg-white text-orange-500 ring-1 ring-orange-100' : 'bg-orange-50 text-orange-500'
                                    )}>
                                        <topic.icon className='size-4.5' strokeWidth={1.75} />
                                    </span>
                                    <h3 className='mt-3 text-sm font-semibold text-slate-900'>{topic.jobPosition}</h3>
                                    <p className='mt-0.5 text-xs text-slate-500'>{topic.summary}</p>
                                </button>
                            )
                        })}
                    </div>
                )}

                {source === 'resume' && (
                    <div className='grid gap-3 lg:grid-cols-2'>
                        <div className='card-soft rounded-xl p-5'>
                            <input
                                ref={fileInputRef}
                                type='file'
                                accept='application/pdf,.pdf'
                                className='hidden'
                                onChange={(event) => uploadResume(event.target.files?.[0])}
                            />
                            {resume ? (
                                <div className='flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3'>
                                    <span className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm'>
                                        <FileText className='size-4.5' />
                                    </span>
                                    <div className='min-w-0 flex-1'>
                                        <p className='truncate text-sm font-medium text-slate-900'>{resume.name}</p>
                                        <p className='text-xs text-slate-500'>{resume.pages} page{resume.pages === 1 ? '' : 's'} · {resume.words} words read</p>
                                    </div>
                                    <button
                                        type='button'
                                        onClick={() => setResume(null)}
                                        aria-label='Remove resume'
                                        className='cursor-pointer rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-slate-700'
                                    >
                                        <X className='size-4' />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type='button'
                                    disabled={parsingResume}
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={(event) => event.preventDefault()}
                                    onDrop={(event) => {
                                        event.preventDefault()
                                        uploadResume(event.dataTransfer.files?.[0])
                                    }}
                                    className='flex w-full cursor-pointer flex-col items-center rounded-lg border-2 border-dashed border-orange-200 px-6 py-7 text-center transition-colors hover:border-orange-400 hover:bg-orange-50/40 disabled:cursor-wait'
                                >
                                    <span className='flex size-10 items-center justify-center rounded-lg bg-orange-50 text-orange-500'>
                                        {parsingResume ? <Loader2 className='size-5 animate-spin' /> : <Upload className='size-5' />}
                                    </span>
                                    <p className='mt-3 text-sm font-medium text-slate-900'>
                                        {parsingResume ? 'Reading your resume…' : 'Upload your resume'}
                                    </p>
                                    <p className='mt-0.5 text-xs text-slate-500'>Drag a PDF here or click to browse · max 5 MB</p>
                                </button>
                            )}

                            <label htmlFor='target-role' className='mt-4 block text-[13px] font-medium text-slate-900'>
                                Target role <span className='font-normal text-slate-400'>(optional)</span>
                            </label>
                            <input
                                id='target-role'
                                value={targetRole}
                                onChange={(event) => setTargetRole(event.target.value)}
                                placeholder='e.g., React Developer'
                                className={cn(inputClass, 'h-9')}
                            />
                        </div>

                        <div className='rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50/60 p-5'>
                            <h3 className='text-sm font-medium text-slate-900'>How resume interviews work</h3>
                            <ul className='mt-3 space-y-2.5 text-[13px] text-slate-600'>
                                {[
                                    'We read the text of your PDF. Your file is not stored.',
                                    'The AI asks about your real projects, skills and experience.',
                                    'Be ready to explain the decisions behind your own work.',
                                ].map((point) => (
                                    <li key={point} className='flex items-start gap-2'>
                                        <Check className='mt-0.5 size-3.5 shrink-0 text-orange-500' />
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {source === 'custom' && (
                    <div className='card-soft max-w-2xl rounded-xl p-5'>
                        <label htmlFor='custom-role' className='block text-[13px] font-medium text-slate-900'>Role</label>
                        <input
                            id='custom-role'
                            value={customRole}
                            onChange={(event) => setCustomRole(event.target.value)}
                            placeholder='e.g., Android Developer'
                            className={cn(inputClass, 'h-9')}
                        />
                        <label htmlFor='custom-description' className='mt-4 block text-[13px] font-medium text-slate-900'>What should it cover?</label>
                        <textarea
                            id='custom-description'
                            value={customDescription}
                            onChange={(event) => setCustomDescription(event.target.value)}
                            rows={4}
                            placeholder='Paste a job description, or list the skills you want to be asked about.'
                            className={cn(inputClass, 'py-2')}
                        />
                    </div>
                )}
            </div>

            {/* Settings */}
            <div className='card-soft mt-5 grid gap-5 rounded-xl p-5 sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-orange-100'>
                <div className='sm:pr-6'>
                    <h3 className='mb-2.5 flex items-center gap-1.5 text-[13px] font-medium text-slate-900'>
                        <Clock className='size-4 text-orange-500' strokeWidth={1.75} /> Duration
                    </h3>
                    <ChoiceChips options={DURATIONS} value={duration} onChange={setDuration} format={(option) => `${option} min`} />
                </div>
                <div className='sm:pl-6'>
                    <h3 className='mb-2.5 flex items-center gap-1.5 text-[13px] font-medium text-slate-900'>
                        <Gauge className='size-4 text-orange-500' strokeWidth={1.75} /> Difficulty
                    </h3>
                    <ChoiceChips options={DIFFICULTIES} value={difficulty} onChange={setDifficulty} />
                </div>
            </div>

            <div className='mt-5 flex justify-end'>
                <button
                    type='button'
                    onClick={startGenerating}
                    disabled={parsingResume}
                    className='btn-orange inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl px-5 text-sm font-medium text-white transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50'
                >
                    Generate questions <ArrowRight className='size-4' />
                </button>
            </div>
        </div>
    )
}

export default PracticePage
