'use client'
import Link from 'next/link'
import { Phone, Plus } from 'lucide-react'
import AssignInterviewCard from './_components/AssignInterviewCard'
import DecisionQueue from './_components/DecisionQueue'
import RecruiterStats from './_components/RecruiterStats'
import { useRecruiterOverview } from './_components/useRecruiterOverview'
import PageHeader from '../_components/PageHeader'

function Dashboard() {
  const { supabase, user, loading, interviews, invites, reports, addInvite, setDecision } = useRecruiterOverview()

  return (
    <div>
      <PageHeader
        title='HR Portal'
        description='Assign interviews, review AI feedback and decide who moves forward.'
        action={
          <div className='flex gap-2'>
            <Link
              href='/dashboard/create-interview?mode=screening'
              className='inline-flex h-9 items-center gap-1.5 rounded-[0.625rem] border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition-colors hover:bg-orange-50/60'
            >
              <Phone className='size-4' /> Phone screen
            </Link>
            <Link
              href='/dashboard/create-interview'
              className='btn-orange inline-flex h-9 items-center gap-1.5 rounded-[0.625rem] px-3.5 text-sm font-medium text-white hover:brightness-105'
            >
              <Plus className='size-4' /> New interview
            </Link>
          </div>
        }
      />

      <RecruiterStats interviews={interviews} invites={invites} reports={reports} loading={loading} />

      <div className='mt-5 grid gap-5 lg:grid-cols-[1fr_1.15fr]'>
        <AssignInterviewCard
          supabase={supabase}
          recruiterEmail={user?.email}
          interviews={interviews}
          invites={invites}
          loading={loading}
          onAssigned={addInvite}
        />
        <DecisionQueue interviews={interviews} reports={reports} loading={loading} onDecision={setDecision} />
      </div>
    </div>
  )
}

export default Dashboard
