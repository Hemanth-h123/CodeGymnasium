// Shared data store for managing courses and problems across admin and user views
// This provides a centralized data management system using localStorage

interface CourseTopic {
  id: string
  title: string
  description: string
  content: string
  duration: number // in minutes
  videoUrl?: string
  order: number
}

interface CourseExample {
  id: string
  title: string
  description: string
  code: string
  language: string
  explanation: string
}

interface Course {
  id: number
  title: string
  slug: string
  description: string
  category: string
  difficulty: string
  duration: number
  enrolled: number
  rating: number
  thumbnail: string
  isPublished: boolean
  createdAt: string
  topics?: number
  requirements?: string
  learningOutcomes?: string
  syllabus?: string
  courseTopics?: CourseTopic[]
  courseExamples?: CourseExample[]
  associatedProblems?: number[] // Problem IDs
}

interface Problem {
  id: number
  title: string
  slug: string
  difficulty: string
  category: string
  description?: string
  testCases: number
  submissions: number
  acceptanceRate: number
  isPublished: boolean
  createdAt: string
  solved?: boolean
  constraints?: string
  examples?: string
  hints?: string
  starterCode?: { [language: string]: string }
  solution?: { [language: string]: string }
  supportedLanguages?: string[]
  timeComplexity?: string
  spaceComplexity?: string
}

interface Challenge {
  id: number
  title: string
  slug: string
  difficulty: string
  category: string
  description?: string
  testCases: number
  participants: number
  isPublished: boolean
  createdAt: string
  constraints?: string
  examples?: string
  hints?: string
  starterCode?: { [language: string]: string }
  supportedLanguages?: string[]
  timeComplexity?: string
  spaceComplexity?: string
  maxScore: number
  timeLimit?: number // in minutes
  startDate?: string
  endDate?: string
}

interface Report {
  id: number
  userId: string
  userName: string
  type: 'course' | 'problem' | 'challenge'
  itemId: number
  itemTitle: string
  reason: string
  description: string
  status: 'pending' | 'resolved' | 'dismissed'
  createdAt: string
}

// Initialize default data
const DEFAULT_COURSES: Course[] = [
  {
    id: 1,
    title: 'Data Structures Fundamentals',
    slug: 'data-structures-fundamentals',
    description: 'Master the essential data structures every programmer needs to know',
    category: 'Data Structures',
    difficulty: 'beginner',
    duration: 12,
    enrolled: 2456,
    rating: 4.8,
    thumbnail: '📚',
    isPublished: true,
    createdAt: '2025-10-15',
    topics: 8
  },
  {
    id: 2,
    title: 'Algorithms & Problem Solving',
    slug: 'algorithms-problem-solving',
    description: 'Learn algorithmic thinking and problem-solving techniques',
    category: 'Algorithms',
    difficulty: 'intermediate',
    duration: 16,
    enrolled: 1823,
    rating: 4.9,
    thumbnail: '🧮',
    isPublished: true,
    createdAt: '2025-10-20',
    topics: 12
  },
  {
    id: 3,
    title: 'Web Development with JavaScript',
    slug: 'web-development-javascript',
    description: 'Build modern web applications with JavaScript, React, and Node.js',
    category: 'Web Development',
    difficulty: 'beginner',
    duration: 20,
    enrolled: 3214,
    rating: 4.7,
    thumbnail: '🌐',
    isPublished: true,
    createdAt: '2025-11-01',
    topics: 15
  },
  {
    id: 4,
    title: 'Advanced System Design',
    slug: 'advanced-system-design',
    description: 'Deep dive into complex algorithms and optimization techniques',
    category: 'System Design',
    difficulty: 'advanced',
    duration: 24,
    enrolled: 0,
    rating: 4.9,
    thumbnail: '🚀',
    isPublished: false,
    createdAt: '2025-11-15',
    topics: 10
  },
  {
    id: 5,
    title: 'System Design Interview',
    slug: 'system-design-interview',
    description: 'Prepare for system design interviews at top tech companies',
    category: 'System Design',
    difficulty: 'advanced',
    duration: 18,
    enrolled: 1543,
    rating: 4.8,
    thumbnail: '🏗️',
    isPublished: true,
    createdAt: '2025-10-25',
    topics: 12
  },
  {
    id: 6,
    title: 'Python for Beginners',
    slug: 'python-for-beginners',
    description: 'Start your programming journey with Python',
    category: 'Programming',
    difficulty: 'beginner',
    duration: 10,
    enrolled: 4567,
    rating: 4.6,
    thumbnail: '🐍',
    isPublished: true,
    createdAt: '2025-09-10',
    topics: 9
  }
]

