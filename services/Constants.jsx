import { LayoutDashboard, Calendar, List, WalletCards, Settings, Mic, ClipboardList, TrendingUp } from "lucide-react"
import { Code2Icon, User2Icon, BriefcaseBusinessIcon, PuzzleIcon } from "lucide-react"


export const RecruiterSidebarOptions = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard'
  },
  {
    name: 'Scheduled Interviews',
    icon: Calendar,
    path: '/scheduled-interviews'
  },
  {
    name: 'All Interviews',
    icon: List,
    path: '/all-interviews'
  },
  {
    name: 'Billing',
    icon: WalletCards,
    path: '/billing'
  },
  {
    name: 'Settings',
    icon: Settings,
    path: '/settings'
  }
]

export const CandidateSidebarOptions = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    path: '/candidate/dashboard'
  },
  {
    name: 'Practice',
    icon: Mic,
    path: '/candidate/practice'
  },
  {
    name: 'My Interviews',
    icon: ClipboardList,
    path: '/candidate/interviews'
  },
  {
    name: 'Progress',
    icon: TrendingUp,
    path: '/candidate/progress'
  },
  {
    name: 'Settings',
    icon: Settings,
    path: '/settings'
  }
]

export const InterviewType = [
  {
    title: 'Technical',
    icon: Code2Icon
  },
  {
    title: 'Behavioral',
    icon: User2Icon
  },
  {
    title: 'Experienced',
    icon: BriefcaseBusinessIcon
  },
  {
    title: 'Problem Solving',
    icon: PuzzleIcon
  },
  {
    title: 'Leadership',
    icon: User2Icon
  }
]


export const QUESTIONS_PROMPT = `You are an expert technical interviewer.
Based on the following inputs, generate a well-structured list of high-quality interview questions:
Job Title: {{jobTitle}}
Job Description:{{jobDescription}}
Interview Duration: {{duration}}
Interview Type: {{type}}

📝 Your task:
Analyze the job description to identify key responsibilities, required skills, and expected experience.
Generate a list of interview questions depends on interview duration
Adjust the number and depth of questions to match the interview duration.
Ensure the questions match the tone and structure of a real-life {{type}} interview.

🧩 Format your response in JSON format with array list of questions.
Return ONLY valid JSON, no extra text:
{"interviewQuestions":[{"question":"Your question here","type":"Technical"}]}
type must be one of: Technical, Behavioral, Experience, Problem Solving, Leadership

🎯 The goal is to create a structured, relevant, and time-optimized interview plan for a {{jobTitle}} role.`;

export const FEEDBACK_PROMPT = `Based on the following interview conversation between the assistant and the user, provide feedback for the user's interview:

Interview Conversation:
{{conversation}}

Rate the user out of 10 for technical skills, communication, problem solving, and experience.
Also provide a summary in 3 lines and state whether the user is recommended for hire,
including a message explaining the recommendation.

Return ONLY valid JSON, with this exact structure:
{
  "feedback": {
    "rating": {
      "technicalSkills": 5,
      "communication": 6,
      "problemSolving": 4,
      "experience": 7
    },
    "summary": "Three-line summary of the interview.",
    "recommendation": "Recommended",
    "recommendationMessage": "Explanation of the recommendation."
  }
}`;
