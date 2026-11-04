'use client'
import React from 'react'
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { InterviewType } from '@/services/Constants';
import { INTERVIEW_TOPICS } from '@/services/interviewTopics';
import { ArrowRightIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';



const DURATIONS = [
    { value: '5', label: '5 minutes' },
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '60 minutes' },
]

function FormContainer({ formData, onHandleInputChange, GoToNext }) {

    const selectedTypes = formData?.types ?? []

    const toggleType = (title) => {
        onHandleInputChange('types', selectedTypes.includes(title)
            ? selectedTypes.filter((item) => item !== title)
            : [...selectedTypes, title])
    }

    const applyTemplate = (topic) => {
        onHandleInputChange('jobPosition', topic.jobPosition)
        onHandleInputChange('jobDescription', topic.jobDescription)
        onHandleInputChange('types', topic.types)
    }

    return (
        <div className='surface rounded-2xl p-5'>
            <div className='mb-6 rounded-xl border border-orange-100 bg-orange-50/50 p-4'>
                <h2 className='flex items-center gap-2 text-sm font-medium text-orange-800'>
                    <Sparkles className='size-4' /> Start from a template
                </h2>
                <div className='mt-3 flex flex-wrap gap-2'>
                    {INTERVIEW_TOPICS.map((topic) => (
                        <button
                            key={topic.id}
                            type='button'
                            onClick={() => applyTemplate(topic)}
                            className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${formData?.jobPosition === topic.jobPosition ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-orange-300 hover:text-orange-700'}`}
                        >
                            <topic.icon className='size-3.5' />
                            {topic.jobPosition}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h2 className='text-sm font-medium'>Job Position</h2>
                <Input placeholder='Enter Job Position'
                    className='mt-2'
                    value={formData?.jobPosition ?? ''}
                    onChange={(event) => onHandleInputChange('jobPosition', event.target.value)}
                />
            </div>
            <div className='mt-5'>
                <h2 className='text-sm font-medium'>Job Description</h2>
                <Textarea placeholder='Enter Job Description' className='h-30 mt-2'
                    value={formData?.jobDescription ?? ''}
                    onChange={(event) => onHandleInputChange('jobDescription', event.target.value)}
                />
            </div>
            <div className='mt-5'>
                <h2 className='text-sm'>Interview Duration</h2>

                <Select
                    items={DURATIONS}
                    value={formData?.interviewDuration ?? null}
                    onValueChange={(value) => onHandleInputChange('interviewDuration', value)}
                >
                    <SelectTrigger className="w-full mt-2">
                        <SelectValue placeholder="Select Interview Duration" />
                    </SelectTrigger>
                    <SelectContent>
                        {DURATIONS.map((duration) => (
                            <SelectItem key={duration.value} value={duration.value}>{duration.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className='mt-5'>
                <h2 className='text-sm font-medium'>Interview Type</h2>
                <div className='flex gap-3 flex-wrap mt-2'>
                    {InterviewType.map((type) => (
                        <div
                            key={type.title}
                            className={`flex cursor-pointer items-center gap-2 p-1 px-2 border rounded-2xl whitespace-nowrap hover:bg-secondary ${selectedTypes.includes(type.title) ? 'bg-orange-50 text-primary border-primary' : 'bg-white border-gray-300'}`}
                            onClick={() => toggleType(type.title)}
                        >
                            <type.icon className='w-4 h-4' />
                            <span>{type.title}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className='mt-5 flex justify-end'>
                <Button onClick={() => GoToNext()}>Generate Interview Questions <ArrowRightIcon /></Button>
            </div>
        </div>
    )
}

export default FormContainer
