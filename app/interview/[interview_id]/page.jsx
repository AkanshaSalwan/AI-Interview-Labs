'use client'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { Building2, Clock, Info, Loader2Icon, Settings, Video } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { InterviewDataContext } from '@/context/InterviewDataContext'
import { createClient } from '@/services/supabaseClient'
import { useUser } from '@/app/provider'
import Logo from '@/components/brand/Logo'



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

    return (
        <main className='min-h-screen bg-slate-50 px-4 py-8 sm:py-12'>
            <section className='mx-auto w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
                <div className='flex justify-center'>
                    <Logo />
                </div>

                <div className='mt-3 flex justify-center'>
                    <Image
                        src="/interview.png"
                        alt='Interview illustration'
                        width={500}
                        height={500}
                        className='my-3 w-[220px] object-contain'
                    />
                </div>

                <header className='text-center'>
                    <h1 className='text-xl font-bold tracking-tight text-slate-900'>
                        {isLoading ? 'Loading interview...' : loadError || interviewData?.jobPosition}
                    </h1>
                    {interviewData?.duration && (
                        <div className='mt-3 flex items-center justify-center gap-5 text-sm text-slate-500'>
                            <span className='flex items-center gap-1.5'>
                                <Clock className='h-4 w-4' />
                                {interviewData.duration} Minutes
                            </span>
                        </div>
                    )}
                </header>

                <div className='mt-6'>
                    <label htmlFor='candidate-name' className='mb-2 block text-sm font-medium text-slate-900'>
                        Enter your full name
                    </label>
                    <Input
                        id='candidate-name'
                        placeholder='e.g., John Smith'
                        value={userName}
                        onChange={(event) => setUserName(event.target.value)}
                        className='h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-none placeholder:text-slate-400 focus-visible:border-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0'
                    />
                </div>
                 <div className='mt-6'>
                    <label htmlFor='candidate-email' className='mb-2 block text-sm font-medium text-slate-900'>
                        Enter your Email
                    </label>
                    <Input
                        id='candidate-email'
                        placeholder='e.g., john.smith@gmail.com'
                        type='email'
                        value={userEmail}
                        onChange={(event) => setUserEmail(event.target.value)}
                        className='h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-none placeholder:text-slate-400 focus-visible:border-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0'
                    />
                </div>

                <div className='mt-4 flex items-start gap-2.5 rounded-md border border-violet-100 bg-violet-50 p-3'>
                    <Info className='mt-0.5 h-4 w-4 shrink-0 text-violet-600' />
                    <div>
                        <h2 className='text-sm font-semibold text-violet-800'>Before you begin</h2>
                        <ul className='mt-1 list-disc space-y-0.5 pl-4 text-xs text-violet-700'>
                            <li>Ensure you have a stable internet connection</li>
                            <li>Test your camera and microphone</li>
                            <li>Find a quiet place for the interview</li>
                        </ul>
                    </div>
                </div>

                <div className='mt-4 space-y-2'>
                    <Button
                        className='h-9 w-full'
                        disabled={
                            isLoading ||
                            loading ||
                            Boolean(loadError) ||
                            !userName.trim() ||
                            !userEmail.trim()
                        }
                        onClick={onJoinInterview}
                    >
                        {loading ? <Loader2Icon className='animate-spin' /> : <Video />}
                        Join Interview
                    </Button>
                    {joinError && (
                        <p role='alert' className='text-sm text-red-600'>
                            {joinError}
                        </p>
                    )}
                </div>
            </section>
        </main>
    )
}

export default Interview