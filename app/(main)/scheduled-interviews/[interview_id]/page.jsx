import InterviewDetails from './_components/InterviewDetails'

async function InterviewDetailsPage({ params }) {
    const { interview_id } = await params

    return <InterviewDetails interviewId={interview_id} />
}

export default InterviewDetailsPage
