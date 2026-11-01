import { BarChart3, Binary, Code2, Handshake, Layers, Network, Server, Users } from "lucide-react"

// Ready-made interview topics, so nobody has to write a job description every time.
// `types` must match titles in InterviewType (services/Constants.jsx).
export const INTERVIEW_TOPICS = [
  {
    id: 'frontend',
    icon: Code2,
    jobPosition: 'Frontend Developer',
    summary: 'React, JavaScript, CSS, performance',
    jobDescription:
      'Build responsive, accessible web interfaces with React and modern JavaScript/TypeScript. ' +
      'Covers component design, state management, hooks, browser rendering, CSS layout, ' +
      'web performance, API integration and testing.',
    types: ['Technical', 'Problem Solving'],
  },
  {
    id: 'backend',
    icon: Server,
    jobPosition: 'Backend Developer',
    summary: 'APIs, databases, auth, scaling',
    jobDescription:
      'Design and build server-side applications and REST/GraphQL APIs. Covers relational and ' +
      'NoSQL databases, query optimisation, authentication and authorisation, caching, queues, ' +
      'error handling, security best practices and scaling services.',
    types: ['Technical', 'Problem Solving'],
  },
  {
    id: 'fullstack',
    icon: Layers,
    jobPosition: 'Full Stack Developer',
    summary: 'Frontend + backend + deployment',
    jobDescription:
      'Own features end to end: React frontends, Node.js APIs, databases and deployment. ' +
      'Covers data modelling, API design, state management, authentication, testing, CI/CD ' +
      'and debugging across the stack.',
    types: ['Technical', 'Problem Solving', 'Experienced'],
  },
  {
    id: 'dsa',
    icon: Binary,
    jobPosition: 'Data Structures & Algorithms',
    summary: 'Arrays, trees, graphs, complexity',
    jobDescription:
      'Coding-round interview on data structures and algorithms: arrays, strings, hash maps, ' +
      'linked lists, stacks, queues, trees, graphs, recursion, dynamic programming, sorting and ' +
      'searching. The candidate should explain their approach and its time and space complexity.',
    types: ['Technical', 'Problem Solving'],
  },
  {
    id: 'system-design',
    icon: Network,
    jobPosition: 'System Design',
    summary: 'Scalability, trade-offs, architecture',
    jobDescription:
      'System design interview: design scalable distributed systems. Covers requirements ' +
      'gathering, APIs, data storage choices, caching, load balancing, sharding, replication, ' +
      'message queues, consistency vs availability trade-offs and bottlenecks.',
    types: ['Technical', 'Problem Solving'],
  },
  {
    id: 'data-analyst',
    icon: BarChart3,
    jobPosition: 'Data Analyst',
    summary: 'SQL, statistics, dashboards',
    jobDescription:
      'Turn data into business insights. Covers SQL queries and joins, data cleaning, Excel, ' +
      'basic statistics, A/B testing, data visualisation, dashboards and explaining findings ' +
      'to non-technical stakeholders.',
    types: ['Technical', 'Problem Solving'],
  },
  {
    id: 'hr',
    icon: Users,
    jobPosition: 'HR Round',
    summary: 'About you, motivation, culture fit',
    jobDescription:
      'General HR interview: introduce yourself, strengths and weaknesses, career goals, why ' +
      'this company, handling pressure and conflict, teamwork, salary expectations and ' +
      'situational questions.',
    types: ['Behavioral'],
  },
  {
    id: 'managerial',
    icon: Handshake,
    jobPosition: 'Managerial Round',
    summary: 'Leadership, ownership, decisions',
    jobDescription:
      'Managerial interview: leading and mentoring a team, ownership, prioritisation, handling ' +
      'disagreements, giving feedback, decision-making with incomplete information and ' +
      'delivering projects under deadlines.',
    types: ['Behavioral', 'Leadership', 'Experienced'],
  },
]

export const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced']
