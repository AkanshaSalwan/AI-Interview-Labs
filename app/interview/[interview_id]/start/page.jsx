'use client'
import { InterviewDataContext } from '@/context/InterviewDataContext'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { Timer, Mic, Phone } from 'lucide-react'
import Image from 'next/image'
import Vapi from '@vapi-ai/web';
import AlertConfirmation from './_components/AlertConfirmation'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import axios from 'axios'
import { useParams } from 'next/navigation'


const DAILY_NOISE_PATTERNS = [
  'unsupported input processor',
  'meeting ended due to ejection',
  'meeting has ended',
  'mediastreamtrack found in props or cache',
]

function getErrorText(error) {
  try {
    return JSON.stringify(error ?? {})
  } catch {
    return String(error ?? '')
  }
}

function isBenignVapiError(error) {
  const text = getErrorText(error).toLowerCase()
  return DAILY_NOISE_PATTERNS.some((pattern) => text.includes(pattern)) ||
    text.includes('microphone preflight cancelled') ||
    text.includes('aborterror') ||
    text.includes('microphone-preflight')
}

function isDailyConsoleNoise(args) {
  const text = args
    .map((arg) => {
      if (typeof arg === 'string') return arg
      if (arg?.message) return String(arg.message)
      if (arg?.errorMsg) return String(arg.errorMsg)
      try {
        return JSON.stringify(arg)
      } catch {
        return String(arg)
      }
    })
    .join(' ')
    .toLowerCase()

  return DAILY_NOISE_PATTERNS.some((pattern) => text.includes(pattern))
}

function getMessageText(item) {
  if (!item) return ''
  if (typeof item.content === 'string') return item.content
  if (typeof item.message === 'string') return item.message
  if (typeof item.transcript === 'string') return item.transcript
  return ''
}

function normalizeConversation(items) {
  if (!Array.isArray(items)) return []

  return items
    .map((item) => {
      const content = getMessageText(item).trim()
      const rawRole = String(item?.role || '').toLowerCase()
      if (!content || !rawRole || rawRole === 'system' || rawRole === 'tool' || rawRole === 'function') {
        return null
      }

      return {
        role: rawRole === 'bot' || rawRole === 'assistant' ? 'assistant' : 'user',
        content,
      }
    })
    .filter(Boolean)
}

function conversationFromVapiMessage(message) {
  if (message?.type !== 'conversation-update') return null

  const fromOpenAI = normalizeConversation(message.messagesOpenAIFormatted)
  if (fromOpenAI.length) return fromOpenAI

  const fromMessages = normalizeConversation(message.messages || message.conversation)
  return fromMessages.length ? fromMessages : null
}

function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds]
    .map((unit) => String(unit).padStart(2, '0'))
    .join(':')
}

