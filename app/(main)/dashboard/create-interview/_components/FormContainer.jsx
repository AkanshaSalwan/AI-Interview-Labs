'use client'
import React, { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { InterviewType } from '@/services/Constants';
import { ArrowRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';



const DURATIONS = [
    { value: '5', label: '5 minutes' },
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '60 minutes' },
]

function FormContainer({ onHandleInputChange , GoToNext, defaults }) {

    const [interviewType, setInterviewType] = useState(defaults?.types ?? []);
    
    useEffect(()=>{
        if(interviewType)
            {
                onHandleInputChange('types',interviewType)
            }
    },[interviewType])

    return (
        <div className='p-5 bg-white rounded-2xl'>
            <div>
                <h2 className='text-sm font-medium'>Job Position</h2>
                <Input placeholder='Enter Job Position'
                    className='mt-2'
                    onChange={(event) => onHandleInputChange('jobPosition', event.target.value)}
                />
            </div>
            <div className='mt-5'>
                <h2 className='text-sm font-medium'>Job Description</h2>
                <Textarea placeholder='Enter Job Description' className='h-30 mt-2'
                    onChange={(event) => onHandleInputChange('jobDescription', event.target.value)}
                />
            </div>
            <div className='mt-5'>
                <h2 className='text-sm'>Interview Duration</h2>

                <Select
                    items={DURATIONS}
                    defaultValue={defaults?.interviewDuration}
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
                    {InterviewType.map((type, index) => (
                        <div
                            key={index}
                            className={`flex cursor-pointer items-center gap-2 p-1 px-2 border rounded-2xl whitespace-nowrap hover:bg-secondary ${interviewType.includes(type.title) ? 'bg-violet-50 text-primary border-primary' : 'bg-white border-gray-300'}`}
                            onClick={() => setInterviewType((prev) =>
                                prev.includes(type.title)
                                    ? prev.filter((item) => item !== type.title)
                                    : [...prev, type.title]
                            )}
                        >
                            <type.icon className='w-4 h-4' />
                            <span>{type.title}</span>
                        </div>
                    ))}
                </div>



            </div>

            <div className='mt-5 flex justify-end' onClick={()=>GoToNext()}>
                <Button>Generate Interview Questions <ArrowRightIcon /></Button>
            </div>
        </div>
    )
}

export default FormContainer