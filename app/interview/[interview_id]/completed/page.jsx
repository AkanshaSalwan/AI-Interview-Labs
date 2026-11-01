import InterviewResult from './_components/InterviewResult'

async function CompletedInterview({ params, searchParams }) {
  const { interview_id } = await params
  const { feedback } = await searchParams

  return <InterviewResult interviewId={interview_id} feedbackId={feedback} />
}

export default CompletedInterview
