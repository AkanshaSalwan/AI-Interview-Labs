'use client'
import React, { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import FormContainer from './FormContainer';
import QuestionList from './QuestionList';
import { toast } from '@/components/ui/toast';
import InterviewLink from './InterviewLink';

// A phone screen is a short, high-level call before the full interview.
const SCREENING_DEFAULTS = {
    interviewDuration: '5',
    types: ['Behavioral', 'Experienced'],
}


function CreateInterview({ isScreening = false }) {

    const router = useRouter();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState(isScreening ? SCREENING_DEFAULTS : {})
    const [interview_id, setInterviewId] = useState();
    

    const onHandleInputChange = (field, value) => {
        setFormData(prev => {
            const updated = {
                ...prev,
                [field]: value
            }
            console.log("formData", updated)
            return updated
        })
    }

    const onGoToNextStep = () => {
        if (
            !formData?.jobPosition ||
            !formData?.jobDescription ||
            !formData?.interviewDuration ||
            !formData?.types?.length
        ) {
            toast.add({
                title: "Please enter all the details",
            })
            return
        }
        setStep(step + 1)
    }
    const onCreateLink = (interview_id) => {
        setInterviewId(interview_id);
        setStep(3);
    }


        return (
            <div className='mt-10 px-10 md:px-24 lg:px-44 xl:px-56'>
                <div className='flex gap-5 items-center'>
                    <ArrowLeft onClick={() => router.back()} className='cursor-pointer' />
                    <div>
                        <h2 className='font-bold text-2xl'>
                            {isScreening ? 'Create Phone Screening Call' : 'Create New Interview'}
                        </h2>
                        {isScreening && (
                            <p className='text-sm text-slate-500'>
                                A short call to check fit and experience before the full interview.
                            </p>
                        )}
                    </div>

                </div>
                <Progress value={step * 33.33} className="my-5 [&_[data-slot=progress-track]]:bg-orange-100" />
                {step === 1 ? <FormContainer
                    formData={formData}
                    onHandleInputChange={onHandleInputChange}
                    GoToNext={() => onGoToNextStep()}
                />
                    : step === 2 ? <QuestionList
                        formData={formData}
                        editable
                        onCreateLink={(interview_id) => onCreateLink(interview_id)}
                    /> :
                    step === 3 ? <InterviewLink interview_id={interview_id}
                    formData={formData}
                    isScreening={isScreening}
                    /> : null}

            </div>
        )
    }

    export default CreateInterview