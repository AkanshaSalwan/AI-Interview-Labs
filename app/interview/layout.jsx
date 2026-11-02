'use client'
import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import InterviewHeader from './_components/InterviewHeader'
import { InterviewDataContext } from '@/context/InterviewDataContext'

function InterviewLayout({ children }) {

  const [interviewInfo, setInterviewInfo] = useState();
  // The results page renders its own header (top nav for practice results, logo bar otherwise).
  const isResultsPage = usePathname()?.endsWith('/completed')

  return (
    <InterviewDataContext.Provider value={{ interviewInfo, setInterviewInfo }}>
      <div className='app-canvas relative min-h-screen'>
        {!isResultsPage && <InterviewHeader />}
        {children}
      </div>
    </InterviewDataContext.Provider>
  )
}

export default InterviewLayout