const DEFAULT_PROBLEMS: Problem[] = [
  {
    id: 1,
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'easy',
    category: 'Array',
    testCases: 15,
    submissions: 125432,
    acceptanceRate: 48.5,
    isPublished: true,
    createdAt: '2025-09-15',
    solved: false
  },
  {
    id: 2,
    title: 'Add Two Numbers',
    slug: 'add-two-numbers',
    difficulty: 'medium',
    category: 'Linked List',
    testCases: 12,
    submissions: 98765,
    acceptanceRate: 38.2,
    isPublished: true,
    createdAt: '2025-09-20',
    solved: false
  },
  {
    id: 3,
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring',
    difficulty: 'medium',
    category: 'String',
    testCases: 18,
    submissions: 87543,
    acceptanceRate: 33.7,
    isPublished: true,
    createdAt: '2025-10-01',
    solved: true
  },
  {
    id: 4,
    title: 'Median of Two Sorted Arrays',
    slug: 'median-sorted-arrays',
    difficulty: 'hard',
    category: 'Array',
    testCases: 20,
    submissions: 45678,
    acceptanceRate: 35.2,
    isPublished: true,
    createdAt: '2025-10-15',
    solved: false
  },
  {
    id: 5,
    title: 'Graph Traversal Advanced',
    slug: 'graph-traversal-advanced',
    difficulty: 'hard',
    category: 'Graph',
    testCases: 10,
    submissions: 0,
    acceptanceRate: 0,
    isPublished: false,
    createdAt: '2025-11-18',
    solved: false
  },
  {
    id: 6,
    title: 'Longest Palindromic Substring',
    slug: 'longest-palindrome',
    difficulty: 'medium',
    category: 'String',
    testCases: 15,
    submissions: 76543,
    acceptanceRate: 32.1,
    isPublished: true,
    createdAt: '2025-09-25',
    solved: false
  },
  {
    id: 7,
    title: 'ZigZag Conversion',
    slug: 'zigzag-conversion',
    difficulty: 'easy',
    category: 'String',
    testCases: 12,
    submissions: 54321,
    acceptanceRate: 42.8,
    isPublished: true,
    createdAt: '2025-09-30',
    solved: true
  },
  {
    id: 8,
    title: 'Reverse Integer',
    slug: 'reverse-integer',
    difficulty: 'easy',
    category: 'Math',
    testCases: 10,
    submissions: 98234,
    acceptanceRate: 27.3,
    isPublished: true,
    createdAt: '2025-10-05',
    solved: false
  }
]

const DEFAULT_CHALLENGES: Challenge[] = [
  {
    id: 1,
    title: 'Algorithm Speed Challenge',
    slug: 'algorithm-speed-challenge',
    difficulty: 'medium',
    category: 'Algorithms',
    description: 'Solve 5 algorithmic problems in 60 minutes',
    testCases: 25,
    participants: 342,
    isPublished: true,
    createdAt: '2025-11-01',
    maxScore: 500,
    timeLimit: 60,
    startDate: '2025-11-20',
    endDate: '2025-11-27'
  },
  {
    id: 2,
    title: 'Data Structures Marathon',
    slug: 'data-structures-marathon',
    difficulty: 'hard',
    category: 'Data Structures',
    description: 'Test your knowledge of advanced data structures',
    testCases: 30,
    participants: 156,
    isPublished: true,
    createdAt: '2025-10-15',
    maxScore: 750,
    timeLimit: 90
  },
  {
    id: 3,
    title: 'Weekly Coding Sprint',
    slug: 'weekly-coding-sprint',
    difficulty: 'easy',
    category: 'Programming',
    description: 'Beginner-friendly weekly challenge',
    testCases: 15,
    participants: 892,
    isPublished: true,
    createdAt: '2025-11-10',
    maxScore: 300,
    timeLimit: 45
  }
]

