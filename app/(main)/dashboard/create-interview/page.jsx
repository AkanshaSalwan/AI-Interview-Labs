import CreateInterview from './_components/CreateInterview'

async function CreateInterviewPage({ searchParams }) {
    const { mode } = await searchParams

    return <CreateInterview isScreening={mode === 'screening'} />
}

export default CreateInterviewPage
