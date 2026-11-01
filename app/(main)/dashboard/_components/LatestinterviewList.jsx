'use client'
import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/services/supabaseClient';
import { useUser } from '@/app/provider';
import InterviewGrid from '../../_components/InterviewGrid';


function LatestinterviewList() {
    const supabase = useMemo(() => createClient(), []);
    const [interviewList, setInterviewList] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useUser();

    useEffect(() => {
        if (!user?.email) return;

        const getInterviewList = async () => {
            setLoading(true);
            const { data: interviews, error } = await supabase
                .from('interviews')
                .select('*')
                .eq('userEmail', user.email)
                .order('id', { ascending: false })
                .limit(6);

            if (error) {
                console.error(error);
            }
            setInterviewList(error ? [] : interviews || []);
            setLoading(false);
        }

        getInterviewList();
    }, [supabase, user?.email]);

    return (
        <div className='mt-10'>
            <div className='mb-4 flex items-center justify-between'>
                <h2 className='text-lg font-semibold text-slate-900'>Recently created interviews</h2>
                {interviewList.length > 0 && (
                    <Link href='/all-interviews' className='inline-flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700'>
                        View all <ArrowRight className='size-4' />
                    </Link>
                )}
            </div>
            <InterviewGrid interviews={interviewList} loading={loading} />
        </div>
    )
}

export default LatestinterviewList