function StartInterview() {
  const { interviewInfo } = useContext(InterviewDataContext)
  const { interview_id: interviewId } = useParams()
  const vapiRef = useRef(null)
  const interviewInfoRef = useRef(interviewInfo)
  const callActiveRef = useRef(false)
  const conversationRef = useRef([])
  const feedbackInProgressRef = useRef(false)
  const feedbackSavedRef = useRef(false)
  const generateFeedbackRef = useRef(async () => {})
  const timerIntervalRef = useRef(null)
  const timerStartedAtRef = useRef(null)
  const [callActive, setCallActive] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [statusText, setStatusText] = useState('Ready to begin')
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false)
  const [isCandidateSpeaking, setIsCandidateSpeaking] = useState(false)
  const [feedback, setFeedback] = useState(null)

  interviewInfoRef.current = interviewInfo


  if (!vapiRef.current && process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY) {
    vapiRef.current = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY)
  }

  useEffect(() => {
    const originalError = console.error
    console.error = (...args) => {
      if (isDailyConsoleNoise(args)) return
      originalError.apply(console, args)
    }


    return () => {
      console.error = originalError
    }
  }, [])

  useEffect(() => {
    const vapi = vapiRef.current
    if (!vapi) return

    const onCallStart = () => {
      callActiveRef.current = true
      conversationRef.current = []
      feedbackInProgressRef.current = false
      feedbackSavedRef.current = false
      setFeedback(null)
      timerStartedAtRef.current = Date.now()
      setElapsedSeconds(0)
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = setInterval(() => {
        const startedAt = timerStartedAtRef.current
        if (startedAt) {
          setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000))
        }
      }, 1000)
      setCallActive(true)
      setIsStarting(false)
      setStatusText('Interview in Progress....')
      toast.add({ title: 'Call has started.' })
    }

    const onCallEnd = () => {
      window.setTimeout(() => {
        void generateFeedbackRef.current()
      }, 1500)
      callActiveRef.current = false
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
      timerStartedAtRef.current = null
      setCallActive(false)
      setIsStarting(false)
      setIsAssistantSpeaking(false)
      setIsCandidateSpeaking(false)
      setStatusText((current) =>
        current.startsWith('Ended:') ? current : 'Interview ended'
      )
      toast.add({ title: 'Call has ended.' })
    }

    const onMessage = (message) => {
      if (
        message?.type === 'transcript' &&
        message?.role &&
        message?.transcript &&
        (!message.transcriptType || message.transcriptType === 'final')
      ) {
        conversationRef.current.push({
          role: message.role === 'bot' ? 'assistant' : message.role,
          content: message.transcript,
        })
      }

      const updatedConversation = conversationFromVapiMessage(message)
      if (updatedConversation) {
        conversationRef.current = updatedConversation
      }

      if (message?.type === 'status-update' && message?.status === 'ended') {
        const reason = message?.endedReason || 'unknown'
        setStatusText(`Ended: ${reason}`)
      }
    }

    const onError = (error) => {
      if (isBenignVapiError(error)) return
      console.error('Vapi error:', getErrorText(error))
      setIsStarting(false)
      setStatusText('Unable to start interview. Please try again.')
    }

    const onSpeechStart = () => {
      setIsAssistantSpeaking(true)
    }

    const onSpeechEnd = () => {
      setIsAssistantSpeaking(false)
    }

    const onLocalVolumeLevel = (volume) => {
      setIsCandidateSpeaking(volume > 0.02)
    }

    vapi.on('call-start', onCallStart)
    vapi.on('call-end', onCallEnd)
    vapi.on('message', onMessage)
    vapi.on('error', onError)
    vapi.on('speech-start', onSpeechStart)
    vapi.on('speech-end', onSpeechEnd)
    vapi.on('local-volume-level', onLocalVolumeLevel)

    return () => {
      clearInterval(timerIntervalRef.current)
      vapi.removeListener('call-start', onCallStart)
      vapi.removeListener('call-end', onCallEnd)
      vapi.removeListener('message', onMessage)
      vapi.removeListener('error', onError)
      vapi.removeListener('speech-start', onSpeechStart)
      vapi.removeListener('speech-end', onSpeechEnd)
      vapi.removeListener('local-volume-level', onLocalVolumeLevel)
      // Do not call vapi.stop() here — Strict Mode remounts would eject the meeting.
    }
  }, [])

  const startCall = async () => {
    const vapi = vapiRef.current
    if (!vapi || !interviewInfo || callActiveRef.current || isStarting) return

    const questionList = interviewInfo?.interviewData?.questionList
      ?.map((item) => item?.question)
      .filter(Boolean)
      .join(', ')

    const assistantOptions = {
      name: 'AI Recruiter',
      firstMessage:
        'Hi ' +
        interviewInfo?.userName +
        ', how are you? Ready for your interview on ' +
        interviewInfo?.interviewData?.jobPosition +
        '?',
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'en-US',
      },
      // Built-in Vapi voice (Jennifer is not a valid Vapi voiceId).
      voice: {
        provider: 'vapi',
        voiceId: 'Emma',
        version: 2,
      },
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `
You are an AI voice assistant conducting interviews.
Your job is to ask candidates provided interview questions, assess their responses.
Begin the conversation with a friendly introduction, setting a relaxed yet professional tone. Example:
"Hey there! Welcome to your ${interviewInfo?.interviewData?.jobPosition} interview. Let's get started with a few questions!"
Ask one question at a time and wait for the candidate's response before proceeding. Keep the questions clear and concise. Below Are the questions ask one by one:
Questions: ${questionList}
If the candidate struggles, offer hints or rephrase the question without giving away the answer. Example:
"Need a hint? Think about how React tracks component updates!"
Provide brief, encouraging feedback after each answer. Example:
"Nice! That's a solid answer."
"Hmm, not quite! Want to try again?"
Keep the conversation natural and engaging—use casual phrases like "Alright, next up..." or "Let's tackle a tricky one!"
After 5-7 questions, wrap up the interview smoothly by summarizing their performance. Example:
"That was great! You handled some tough questions well. Keep sharpening your skills!"
End on a positive note:
"Thanks for chatting! Hope to see you crushing projects soon!"
Key Guidelines:
✅ Be friendly, engaging, and witty 🎤
✅ Keep responses short and natural, like a real conversation
✅ Adapt based on the candidate's confidence level
✅ Ensure the interview remains focused on React
`.trim(),
          },
        ],
      },
    }

    setIsStarting(true)
    setStatusText('Connecting...')

    try {
      await vapi.start(assistantOptions)
    } catch (error) {
      if (!isBenignVapiError(error)) {
        console.error('Vapi start failed:', getErrorText(error))
        setStatusText('Unable to start interview. Please try again.')
      }
      setIsStarting(false)
    }
  }

  const stopInterview = () => {
    const vapi = vapiRef.current
    if (!vapi) return

    try {
      vapi.stop()
    } catch (_) {
      // ignore — meeting may already be ended
    }
    callActiveRef.current = false
    clearInterval(timerIntervalRef.current)
    timerIntervalRef.current = null
    timerStartedAtRef.current = null
    setCallActive(false)
    setIsStarting(false)
    setIsAssistantSpeaking(false)
    setIsCandidateSpeaking(false)
    setStatusText('Interview ended')
    window.setTimeout(() => {
      void generateFeedbackRef.current()
    }, 1500)
  }

  const generateFeedback = async () => {
    if (feedbackInProgressRef.current || feedbackSavedRef.current) return

    feedbackInProgressRef.current = true
    setStatusText('Generating interview feedback...')

    try {
      let conversation = normalizeConversation(conversationRef.current)
      for (let attempt = 0; attempt < 6 && conversation.length === 0; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 500))
        conversation = normalizeConversation(conversationRef.current)
      }

      if (!conversation.length) {
        throw new Error('No interview transcript was captured.')
      }

      const currentInterviewInfo = interviewInfoRef.current
      const result = await axios.post('/api/ai-feedback', {
        conversation,
        interview_id: interviewId,
        userName: currentInterviewInfo?.userName,
        userEmail: currentInterviewInfo?.userEmail,
      })
      const content = result.data?.content
      if (!content) throw new Error(result.data?.error || 'Empty feedback response')

      const cleanedContent = content
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim()
      let generatedFeedback

      try {
        generatedFeedback = JSON.parse(cleanedContent)
      } catch {
        const objectMatch = cleanedContent.match(/\{[\s\S]*\}/)
        if (!objectMatch) {
          throw new Error('AI did not return valid JSON feedback.')
        }

        try {
          generatedFeedback = JSON.parse(objectMatch[0])
        } catch {
          throw new Error('AI returned malformed JSON feedback.')
        }
      }

      const feedbackData = generatedFeedback.feedback || generatedFeedback
      if (!feedbackData || typeof feedbackData !== 'object') {
        throw new Error('AI returned an invalid feedback structure.')
      }

      if (result.data?.error) {
        throw new Error(result.data.error)
      }

      feedbackSavedRef.current = true
      console.log('Saved interview feedback:', result.data?.saved)

      setFeedback(feedbackData)
      setStatusText('Interview feedback is ready')
      toast.add({ title: 'Interview feedback generated.' })
    } catch (error) {
      console.error('Unable to generate interview feedback:', error)
      setStatusText('Interview ended, but feedback could not be generated.')
      toast.add({
        title: error?.response?.data?.error || error?.message || 'Unable to generate feedback.',
      })
    } finally {
      feedbackInProgressRef.current = false
    }
  }

  generateFeedbackRef.current = generateFeedback

  return (
    <div className='p-20 lg:px-48 xl:px-56 bg-gray-200'>
      <h2 className='font-bold text-xl flex justify-between'>
        AI Interview Session
        <span className='flex gap-2 item-center'>
          <Timer />
          {formatDuration(elapsedSeconds)}
        </span>
      </h2>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-7 mt-5'>
        <div className='bg-white h-[400px] rounded-lg border flex flex-col gap-3 flex items-center justify-center'>
          <div className='relative'>
            {isAssistantSpeaking && <span className='absolute inset-0 rounded-full bg-violet-500 opacity-70 animate-ping' />}
            <Image src={'/ai.png'} alt='ai'
              width={100}
              height={100}
              className='w-[60px] h-[60px] rounded-full object-cover'
            />
          </div>
          <h2>AI Recruiter</h2>
        </div>
        <div className='bg-white h-[400px] rounded-lg border flex flex-col gap-3 items-center justify-center'>
          <div className='relative'>
            {isCandidateSpeaking && <span className='absolute inset-0 rounded-full bg-green-500 opacity-70 animate-ping' />}
            <h2 className='text-2xl bg-primary text-white p-3 rounded-full px-6'>{interviewInfo?.userName?.[0]}</h2>
          </div>
          <h2>{interviewInfo?.userName}</h2>
        </div>
      </div>

      {!callActive && (
        <div className='mt-7 flex justify-center'>
          <Button onClick={startCall} disabled={!interviewInfo || isStarting}>
            {isStarting ? 'Connecting...' : 'Start Interview'}
          </Button>
        </div>
      )}

      {callActive && (
        <div className='flex item-center gap-5 justify-center mt-7'>
          <Mic className='h-12 w-12 p-3 bg-gray-500 text-white rounded-full cursor-pointer' />
          <AlertConfirmation stopInterview={stopInterview}>
            <Phone className='h-12 w-12 p-3 bg-red-500 text-white rounded-full cursor-pointer' />
          </AlertConfirmation>
        </div>
      )}

      <h2 className='text-sm text-gray-400 text-center mt-5'>{statusText}</h2>
      {feedback?.summary && (
        <div className='mx-auto mt-5 max-w-2xl rounded-lg border bg-white p-4'>
          <h3 className='font-semibold'>Interview Feedback</h3>
          <p className='mt-2 whitespace-pre-line text-sm text-gray-600'>{feedback.summary}</p>
        </div>
      )}
    </div>
  )
}

export default StartInterview
