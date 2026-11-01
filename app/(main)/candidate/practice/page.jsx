'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { ArrowLeft, ArrowRight, Check, FileText, Gauge, Clock, LayoutGrid, Loader2, PenLine, Upload, X } from 'lucide-react'
import { INTERVIEW_TOPICS, DIFFICULTIES } from '@/services/interviewTopics'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import PageHeader from '../../_components/PageHeader'
import QuestionList from '../../dashboard/create-interview/_components/QuestionList'

const SOURCES = [
    { id: 'topic', label: 'Choose a topic', icon: LayoutGrid },
    { id: 'resume', label: 'Use my resume', icon: FileText },
    { id: 'custom', label: 'Custom role', icon: PenLine },
]

const DURATIONS = ['5', '15', '30']

function ChoiceChips({ options, value, onChange, format = (option) => option }) {
    return (
        <div className='flex flex-wrap gap-2'>
            {options.map((option) => (
                <button
                    key={option}
                    type='button'
                    onClick={() => onChange(option)}
                    className={cn(
                        'h-9 cursor-pointer rounded-lg border px-4 text-sm font-medium transition-colors',
                        value === option
                            ? 'border-violet-600 bg-violet-600 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-700'
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
                    className='mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800'
                >
                    <ArrowLeft className='size-4' /> Change setup
                </button>
                <PageHeader
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
        <div>
            <PageHeader
                title='Practice interview'
                description='Rehearse with the AI interviewer. Pick a topic, use your resume, or describe any role.'
            />

            {/* Source tabs */}
            <div className='inline-flex rounded-xl border border-slate-200 bg-white p-1'>
                {SOURCES.map((item) => (
                    <button
                        key={item.id}
                        type='button'
                        onClick={() => setSource(item.id)}
                        className={cn(
                            'flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                            source === item.id ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        )}
                    >
                        <item.icon className='size-4' />
                        <span className='hidden sm:inline'>{item.label}</span>
                    </button>
                ))}
            </div>

            <div className='mt-6'>
                {source === 'topic' && (
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
                        {INTERVIEW_TOPICS.map((topic) => {
                            const selected = topicId === topic.id
                            return (
                                <button
                                    key={topic.id}
                                    type='button'
                                    onClick={() => setTopicId(topic.id)}
                                    className={cn(
                                        'relative cursor-pointer rounded-2xl border-2 bg-white p-5 text-left transition-all',
                                        selected
                                            ? 'border-violet-600 shadow-lg shadow-violet-500/15'
                                            : 'border-slate-200 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md'
                                    )}
                                >
                                    {selected && (
                                        <span className='absolute right-4 top-4 flex size-5 items-center justify-center rounded-full bg-violet-600 text-white'>
                                            <Check className='size-3' strokeWidth={3} />
                                        </span>
                                    )}
                                    <span className={cn(
                                        'flex size-10 items-center justify-center rounded-xl',
                                        selected ? 'bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white' : 'bg-violet-50 text-violet-600'
                                    )}>
                                        <topic.icon className='size-5' />
                                    </span>
                                    <h3 className='mt-4 font-semibold text-slate-900'>{topic.jobPosition}</h3>
                                    <p className='mt-1 text-sm text-slate-500'>{topic.summary}</p>
                                </button>
                            )
                        })}
                    </div>
                )}

                {source === 'resume' && (
                    <div className='grid gap-4 lg:grid-cols-2'>
                        <div className='rounded-2xl border border-slate-200 bg-white p-6'>
                            <input
                                ref={fileInputRef}
                                type='file'
                                accept='application/pdf,.pdf'
                                className='hidden'
                                onChange={(event) => uploadResume(event.target.files?.[0])}
                            />
                            {resume ? (
                                <div className='flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4'>
                                    <span className='flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm'>
                                        <FileText className='size-5' />
                                    </span>
                                    <div className='min-w-0 flex-1'>
                                        <p className='truncate font-medium text-slate-900'>{resume.name}</p>
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
                                    className='flex w-full cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-slate-300 px-6 py-10 text-center transition-colors hover:border-violet-400 hover:bg-violet-50/40 disabled:cursor-wait'
                                >
                                    <span className='flex size-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600'>
                                        {parsingResume ? <Loader2 className='size-6 animate-spin' /> : <Upload className='size-6' />}
                                    </span>
                                    <p className='mt-4 font-medium text-slate-900'>
                                        {parsingResume ? 'Reading your resume…' : 'Upload your resume'}
                                    </p>
                                    <p className='mt-1 text-sm text-slate-500'>Drag a PDF here or click to browse · max 5 MB</p>
                                </button>
                            )}

                            <label htmlFor='target-role' className='mt-5 block text-sm font-medium text-slate-900'>
                                Target role <span className='font-normal text-slate-400'>(optional)</span>
                            </label>
                            <input
                                id='target-role'
                                value={targetRole}
                                onChange={(event) => setTargetRole(event.target.value)}
                                placeholder='e.g., React Developer'
                                className='mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-violet-400 focus:ring-3 focus:ring-violet-100'
                            />
                        </div>

                        <div className='rounded-2xl border border-slate-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-6'>
                            <h3 className='font-semibold text-slate-900'>How resume interviews work</h3>
                            <ul className='mt-4 space-y-3 text-sm text-slate-600'>
                                {[
                                    'We read the text of your PDF. Your file is not stored.',
                                    'The AI asks about your real projects, skills and experience.',
                                    'Be ready to explain the decisions behind your own work.',
                                ].map((point) => (
                                    <li key={point} className='flex items-start gap-2.5'>
                                        <Check className='mt-0.5 size-4 shrink-0 text-violet-600' />
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {source === 'custom' && (
                    <div className='max-w-2xl rounded-2xl border border-slate-200 bg-white p-6'>
                        <label htmlFor='custom-role' className='block text-sm font-medium text-slate-900'>Role</label>
                        <input
                            id='custom-role'
                            value={customRole}
                            onChange={(event) => setCustomRole(event.target.value)}
                            placeholder='e.g., Android Developer'
                            className='mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-violet-400 focus:ring-3 focus:ring-violet-100'
                        />
                        <label htmlFor='custom-description' className='mt-5 block text-sm font-medium text-slate-900'>What should it cover?</label>
                        <textarea
                            id='custom-description'
                            value={customDescription}
                            onChange={(event) => setCustomDescription(event.target.value)}
                            rows={5}
                            placeholder='Paste a job description, or list the skills you want to be asked about.'
                            className='mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-3 focus:ring-violet-100'
                        />
                    </div>
                )}
            </div>

            {/* Settings */}
            <div className='mt-6 grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 sm:grid-cols-2'>
                <div>
                    <h3 className='mb-3 flex items-center gap-2 text-sm font-medium text-slate-900'>
                        <Clock className='size-4 text-violet-600' /> Duration
                    </h3>
                    <ChoiceChips options={DURATIONS} value={duration} onChange={setDuration} format={(option) => `${option} min`} />
                </div>
                <div>
                    <h3 className='mb-3 flex items-center gap-2 text-sm font-medium text-slate-900'>
                        <Gauge className='size-4 text-violet-600' /> Difficulty
                    </h3>
                    <ChoiceChips options={DIFFICULTIES} value={difficulty} onChange={setDifficulty} />
                </div>
            </div>

            <div className='mt-6 flex justify-end'>
                <button
                    type='button'
                    onClick={startGenerating}
                    disabled={parsingResume}
                    className='inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-6 font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-50'
                >
                    Generate questions <ArrowRight className='size-5' />
                </button>
            </div>
        </div>
    )
}

export default PracticePage
