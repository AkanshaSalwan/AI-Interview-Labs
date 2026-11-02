import { LayoutDashboard, LayoutGrid, Calendar, CalendarDays, List, WalletCards, Settings, Mic, ChartNoAxesColumnIncreasing } from "lucide-react"
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
    icon: LayoutGrid,
    path: '/candidate/dashboard'
  },
  {
    name: 'Practice',
    icon: Mic,
    path: '/candidate/practice'
  },
  {
    name: 'My Interviews',
    icon: CalendarDays,
    path: '/candidate/interviews'
  },
  {
    name: 'Progress',
    icon: ChartNoAxesColumnIncreasing,
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

export const FEEDBACK_PROMPT = `You are an experienced interviewer reviewing an interview conversation between the assistant (interviewer) and the user (candidate).

Interview Conversation:
{{conversation}}

Evaluate the candidate:
- Rate them out of 10 for technical skills, communication, problem solving, and experience.
- Write a 3-line summary.
- List 2-4 specific strengths and 2-4 specific areas to improve, referring to what they actually said.
- For EVERY question the interviewer actually asked, give: the question, a one-sentence summary of the
  candidate's answer, a score out of 10, what went well, what to improve, and a short example of a
  strong answer. If the candidate did not answer a question, score it 0 and say so.
- State whether the candidate is recommended for hire ("Recommended" or "Not Recommended") with a short explanation.

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
    "strengths": ["Specific strength"],
    "improvements": ["Specific area to improve"],
    "questionFeedback": [
      {
        "question": "The question as asked",
        "answerSummary": "What the candidate said, in one sentence.",
        "score": 6,
        "whatWentWell": "What was good about the answer.",
        "toImprove": "What was missing or could be better.",
        "idealAnswer": "A short example of a strong answer."
      }
    ],
    "recommendation": "Recommended",
    "recommendationMessage": "Explanation of the recommendation."
  }
}`;

// Appended to FEEDBACK_PROMPT for practice interviews: the report is shown to the candidate, not a recruiter.
export const PRACTICE_FEEDBACK_NOTE = `

IMPORTANT — this was a PRACTICE session and the candidate will read this report themselves (no recruiter sees it).
Write every text field (summary, strengths, improvements, answerSummary, whatWentWell, toImprove, recommendationMessage)
in the second person, speaking directly to the candidate as a supportive interview coach: use "you" and "your",
never "the candidate", "they" or their name. Be honest but encouraging, and make advice concrete and actionable.
Keep "recommendation" as exactly "Recommended" or "Not Recommended" (it means: ready for a real interview of this kind or not yet),
and write recommendationMessage as what a real interviewer would likely conclude, addressed to you.`;
