import { redirect } from 'next/navigation'

// All Interviews was merged into the Interviews page.
function AllInterviewsPage() {
    redirect('/scheduled-interviews')
}

export default AllInterviewsPage
