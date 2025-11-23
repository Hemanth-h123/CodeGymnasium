import { Router } from 'express'
import { getDb, query } from '../db'

type CourseTopic = {
  id: string
  title: string
  description: string
  content: string
  duration: number
  videoUrl?: string
  order: number
}

type Course = {
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
  courseExamples?: any[]
  associatedProblems?: number[]
}

type Problem = {
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

const courses: Course[] = []
const problems: Problem[] = []

const router = Router()

router.get('/courses', async (req, res) => {
  try {
    const db = getDb()
    if (db) {
      const rows = await query<any>('SELECT id, title, slug, description, category, difficulty, COALESCE(estimated_duration_hours,0) as duration, COALESCE(enrollment_count,0) as enrolled, COALESCE(rating_average,0) as rating, COALESCE(thumbnail_url, \'📚\') as thumbnail, is_published as "isPublished", to_char(created_at, \'YYYY-MM-DD\') as "createdAt" FROM courses ORDER BY created_at DESC')
      return res.json(rows as Course[])
    }
  } catch (e) {}
  return res.json(courses)
})

router.post('/courses', async (req, res) => {
  const body = req.body || {}
  if (!body.title || !body.slug || !body.category || !body.difficulty || !body.duration) {
    return res.status(400).json({ message: 'Missing required fields' })
  }
  const nextId = courses.length > 0 ? Math.max(...courses.map(c => c.id)) + 1 : 1
  const newCourse: Course = {
    id: nextId,
    title: body.title,
    slug: body.slug,
    description: body.description || '',
    category: body.category,
    difficulty: body.difficulty,
    duration: Number(body.duration),
    enrolled: 0,
    rating: 0,
    thumbnail: body.thumbnail || '📚',
    isPublished: !!body.isPublished,
    createdAt: new Date().toISOString().split('T')[0],
    topics: body.topics || 0,
    requirements: body.requirements,
    learningOutcomes: body.learningOutcomes,
    syllabus: body.syllabus,
    courseTopics: body.courseTopics || [],
    courseExamples: body.courseExamples || [],
    associatedProblems: body.associatedProblems || []
  }
  courses.push(newCourse)
  try {
    const db = getDb()
    if (db) {
      await query('INSERT INTO courses (title, slug, description, category, difficulty, estimated_duration_hours, thumbnail_url, is_published) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [
        newCourse.title,
        newCourse.slug,
        newCourse.description,
        newCourse.category,
        newCourse.difficulty,
        newCourse.duration,
        newCourse.thumbnail,
        newCourse.isPublished,
      ])
    }
  } catch (e) {}
  res.status(201).json(newCourse)
})

router.patch('/courses/:id/publish', (req, res) => {
  const id = Number(req.params.id)
  const course = courses.find(c => c.id === id)
  if (!course) return res.status(404).json({ message: 'Not found' })
  course.isPublished = !course.isPublished
  res.json(course)
})

router.get('/problems', async (req, res) => {
  try {
    const db = getDb()
    if (db) {
      const rows = await query<any>('SELECT id, title, slug, difficulty, category, to_char(created_at, \'YYYY-MM-DD\') as "createdAt", is_published as "isPublished", COALESCE(total_submissions,0) as submissions, COALESCE(acceptance_rate,0) as "acceptanceRate" FROM problems ORDER BY created_at DESC')
      return res.json(rows as Problem[])
    }
  } catch (e) {}
  return res.json(problems)
})

router.post('/problems', async (req, res) => {
  const body = req.body || {}
  if (!body.title || !body.slug || !body.difficulty || !body.category) {
    return res.status(400).json({ message: 'Missing required fields' })
  }
  const nextId = problems.length > 0 ? Math.max(...problems.map(p => p.id)) + 1 : 1
  const newProblem: Problem = {
    id: nextId,
    title: body.title,
    slug: body.slug,
    difficulty: body.difficulty,
    category: body.category,
    description: body.description || '',
    testCases: Number(body.testCases || 0),
    submissions: 0,
    acceptanceRate: 0,
    isPublished: !!body.isPublished,
    createdAt: new Date().toISOString().split('T')[0],
    solved: false,
    constraints: body.constraints,
    examples: body.examples,
    hints: body.hints,
    starterCode: body.starterCode,
    solution: body.solution,
    supportedLanguages: body.supportedLanguages,
    timeComplexity: body.timeComplexity,
    spaceComplexity: body.spaceComplexity
  }
  problems.push(newProblem)
  try {
    const db = getDb()
    if (db) {
      await query('INSERT INTO problems (title, slug, difficulty, category, is_published) VALUES ($1,$2,$3,$4,$5)', [
        newProblem.title,
        newProblem.slug,
        newProblem.difficulty,
        newProblem.category,
        newProblem.isPublished,
      ])
    }
  } catch (e) {}
  res.status(201).json(newProblem)
})

export default router
