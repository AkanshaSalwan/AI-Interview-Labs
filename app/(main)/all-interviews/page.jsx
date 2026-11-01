'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/services/supabaseClient';
import { useUser } from '@/app/provider';
import InterviewGrid from '../_components/InterviewGrid';
import PageHeader from '../_components/PageHeader';


function AllinterviewList() {
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
                .order('id', { ascending: false });

            if (error) {
                console.error(error);
            }
            setInterviewList(error ? [] : interviews || []);
            setLoading(false);
        }

        getInterviewList();
    }, [supabase, user?.email]);

    return (
        <div>
            <PageHeader
                title='All Interviews'
                description='Every interview you have created, newest first.'
            />
            <InterviewGrid interviews={interviewList} loading={loading} skeletonCount={6} />
        </div>
    )
}

export default AllinterviewList
