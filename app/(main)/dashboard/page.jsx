import React from 'react'
import CreateOptions from './_components/CreateOptions'
import LatestinterviewList from './_components/LatestinterviewList'
import RecruiterStats from './_components/RecruiterStats'
import PageHeader from '../_components/PageHeader'

function Dashboard() {
  return (
    <div>
      <PageHeader
        title='Dashboard'
        description='Create AI interviews, share them with candidates and review results.'
      />
      <RecruiterStats />
      <CreateOptions />
      <LatestinterviewList />
    </div>
  )
}

export default Dashboard