// Course Management
export const courseStore = {
  getAll: (): Course[] => {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem('courses')
    if (!stored) return []
    return JSON.parse(stored)
  },

  getPublished: (): Course[] => {
    return courseStore.getAll().filter(c => c.isPublished)
  },

  getById: (id: number): Course | undefined => {
    return courseStore.getAll().find(c => c.id === id)
  },

  getBySlug: (slug: string): Course | undefined => {
    return courseStore.getAll().find(c => c.slug === slug)
  },

  add: (course: Omit<Course, 'id' | 'createdAt' | 'enrolled' | 'rating'>): Course => {
    const courses = courseStore.getAll()
    const newCourse: Course = {
      ...course,
      id: Math.max(...courses.map(c => c.id), 0) + 1,
      enrolled: 0,
      rating: 0,
      createdAt: new Date().toISOString().split('T')[0]
    }
    courses.push(newCourse)
    localStorage.setItem('courses', JSON.stringify(courses))
    window.dispatchEvent(new Event('dataChange'))
    const base = process.env.NEXT_PUBLIC_API_URL
    if (base) {
      try {
        void fetch(`${base}/api/content/courses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCourse)
        })
      } catch {}
    }
    return newCourse
  },

  update: (id: number, updates: Partial<Course>): boolean => {
    const courses = courseStore.getAll()
    const index = courses.findIndex(c => c.id === id)
    if (index === -1) return false
    courses[index] = { ...courses[index], ...updates }
    localStorage.setItem('courses', JSON.stringify(courses))
    window.dispatchEvent(new Event('dataChange'))
    return true
  },

  delete: (id: number): boolean => {
    const courses = courseStore.getAll()
    const filtered = courses.filter(c => c.id !== id)
    if (filtered.length === courses.length) return false
    localStorage.setItem('courses', JSON.stringify(filtered))
    window.dispatchEvent(new Event('dataChange'))
    return true
  },

  togglePublish: (id: number): boolean => {
    const course = courseStore.getById(id)
    if (!course) return false
    return courseStore.update(id, { isPublished: !course.isPublished })
  }
}

// Problem Management
export const problemStore = {
  getAll: (): Problem[] => {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem('problems')
    if (!stored) return []
    return JSON.parse(stored)
  },

  getPublished: (): Problem[] => {
    return problemStore.getAll().filter(p => p.isPublished)
  },

  getById: (id: number): Problem | undefined => {
    return problemStore.getAll().find(p => p.id === id)
  },

  getBySlug: (slug: string): Problem | undefined => {
    return problemStore.getAll().find(p => p.slug === slug)
  },

  add: (problem: Omit<Problem, 'id' | 'createdAt' | 'submissions' | 'acceptanceRate'>): Problem => {
    const problems = problemStore.getAll()
    const newProblem: Problem = {
      ...problem,
      id: Math.max(...problems.map(p => p.id), 0) + 1,
      submissions: 0,
      acceptanceRate: 0,
      createdAt: new Date().toISOString().split('T')[0]
    }
    problems.push(newProblem)
    localStorage.setItem('problems', JSON.stringify(problems))
    window.dispatchEvent(new Event('dataChange'))
    const base = process.env.NEXT_PUBLIC_API_URL
    if (base) {
      try {
        void fetch(`${base}/api/content/problems`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProblem)
        })
      } catch {}
    }
    return newProblem
  },

  update: (id: number, updates: Partial<Problem>): boolean => {
    const problems = problemStore.getAll()
    const index = problems.findIndex(p => p.id === id)
    if (index === -1) return false
    problems[index] = { ...problems[index], ...updates }
    localStorage.setItem('problems', JSON.stringify(problems))
    window.dispatchEvent(new Event('dataChange'))
    return true
  },

  delete: (id: number): boolean => {
    const problems = problemStore.getAll()
    const filtered = problems.filter(p => p.id !== id)
    if (filtered.length === problems.length) return false
    localStorage.setItem('problems', JSON.stringify(filtered))
    window.dispatchEvent(new Event('dataChange'))
    return true
  },

  togglePublish: (id: number): boolean => {
    const problem = problemStore.getById(id)
    if (!problem) return false
    return problemStore.update(id, { isPublished: !problem.isPublished })
  },

  markSolved: (id: number): boolean => {
    return problemStore.update(id, { solved: true })
  }
}

// Challenge Management
export const challengeStore = {
  getAll: (): Challenge[] => {
    if (typeof window === 'undefined') return DEFAULT_CHALLENGES
    const stored = localStorage.getItem('challenges')
    if (!stored) {
      localStorage.setItem('challenges', JSON.stringify(DEFAULT_CHALLENGES))
      return DEFAULT_CHALLENGES
    }
    return JSON.parse(stored)
  },

  getPublished: (): Challenge[] => {
    return challengeStore.getAll().filter(c => c.isPublished)
  },

  getById: (id: number): Challenge | undefined => {
    return challengeStore.getAll().find(c => c.id === id)
  },

  getBySlug: (slug: string): Challenge | undefined => {
    return challengeStore.getAll().find(c => c.slug === slug)
  },

  add: (challenge: Omit<Challenge, 'id' | 'createdAt' | 'participants'>): Challenge => {
    const challenges = challengeStore.getAll()
    const newChallenge: Challenge = {
      ...challenge,
      id: Math.max(...challenges.map(c => c.id), 0) + 1,
      participants: 0,
      createdAt: new Date().toISOString().split('T')[0]
    }
    challenges.push(newChallenge)
    localStorage.setItem('challenges', JSON.stringify(challenges))
    window.dispatchEvent(new Event('dataChange'))
    return newChallenge
  },

  update: (id: number, updates: Partial<Challenge>): boolean => {
    const challenges = challengeStore.getAll()
    const index = challenges.findIndex(c => c.id === id)
    if (index === -1) return false
    challenges[index] = { ...challenges[index], ...updates }
    localStorage.setItem('challenges', JSON.stringify(challenges))
    window.dispatchEvent(new Event('dataChange'))
    return true
  },

  delete: (id: number): boolean => {
    const challenges = challengeStore.getAll()
    const filtered = challenges.filter(c => c.id !== id)
    if (filtered.length === challenges.length) return false
    localStorage.setItem('challenges', JSON.stringify(filtered))
    window.dispatchEvent(new Event('dataChange'))
    return true
  },

  togglePublish: (id: number): boolean => {
    const challenge = challengeStore.getById(id)
    if (!challenge) return false
    return challengeStore.update(id, { isPublished: !challenge.isPublished })
  }
}

// User Enrollment Management
export const enrollmentStore = {
  isEnrolled: (courseId: number): boolean => {
    if (typeof window === 'undefined') return false
    const enrollments = JSON.parse(localStorage.getItem('enrollments') || '[]')
    return enrollments.includes(courseId)
  },

  enroll: (courseId: number): boolean => {
    const enrollments = JSON.parse(localStorage.getItem('enrollments') || '[]')
    if (!enrollments.includes(courseId)) {
      enrollments.push(courseId)
      localStorage.setItem('enrollments', JSON.stringify(enrollments))
      // Increment enrolled count
      const course = courseStore.getById(courseId)
      if (course) {
        courseStore.update(courseId, { enrolled: course.enrolled + 1 })
      }
      return true
    }
    return false
  },

  unenroll: (courseId: number): boolean => {
    const enrollments = JSON.parse(localStorage.getItem('enrollments') || '[]')
    const filtered = enrollments.filter((id: number) => id !== courseId)
    if (filtered.length < enrollments.length) {
      localStorage.setItem('enrollments', JSON.stringify(filtered))
      // Decrement enrolled count
      const course = courseStore.getById(courseId)
      if (course && course.enrolled > 0) {
        courseStore.update(courseId, { enrolled: course.enrolled - 1 })
      }
      return true
    }
    return false
  },

  getEnrolledCourses: (): Course[] => {
    const enrollments = JSON.parse(localStorage.getItem('enrollments') || '[]')
    return enrollments.map((id: number) => courseStore.getById(id)).filter(Boolean)
  }
}

// Report Management
export const reportStore = {
  getAll: (): Report[] => {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem('reports')
    return stored ? JSON.parse(stored) : []
  },

  add: (report: Omit<Report, 'id' | 'createdAt' | 'status'>): Report => {
    const reports = reportStore.getAll()
    const newReport: Report = {
      ...report,
      id: reports.length > 0 ? Math.max(...reports.map(r => r.id)) + 1 : 1,
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    reports.push(newReport)
    localStorage.setItem('reports', JSON.stringify(reports))
    window.dispatchEvent(new Event('dataChange'))
    return newReport
  },

  updateStatus: (id: number, status: 'pending' | 'resolved' | 'dismissed'): boolean => {
    const reports = reportStore.getAll()
    const index = reports.findIndex(r => r.id === id)
    if (index !== -1) {
      reports[index].status = status
      localStorage.setItem('reports', JSON.stringify(reports))
      window.dispatchEvent(new Event('dataChange'))
      return true
    }
    return false
  },

  delete: (id: number): boolean => {
    const reports = reportStore.getAll()
    const filtered = reports.filter(r => r.id !== id)
    if (filtered.length < reports.length) {
      localStorage.setItem('reports', JSON.stringify(filtered))
      window.dispatchEvent(new Event('dataChange'))
      return true
    }
    return false
  },

  getByType: (type: 'course' | 'problem' | 'challenge'): Report[] => {
    return reportStore.getAll().filter(r => r.type === type)
  },

  getByStatus: (status: 'pending' | 'resolved' | 'dismissed'): Report[] => {
    return reportStore.getAll().filter(r => r.status === status)
  }
}
