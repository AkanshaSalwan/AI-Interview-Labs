'use client'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { Clock, Loader2Icon, Video } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { InterviewDataContext } from '@/context/InterviewDataContext'
import { createClient } from '@/services/supabaseClient'
import { useUser } from '@/app/provider'
import SetupCheck from '../_components/SetupCheck'



function Interview() {
    const { interview_id } = useParams();
    const supabase = useMemo(() => createClient(), []);
    const [interviewData, setInterviewData] = useState(null);
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [joinError, setJoinError] = useState('');
    const { interviewInfo, setInterviewInfo } = useContext(InterviewDataContext);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [micReady, setMicReady] = useState(false);
    const { user } = useUser();

    // Signed-in users (e.g. candidates practising) don't need to retype their details.
    useEffect(() => {
        if (user?.name) setUserName((current) => current || user.name);
        if (user?.email) setUserEmail((current) => current || user.email);
    }, [user?.name, user?.email]);

    useEffect(() => {
        if (!interview_id) {
            setLoadError('Interview ID is missing.');
            setIsLoading(false);
            return;
        }

        const getInterviewDetails = async () => {
            try {
                // Interviews are protected by RLS; this function returns one interview's public fields by id.
                const { data, error } = await supabase.rpc('get_interview_public', { p_interview_id: interview_id });

                if (error) {
                    throw error;
                }

                if (!data) {
                    setLoadError('Interview not found.');
                    return;
                }

                setInterviewData(data);
            } catch (error) {
                console.error('Unable to load interview details:', error);
                setLoadError('Unable to load interview details. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        getInterviewDetails();
    }, [interview_id, supabase]);

    const onJoinInterview = async () => {
        setLoading(true);
        setJoinError('');

        try {
            const { data, error } = await supabase.rpc('get_interview_public', { p_interview_id: interview_id });

            if (error) {
                throw error;
            }

            if (!data) {
                setJoinError('Interview not found. Please check the interview link.');
                return;
            }

            setInterviewInfo({
                userName: userName.trim(),
                userEmail: userEmail.trim(),
                interviewData: data
            });
            router.push(`/interview/${interview_id}/start`);
        } catch (error) {
            console.error('Unable to join interview:', error);
            setJoinError('Unable to join the interview. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    const inputClass = 'h-10 w-full rounded-xl border border-orange-100 bg-white px-3.5 text-sm text-slate-800 shadow-none placeholder:text-slate-400 focus-visible:border-orange-300 focus-visible:ring-3 focus-visible:ring-orange-100 focus-visible:ring-offset-0'

    return (
        <main className='px-4 py-8 sm:py-12'>
            <section className='card-soft mx-auto w-full max-w-md overflow-hidden rounded-2xl'>
                <div className='hero-peach relative flex flex-col items-center px-6 pb-5 pt-6 text-center'>
                    <Image
                        src='/Cheerful Robot Workspace Cutout.png'
                        alt=''
                        width={1536}
                        height={1024}
                        priority
                        className='h-auto w-[210px]'
                    />
                    <p className='mt-3 text-xs font-medium text-orange-600'>AI voice interview</p>
                    <h1 className='mt-1 text-xl font-semibold tracking-tight text-slate-900'>
                        {isLoading ? 'Loading interview…' : loadError || interviewData?.jobPosition}
                    </h1>
                    {interviewData?.duration && (
                        <span className='mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-xs text-slate-600 ring-1 ring-orange-100'>
                            <Clock className='size-3.5 text-orange-500' />
                            {interviewData.duration} minutes
                        </span>
                    )}
                </div>

                <div className='space-y-4 p-6'>
                    <div>
                        <label htmlFor='candidate-name' className='mb-1.5 block text-[13px] font-medium text-slate-700'>
                            Full name
                        </label>
                        <Input
                            id='candidate-name'
                            placeholder='e.g., John Smith'
                            value={userName}
                            onChange={(event) => setUserName(event.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label htmlFor='candidate-email' className='mb-1.5 block text-[13px] font-medium text-slate-700'>
                            Email
                        </label>
                        <Input
                            id='candidate-email'
                            placeholder='e.g., john.smith@gmail.com'
                            type='email'
                            value={userEmail}
                            onChange={(event) => setUserEmail(event.target.value)}
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <h2 className='mb-2 text-[13px] font-medium text-slate-700'>Check your setup</h2>
                        <SetupCheck onReadyChange={setMicReady} />
                        <p className='mt-2 text-xs text-slate-500'>Find a quiet place and speak clearly. The interview starts as soon as you join.</p>
                    </div>

                    <div className='space-y-2'>
                        <button
                            type='button'
                            className='btn-orange inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-medium text-white transition-[filter,transform] hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50'
                            disabled={
                                isLoading ||
                                loading ||
                                Boolean(loadError) ||
                                !userName.trim() ||
                                !userEmail.trim() ||
                                !micReady
                            }
                            onClick={onJoinInterview}
                        >
                            {loading ? <Loader2Icon className='size-4 animate-spin' /> : <Video className='size-4' />}
                            Join interview
                        </button>
                        {!micReady && !loadError && (
                            <p className='text-center text-xs text-slate-500'>Test your microphone to continue.</p>
                        )}
                        {joinError && (
                            <p role='alert' className='text-[13px] text-red-600'>
                                {joinError}
                            </p>
                        )}
                    </div>
                </div>
            </section>
        </main>
    )
}

export default Interview