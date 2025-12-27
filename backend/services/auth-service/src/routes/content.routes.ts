import { Router } from 'express'
import { getDb, query } from '../db'
import { Script, createContext } from 'vm'
import { spawn, spawnSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

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
const topicProgress = new Map<string, Set<string>>()
const topicExtras = new Map<string, { examples: any[]; problemIds: number[] }>()

// Report interface to match frontend
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
      const courseRows = await query<any>('SELECT id FROM courses WHERE slug=$1', [newCourse.slug])
      const courseId = courseRows[0]?.id
      if (courseId && Array.isArray(newCourse.courseTopics)) {
        for (const t of newCourse.courseTopics) {
          await query('INSERT INTO topics (course_id, title, slug, description, content, video_url, order_index, estimated_duration_minutes, is_published) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [
            courseId,
            t.title,
            String(t.id),
            t.description || '',
            t.content || '',
            t.videoUrl || null,
            t.order,
            t.duration || null,
            true,
          ])
        }
      }
      
      // Increment courses and topics counts
      try {
        await query('UPDATE homepage_stats SET count = count + 1 WHERE stat_type = $1', ['courses']);
        if (Array.isArray(newCourse.courseTopics)) {
          await query('UPDATE homepage_stats SET count = count + $1 WHERE stat_type = $2', [newCourse.courseTopics.length, 'topics']);
        }
      } catch (statsError) {
        console.error('Error updating homepage stats:', statsError);
      }
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

router.patch('/courses/:id', async (req, res) => {
  const id = Number(req.params.id)
  const updates = req.body || {}
  const course = courses.find(c => c.id === id)
  if (course) {
    Object.assign(course, {
      title: updates.title ?? course.title,
      description: updates.description ?? course.description,
      category: updates.category ?? course.category,
      difficulty: updates.difficulty ?? course.difficulty,
      duration: updates.duration ?? course.duration,
      thumbnail: updates.thumbnail ?? course.thumbnail,
      isPublished: updates.isPublished ?? course.isPublished,
    })
  }
  try {
    const db = getDb()
    if (db) {
      await query('UPDATE courses SET title=$1, description=$2, category=$3, difficulty=$4, estimated_duration_hours=$5, thumbnail_url=$6, is_published=$7, updated_at=NOW() WHERE id=$8', [
        updates.title ?? course?.title,
        updates.description ?? course?.description,
        updates.category ?? course?.category,
        updates.difficulty ?? course?.difficulty,
        updates.duration ?? course?.duration,
        updates.thumbnail ?? course?.thumbnail,
        updates.isPublished ?? course?.isPublished,
        id,
      ])
    }
  } catch (e) {}
  if (!course) return res.status(404).json({ message: 'Not found' })
  return res.json(course)
})

router.delete('/courses/:id', async (req, res) => {
  const id = Number(req.params.id)
  const index = courses.findIndex(c => c.id === id)
  if (index !== -1) courses.splice(index, 1)
  try {
    const db = getDb()
    if (db) {
      await query('DELETE FROM courses WHERE id=$1', [id])
    }
  } catch (e) {}
  return res.status(204).send()
})

// Slug-based course operations (persistent)
router.patch('/courses/by-slug/:slug', async (req, res) => {
  const slug = String(req.params.slug)
  const updates = req.body || {}
  try {
    const db = getDb()
    if (db) {
      await query('UPDATE courses SET title=$1, description=$2, category=$3, difficulty=$4, estimated_duration_hours=$5, thumbnail_url=$6, is_published=$7, updated_at=NOW() WHERE slug=$8', [
        updates.title,
        updates.description,
        updates.category,
        updates.difficulty,
        updates.duration,
        updates.thumbnail,
        updates.isPublished,
        slug,
      ])
      const rows = await query<any>('SELECT id, title, slug, description, category, difficulty, COALESCE(estimated_duration_hours,0) as duration, COALESCE(thumbnail_url,\'📚\') as thumbnail, is_published as "isPublished" FROM courses WHERE slug=$1', [slug])
      if (!rows.length) return res.status(404).json({ message: 'Not found' })
      return res.json(rows[0])
    }
  } catch (e) {}
  const course = courses.find(c => c.slug === slug)
  if (!course) return res.status(404).json({ message: 'Not found' })
  Object.assign(course, {
    title: updates.title ?? course.title,
    description: updates.description ?? course.description,
    category: updates.category ?? course.category,
    difficulty: updates.difficulty ?? course.difficulty,
    duration: updates.duration ?? course.duration,
    thumbnail: updates.thumbnail ?? course.thumbnail,
    isPublished: updates.isPublished ?? course.isPublished,
  })
  return res.json(course)
})

router.delete('/courses/by-slug/:slug', async (req, res) => {
  const slug = String(req.params.slug)
  try {
    const db = getDb()
    if (db) {
      await query('DELETE FROM courses WHERE slug=$1', [slug])
      return res.status(204).send()
    }
  } catch (e) {}
  const index = courses.findIndex(c => c.slug === slug)
  if (index !== -1) courses.splice(index, 1)
  return res.status(204).send()
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
      
      // Increment problems count
      try {
        await query('UPDATE homepage_stats SET count = count + 1 WHERE stat_type = $1', ['problems']);
      } catch (statsError) {
        console.error('Error updating homepage stats:', statsError);
      }
    }
  } catch (e) {}
  res.status(201).json(newProblem)
})

router.patch('/problems/:id/publish', (req, res) => {
  const id = Number(req.params.id)
  const problem = problems.find(p => p.id === id)
  if (!problem) return res.status(404).json({ message: 'Not found' })
  problem.isPublished = !problem.isPublished
  return res.json(problem)
})

router.patch('/problems/:id', async (req, res) => {
  const id = Number(req.params.id)
  const updates = req.body || {}
  const problem = problems.find(p => p.id === id)
  if (problem) {
    Object.assign(problem, {
      title: updates.title ?? problem.title,
      description: updates.description ?? problem.description,
      category: updates.category ?? problem.category,
      difficulty: updates.difficulty ?? problem.difficulty,
      isPublished: updates.isPublished ?? problem.isPublished,
    })
  }
  try {
    const db = getDb()
    if (db) {
      await query('UPDATE problems SET title=$1, description=$2, category=$3, difficulty=$4, is_published=$5, updated_at=NOW() WHERE id=$6', [
        updates.title ?? problem?.title,
        updates.description ?? problem?.description,
        updates.category ?? problem?.category,
        updates.difficulty ?? problem?.difficulty,
        updates.isPublished ?? problem?.isPublished,
        id,
      ])
    }
  } catch (e) {}
  if (!problem) return res.status(404).json({ message: 'Not found' })
  return res.json(problem)
})

router.delete('/problems/:id', async (req, res) => {
  const id = Number(req.params.id)
  const index = problems.findIndex(p => p.id === id)
  if (index !== -1) problems.splice(index, 1)
  try {
    const db = getDb()
    if (db) {
      await query('DELETE FROM problems WHERE id=$1', [id])
    }
  } catch (e) {}
  return res.status(204).send()
})

// Slug-based problem operations (persistent)
router.patch('/problems/by-slug/:slug', async (req, res) => {
  const slug = String(req.params.slug)
  const updates = req.body || {}
  try {
    const db = getDb()
    if (db) {
      await query('UPDATE problems SET title=$1, description=$2, category=$3, difficulty=$4, is_published=$5, updated_at=NOW() WHERE slug=$6', [
        updates.title,
        updates.description,
        updates.category,
        updates.difficulty,
        updates.isPublished,
        slug,
      ])
      const rows = await query<any>('SELECT id, title, slug, difficulty, category, to_char(created_at, \'YYYY-MM-DD\') as "createdAt", is_published as "isPublished" FROM problems WHERE slug=$1', [slug])
      if (!rows.length) return res.status(404).json({ message: 'Not found' })
      return res.json(rows[0])
    }
  } catch (e) {}
  const problem = problems.find(p => p.slug === slug)
  if (!problem) return res.status(404).json({ message: 'Not found' })
  Object.assign(problem, {
    title: updates.title ?? problem.title,
    description: updates.description ?? problem.description,
    category: updates.category ?? problem.category,
    difficulty: updates.difficulty ?? problem.difficulty,
    isPublished: updates.isPublished ?? problem.isPublished,
  })
  return res.json(problem)
})

router.delete('/problems/by-slug/:slug', async (req, res) => {
  const slug = String(req.params.slug)
  try {
    const db = getDb()
    if (db) {
      await query('DELETE FROM problems WHERE slug=$1', [slug])
      return res.status(204).send()
    }
  } catch (e) {}
  const index = problems.findIndex(p => p.slug === slug)
  if (index !== -1) problems.splice(index, 1)
  return res.status(204).send()
})

// Discussions API

interface Discussion {
  id: string
  userId: string
  title: string
  content: string
  category: string
  tags: string[]
  views: number
  replies: number
  likes: number
  createdAt: string
  updatedAt: string
}

interface DiscussionComment {
  id: string
  discussionId: string
  userId: string
  content: string
  parentCommentId?: string
  likes: number
  createdAt: string
  updatedAt: string
}

router.get('/discussions', async (req, res) => {
  try {
    const db = getDb()
    if (db) {
      const rows = await query<any>('SELECT d.id, d.title, d.content, d.category, d.tags, d.views, d.replies, d.likes, d.created_at as "createdAt", d.updated_at as "updatedAt", u.username as author FROM discussions d JOIN users u ON d.user_id = u.id ORDER BY d.created_at DESC')
      return res.json(rows)
    }
  } catch (e) {}
  return res.json([])
})

router.post('/discussions', async (req, res) => {
  const body = req.body || {}
  if (!body.title || !body.content || !body.category || !body.authorId) {
    return res.status(400).json({ message: 'Missing required fields: title, content, category, authorId' })
  }
  
  try {
    const db = getDb()
    if (db) {
      const result = await query<any>('INSERT INTO discussions (user_id, title, content, category, tags) VALUES ($1, $2, $3, $4, $5) RETURNING id, title, content, category, tags, views, replies, likes, created_at as "createdAt", updated_at as "updatedAt"', [
        body.authorId,
        body.title,
        body.content,
        body.category,
        body.tags || []
      ])
      
      // Update category count
      await query('INSERT INTO discussion_category_counts (category, count) VALUES ($1, 1) ON CONFLICT (category) DO UPDATE SET count = discussion_category_counts.count + 1', [body.category])
      
      return res.status(201).json(result[0])
    }
  } catch (e) {}
  
  return res.status(500).json({ message: 'Failed to create discussion' })
})

router.get('/discussions/:id', async (req, res) => {
  const id = String(req.params.id)
  try {
    const db = getDb()
    if (db) {
      const rows = await query<any>('SELECT d.id, d.title, d.content, d.category, d.tags, d.views, d.replies, d.likes, d.created_at as "createdAt", d.updated_at as "updatedAt", u.username as author FROM discussions d JOIN users u ON d.user_id = u.id WHERE d.id = $1', [id])
      if (rows.length === 0) return res.status(404).json({ message: 'Discussion not found' })
      
      // Increment views
      await query('UPDATE discussions SET views = views + 1 WHERE id = $1', [id])
      rows[0].views += 1
      
      return res.json(rows[0])
    }
  } catch (e) {}
  
  return res.status(404).json({ message: 'Discussion not found' })
})

router.get('/discussions/:id/comments', async (req, res) => {
  const id = String(req.params.id)
  try {
    const db = getDb()
    if (db) {
      const rows = await query<any>('SELECT dc.id, dc.content, dc.likes, dc.created_at as "createdAt", u.username as author FROM discussion_comments dc JOIN users u ON dc.user_id = u.id WHERE dc.discussion_id = $1 ORDER BY dc.created_at ASC', [id])
      return res.json(rows)
    }
  } catch (e) {}
  
  return res.json([])
})

router.post('/discussions/:id/comments', async (req, res) => {
  const id = String(req.params.id)
  const body = req.body || {}
  if (!body.content || !body.userId) {
    return res.status(400).json({ message: 'Missing required fields: content, userId' })
  }
  
  try {
    const db = getDb()
    if (db) {
      const result = await query<any>('INSERT INTO discussion_comments (discussion_id, user_id, content) VALUES ($1, $2, $3) RETURNING id, content, likes, created_at as "createdAt"', [
        id,
        body.userId,
        body.content
      ])
      
      // Update discussion reply count
      await query('UPDATE discussions SET replies = replies + 1 WHERE id = $1', [id])
      
      return res.status(201).json(result[0])
    }
  } catch (e) {}
  
  return res.status(500).json({ message: 'Failed to add comment' })
})

// Discussion categories API
router.get('/discussion-categories', async (req, res) => {
  try {
    const db = getDb()
    if (db) {
      const rows = await query<any>('SELECT category, count FROM discussion_category_counts ORDER BY count DESC')
      return res.json(rows)
    }
  } catch (e) {}
  
  return res.json([])
})

// Homepage statistics API
router.get('/homepage-stats', async (req, res) => {
  try {
    const db = getDb()
    if (db) {
      const rows = await query<any>('SELECT stat_type, count FROM homepage_stats')
      const stats: { [key: string]: number } = {}
      rows.forEach(row => {
        stats[row.stat_type] = row.count
      })
      return res.json(stats)
    }
  } catch (e) {}
  
  return res.json({
    active_learners: 0,
    courses: 0,
    topics: 0,
    problems: 0
  })
})

// Update homepage stats when users register
router.post('/homepage-stats/users', async (req, res) => {
  try {
    const db = getDb()
    if (db) {
      await query('UPDATE homepage_stats SET count = count + 1 WHERE stat_type = $1', ['active_learners'])
      
      // Get updated count
      const rows = await query<any>('SELECT count FROM homepage_stats WHERE stat_type = $1', ['active_learners'])
      return res.json({ count: rows[0]?.count || 0 })
    }
  } catch (e) {}
  
  return res.status(500).json({ message: 'Failed to update user count' })
})

// Update homepage stats when content is created
router.post('/homepage-stats/:type', async (req, res) => {
  const type = req.params.type
  const validTypes = ['courses', 'topics', 'problems']
  if (!validTypes.includes(type)) {
    return res.status(400).json({ message: 'Invalid type. Valid values: courses, topics, problems' })
  }
  
  try {
    const db = getDb()
    if (db) {
      await query('UPDATE homepage_stats SET count = count + 1 WHERE stat_type = $1', [type])
      
      // Get updated count
      const rows = await query<any>('SELECT count FROM homepage_stats WHERE stat_type = $1', [type])
      return res.json({ count: rows[0]?.count || 0 })
    }
  } catch (e) {}
  
  return res.status(500).json({ message: 'Failed to update content count' })
})

// Admin dashboard metrics API
router.get('/admin/metrics', async (req, res) => {
  try {
    const db = getDb()
    if (db) {
      // Calculate daily active users (users who have logged in today)
      const dailyActiveUsers = await query<any>(`SELECT COUNT(DISTINCT id) as count FROM users WHERE DATE(last_login_at) = CURRENT_DATE OR DATE(created_at) = CURRENT_DATE`)
      
      // Calculate average session time (placeholder - in a real implementation, this would track actual session times)
      const avgSessionTime = await query<any>(`SELECT COALESCE(AVG(0), 0) as avg_time FROM users`) // Placeholder calculation
      
      // Calculate problem solve rate (percentage of problems solved by users)
      const problemSolveRate = await query<any>(`SELECT 
        CASE 
          WHEN COUNT(*) > 0 THEN 
            ROUND(COALESCE(SUM(CASE WHEN status = 'solved' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 0), 2)
          ELSE 0 
        END as solve_rate
        FROM user_problem_submissions`)
      
      // Return metrics with defaults if queries fail
      return res.json({
        dailyActiveUsers: dailyActiveUsers[0]?.count || 0,
        avgSessionTime: Math.floor((avgSessionTime[0]?.avg_time || 0) / 60) + ' min', // Convert to minutes
        problemSolveRate: problemSolveRate[0]?.solve_rate || 0 + '%'
      })
    }
  } catch (e) {
    console.error('Error fetching admin metrics:', e)
  }
  
  // Return default values if anything fails
  return res.json({
    dailyActiveUsers: 0,
    avgSessionTime: '0 min',
    problemSolveRate: '0%'
  })
})

// Update metrics when users interact with the platform
router.post('/admin/metrics/update', async (req, res) => {
  const { metricType, increment = 1 } = req.body
  
  if (!metricType) {
    return res.status(400).json({ message: 'Missing metricType' })
  }
  
  try {
    const db = getDb()
    if (db) {
      // For now, we're just logging the metric update request
      // In a full implementation, we would update appropriate tables
      console.log(`Metric update requested: ${metricType} with increment ${increment}`)
      
      return res.json({ success: true, message: 'Metrics update request received' })
    }
  } catch (e) {
    console.error('Error updating metrics:', e)
  }
  
  return res.status(500).json({ message: 'Failed to update metrics' })
})

// Challenges API
interface Challenge {
  id: string
  title: string
  slug: string
  description?: string
  type: string
  difficulty: string
  startTime: string
  endTime: string
  isActive: boolean
  isRanked: boolean
  maxParticipants: number
  prizeDescription?: string
  totalParticipants: number
  createdAt: string
  createdBy?: string
}

router.get('/challenges', async (req, res) => {
  try {
    const db = getDb()
    if (db) {
      const rows = await query<any>(`SELECT id, title, slug, description, type, difficulty, start_time as "startTime", end_time as "endTime", is_active as "isActive", is_ranked as "isRanked", max_participants as "maxParticipants", prize_description as "prizeDescription", total_participants as "totalParticipants", to_char(created_at, 'YYYY-MM-DD') as "createdAt" FROM challenges ORDER BY created_at DESC`)
      return res.json(rows as Challenge[])
    }
  } catch (e) {
    console.error('Error fetching challenges:', e)
  }
  return res.json([])
})

router.post('/challenges', async (req, res) => {
  const body = req.body || {}
  if (!body.title || !body.slug || !body.type || !body.difficulty || !body.startTime || !body.endTime) {
    return res.status(400).json({ message: 'Missing required fields: title, slug, type, difficulty, startTime, endTime' })
  }
  
  try {
    const db = getDb()
    if (db) {
      const result = await query<any>(`INSERT INTO challenges (title, slug, description, type, difficulty, start_time, end_time, is_ranked, max_participants, prize_description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, title, slug, description, type, difficulty, start_time as "startTime", end_time as "endTime", is_active as "isActive", is_ranked as "isRanked", max_participants as "maxParticipants", prize_description as "prizeDescription", total_participants as "totalParticipants", created_at`, [
        body.title,
        body.slug,
        body.description || null,
        body.type,
        body.difficulty,
        body.startTime,
        body.endTime,
        body.isRanked !== undefined ? body.isRanked : true,
        body.maxParticipants || null,
        body.prizeDescription || null
      ])
      
      // Increment challenges count in homepage stats
      try {
        await query('UPDATE homepage_stats SET count = count + 1 WHERE stat_type = $1', ['challenges']);
      } catch (statsError) {
        console.error('Error updating homepage stats:', statsError);
      }
      
      return res.status(201).json(result[0])
    }
  } catch (e) {
    console.error('Error creating challenge:', e)
  }
  
  return res.status(500).json({ message: 'Failed to create challenge' })
})

router.patch('/challenges/:id/publish', async (req, res) => {
  const id = req.params.id
  try {
    const db = getDb()
    if (db) {
      // Get current challenge status
      const currentChallenge = await query<any>('SELECT is_active FROM challenges WHERE id = $1', [id])
      if (!currentChallenge.length) {
        return res.status(404).json({ message: 'Challenge not found' })
      }
      
      // Toggle the active status
      const newStatus = !currentChallenge[0].is_active
      await query('UPDATE challenges SET is_active = $1 WHERE id = $2', [newStatus, id])
      
      // Return updated challenge
      const updatedChallenge = await query<any>(`SELECT id, title, slug, description, type, difficulty, start_time as "startTime", end_time as "endTime", is_active as "isActive", is_ranked as "isRanked", max_participants as "maxParticipants", prize_description as "prizeDescription", total_participants as "totalParticipants", to_char(created_at, 'YYYY-MM-DD') as "createdAt" FROM challenges WHERE id = $1`, [id])
      
      return res.json(updatedChallenge[0])
    }
  } catch (e) {
    console.error('Error toggling challenge publish status:', e)
  }
  
  return res.status(500).json({ message: 'Failed to toggle challenge publish status' })
})

// Update challenges count if not exists in homepage_stats
router.get('/ensure-challenges-count', async (req, res) => {
  try {
    const db = getDb()
    if (db) {
      // Check if challenges count exists in homepage_stats
      const checkResult = await query<any>('SELECT COUNT(*) as count FROM homepage_stats WHERE stat_type = $1', ['challenges'])
      if (checkResult[0].count === 0) {
        // Insert challenges count if it doesn't exist
        await query('INSERT INTO homepage_stats (stat_type, count) VALUES ($1, $2)', ['challenges', 0])
        return res.json({ message: 'Challenges count initialized' })
      }
      return res.json({ message: 'Challenges count already exists' })
    }
  } catch (e) {
    console.error('Error ensuring challenges count:', e)
  }
  return res.status(500).json({ message: 'Failed to ensure challenges count' })
})

export default router
// Topic progress
router.post('/topics/:id/complete', async (req, res) => {
  const email = (req.body && req.body.email) || req.header('X-User-Email') || ''
  const topicSlug = String(req.params.id)
  if (!email) return res.status(400).json({ message: 'Missing email' })
  try {
    const db = getDb()
    if (db) {
      const userRows = await query<any>('SELECT id FROM users WHERE email=$1', [email])
      if (!userRows.length) return res.status(404).json({ message: 'User not found' })
      const userId = userRows[0].id
      const topicRows = await query<any>('SELECT id FROM topics WHERE slug=$1', [topicSlug])
      if (!topicRows.length) return res.status(404).json({ message: 'Topic not found' })
      const topicId = topicRows[0].id
      await query('INSERT INTO user_topic_progress (user_id, topic_id, is_completed, completed_at) VALUES ($1,$2,true,NOW()) ON CONFLICT (user_id, topic_id) DO UPDATE SET is_completed=EXCLUDED.is_completed, completed_at=EXCLUDED.completed_at, updated_at=NOW()', [userId, topicId])
      const completedRows = await query<any>('SELECT t.slug FROM user_topic_progress utp JOIN topics t ON utp.topic_id=t.id WHERE utp.user_id=$1 AND utp.is_completed=true', [userId])
      return res.status(200).json({ completed: completedRows.map(r => String(r.slug)) })
    }
  } catch (e) {}
  const set = topicProgress.get(email) || new Set<string>()
  set.add(topicSlug)
  topicProgress.set(email, set)
  return res.status(200).json({ completed: Array.from(set) })
})

// Code execution (basic, JS sandbox + Python child process)
router.post('/code/execute', async (req, res) => {
  const { language = 'javascript', code = '', input = '' } = req.body || {}
  const started = Date.now()
  try {
    if (language === 'javascript') {
      try {
        const logs: string[] = []
        const sandbox = {
          console: {
            log: (...args: any[]) => {
              logs.push(args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '))
            },
          },
          input,
        }
        const context = createContext(sandbox)
        const script = new Script(code)
        script.runInContext(context, { timeout: 1000 })
        const duration = Date.now() - started
        return res.json({ output: logs.join('\n'), duration })
      } catch (e: any) {
        const duration = Date.now() - started
        return res.status(200).json({ output: '', error: e.message || 'JavaScript syntax error', duration })
      }
    }
    if (language === 'typescript') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const ts = require('typescript')
        const transpiled = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019, removeComments: true } })
        const logs: string[] = []
        const sandbox = {
          console: {
            log: (...args: any[]) => {
              logs.push(args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '))
            },
          },
          input,
          module: { exports: {} },
          exports: {},
          require: undefined,
        }
        const context = createContext(sandbox)
        const script = new Script(transpiled.outputText)
        script.runInContext(context, { timeout: 1000 })
        const duration = Date.now() - started
        return res.status(200).json({ output: logs.join('\n'), duration })
      } catch (e: any) {
        const duration = Date.now() - started
        if (e.message && e.message.includes('TypeScript')) {
          return res.status(200).json({ output: 'TypeScript toolchain not available', duration })
        } else {
          return res.status(200).json({ output: '', error: e.message || 'TypeScript syntax error', duration })
        }
      }
    }
    if (language === 'python') {
      const py = spawn('python3', ['-u', '-'], { stdio: ['pipe', 'pipe', 'pipe'] })
      let out = ''
      let err = ''
      py.stdout.on('data', (d) => (out += d.toString()))
      py.stderr.on('data', (d) => (err += d.toString()))
      py.on('error', (error) => {
        const duration = Date.now() - started
        return res.status(200).json({ output: '', error: error.message || 'Python execution error', duration })
      })
      py.stdin.write(code)
      if (input) py.stdin.write(`

# input
${input}
`)
      py.stdin.end()
      py.on('close', (code) => {
        const duration = Date.now() - started
        // If the process exited with an error code and we don't have output, treat stderr as the main error
        if (code !== 0 && !out.trim() && err.trim()) {
          return res.status(200).json({ output: '', error: err.trim(), duration })
        }
        const combined = (out + (err ? `\n${err}` : '')).trim()
        return res.status(200).json({ output: combined, error: code !== 0 ? err : undefined, duration })
      })
      return
    }
    if (language === 'java') {
      const javacOk = !spawnSync('javac', ['-version']).error
      const javaOk = !spawnSync('java', ['-version']).error
      if (!javacOk || !javaOk) {
        const duration = Date.now() - started
        return res.status(200).json({ output: 'Java toolchain not available', duration })
      }
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-java-'))
      let className = 'Main'
      const m = code.match(/class\s+(\w+)/)
      if (m) className = m[1]
      const src = path.join(tmp, `${className}.java`)
      fs.writeFileSync(src, code)
      const javac = spawn('javac', [src], { cwd: tmp })
      let cErr = ''
      javac.stderr.on('data', (d) => (cErr += d.toString()))
      javac.on('close', (codeExit) => {
        if (codeExit !== 0) {
          const duration = Date.now() - started
          const combined = cErr.trim()
          fs.rm(tmp, { recursive: true, force: true }, () => {})
          return res.status(200).json({ output: '', error: 'Compilation Error:\n' + combined, duration })
        }
        const j = spawn('java', ['-cp', tmp, className], { cwd: tmp, stdio: ['pipe', 'pipe', 'pipe'] })
        let out = ''
        let err = ''
        j.stdout.on('data', (d) => (out += d.toString()))
        j.stderr.on('data', (d) => (err += d.toString()))
        if (input) j.stdin.write(input)
        j.stdin.end()
        j.on('close', (runtimeCode) => {
          const duration = Date.now() - started
          const combined = (out + (err ? `\n${err}` : '')).trim()
          fs.rm(tmp, { recursive: true, force: true }, () => {})
          // If there's an error during runtime, show it as an error
          if (runtimeCode !== 0 && err.trim()) {
            return res.status(200).json({ output: '', error: 'Runtime Error:\n' + err.trim(), duration })
          }
          return res.status(200).json({ output: combined, error: runtimeCode !== 0 ? err : undefined, duration })
        })
      })
      return
    }
    if (language === 'cpp') {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-cpp-'))
      const src = path.join(tmp, 'main.cpp')
      const bin = path.join(tmp, process.platform === 'win32' ? 'a.exe' : 'a.out')
      fs.writeFileSync(src, code)
      const gppExists = !spawnSync('g++', ['--version']).error
      if (!gppExists) {
        const duration = Date.now() - started
        fs.rm(tmp, { recursive: true, force: true }, () => {})
        return res.status(200).json({ output: 'C++ toolchain not available', duration })
      }
      const gpp = spawn('g++', [src, '-O2', '-std=c++17', '-o', bin], { cwd: tmp })
      let cErr = ''
      gpp.stderr.on('data', (d) => (cErr += d.toString()))
      gpp.on('close', (codeExit) => {
        if (codeExit !== 0) {
          const duration = Date.now() - started
          const combined = cErr.trim()
          fs.rm(tmp, { recursive: true, force: true }, () => {})
          return res.status(200).json({ output: '', error: 'C++ Compilation Error:\n' + combined, duration })
        }
        const run = spawn(bin, [], { cwd: tmp, stdio: ['pipe', 'pipe', 'pipe'] })
        let out = ''
        let err = ''
        run.stdout.on('data', (d) => (out += d.toString()))
        run.stderr.on('data', (d) => (err += d.toString()))
        if (input) run.stdin.write(input)
        run.stdin.end()
        run.on('close', (runtimeCode) => {
          const duration = Date.now() - started
          const combined = (out + (err ? `\n${err}` : '')).trim()
          fs.rm(tmp, { recursive: true, force: true }, () => {})
          // If there's an error during runtime, show it as an error
          if (runtimeCode !== 0 && err.trim()) {
            return res.status(200).json({ output: '', error: 'C++ Runtime Error:\n' + err.trim(), duration })
          }
          return res.status(200).json({ output: combined, error: runtimeCode !== 0 ? err : undefined, duration })
        })
      })
      return
    }
    if (language === 'c') {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-c-'))
      const src = path.join(tmp, 'main.c')
      const bin = path.join(tmp, process.platform === 'win32' ? 'a.exe' : 'a.out')
      // Properly handle escaped newlines in the code
      const formattedCode = code.replace(/\\n/g, '\n');
      fs.writeFileSync(src, formattedCode)
      const gccExists = !spawnSync('gcc', ['--version']).error
      if (!gccExists) {
        const duration = Date.now() - started
        fs.rm(tmp, { recursive: true, force: true }, () => {})
        return res.status(200).json({ output: 'C toolchain not available. Please install GCC.', duration })
      }
      const gcc = spawn('gcc', [src, '-O2', '-o', bin], { cwd: tmp })
      let cErr = ''
      let isResponseSent = false
      
      // Set a timeout for compilation
      const compileTimeout = setTimeout(() => {
        if (!isResponseSent) {
          isResponseSent = true
          gcc.kill()
          const duration = Date.now() - started
          fs.rm(tmp, { recursive: true, force: true }, () => {})
          return res.status(200).json({ output: '', error: 'Compilation timed out', duration })
        }
      }, 10000)
      
      gcc.stderr.on('data', (d) => (cErr += d.toString()))
      gcc.on('close', (codeExit) => {
        clearTimeout(compileTimeout)
        if (isResponseSent) return;
        
        if (codeExit !== 0) {
          if (!isResponseSent) {
            isResponseSent = true
            const duration = Date.now() - started
            const combined = cErr.trim()
            fs.rm(tmp, { recursive: true, force: true }, () => {})
            return res.status(200).json({ output: '', error: 'C Compilation Error:\n' + combined, duration })
          }
          return
        }
        
        const run = spawn(bin, [], { cwd: tmp, stdio: ['pipe', 'pipe', 'pipe'] })
        let out = ''
        let err = ''
        
        // Set a timeout for execution
        const execTimeout = setTimeout(() => {
          if (!isResponseSent) {
            isResponseSent = true
            run.kill()
            const duration = Date.now() - started
            const combined = (out + (err ? `\n${err}` : '')).trim()
            fs.rm(tmp, { recursive: true, force: true }, () => {})
            return res.status(200).json({ output: combined, error: 'Execution timed out', duration })
          }
        }, 5000)
        
        run.stdout.on('data', (d) => (out += d.toString()))
        run.stderr.on('data', (d) => (err += d.toString()))
        if (input) run.stdin.write(input)
        run.stdin.end()
        
        run.on('close', (runtimeCode) => {
          clearTimeout(execTimeout)
          if (!isResponseSent) {
            isResponseSent = true
            const duration = Date.now() - started
            const combined = (out + (err ? `\n${err}` : '')).trim()
            fs.rm(tmp, { recursive: true, force: true }, () => {})
            // If there's an error during runtime, show it as an error
            if (runtimeCode !== 0 && err.trim()) {
              return res.status(200).json({ output: '', error: 'C Runtime Error:\n' + err.trim(), duration })
            }
            return res.status(200).json({ output: combined, error: err || null, duration })
          }
        })
      })
      return
    }
    if (language === 'go') {
      const goOk = !spawnSync('go', ['version']).error
      if (!goOk) {
        const duration = Date.now() - started
        return res.status(200).json({ output: 'Go toolchain not available', duration })
      }
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-go-'))
      const src = path.join(tmp, 'main.go')
      fs.writeFileSync(src, code)
      const run = spawn('go', ['run', src], { cwd: tmp, stdio: ['pipe', 'pipe', 'pipe'] })
      let out = ''
      let err = ''
      run.stdout.on('data', (d) => (out += d.toString()))
      run.stderr.on('data', (d) => (err += d.toString()))
      if (input) run.stdin.write(input)
      run.stdin.end()
      run.on('close', (code) => {
        const duration = Date.now() - started
        const combined = (out + (err ? `\n${err}` : '')).trim()
        fs.rm(tmp, { recursive: true, force: true }, () => {})
        // If there's an error during runtime, show it as an error
        if (code !== 0 && err.trim()) {
          return res.status(200).json({ output: '', error: 'Go Runtime Error:\n' + err.trim(), duration })
        }
        return res.status(200).json({ output: combined, error: code !== 0 ? err : undefined, duration })
      })
      return
    }
    if (language === 'rust') {
      const rustOk = !spawnSync('rustc', ['--version']).error
      if (!rustOk) {
        const duration = Date.now() - started
        return res.status(200).json({ output: 'Rust toolchain not available', duration })
      }
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-rs-'))
      const src = path.join(tmp, 'main.rs')
      const bin = path.join(tmp, process.platform === 'win32' ? 'main.exe' : 'main')
      fs.writeFileSync(src, code)
      const rustc = spawn('rustc', [src, '-O', '-o', bin], { cwd: tmp })
      let cErr = ''
      rustc.stderr.on('data', (d) => (cErr += d.toString()))
      rustc.on('close', (codeExit) => {
        if (codeExit !== 0) {
          const duration = Date.now() - started
          const combined = cErr.trim()
          fs.rm(tmp, { recursive: true, force: true }, () => {})
          return res.status(200).json({ output: '', error: 'Rust Compilation Error:\n' + combined, duration })
        }
        const run = spawn(bin, [], { cwd: tmp, stdio: ['pipe', 'pipe', 'pipe'] })
        let out = ''
        let err = ''
        run.stdout.on('data', (d) => (out += d.toString()))
        run.stderr.on('data', (d) => (err += d.toString()))
        if (input) run.stdin.write(input)
        run.stdin.end()
        run.on('close', (runtimeCode) => {
          const duration = Date.now() - started
          const combined = (out + (err ? `\n${err}` : '')).trim()
          fs.rm(tmp, { recursive: true, force: true }, () => {})
          // If there's an error during runtime, show it as an error
          if (runtimeCode !== 0 && err.trim()) {
            return res.status(200).json({ output: '', error: 'Rust Runtime Error:\n' + err.trim(), duration })
          }
          return res.status(200).json({ output: combined, error: runtimeCode !== 0 ? err : undefined, duration })
        })
      })
      return
    }
    if (language === 'csharp' || language === 'c#') {
      const dotnetOk = !spawnSync('dotnet', ['--version']).error
      if (!dotnetOk) {
        const duration = Date.now() - started
        return res.status(200).json({ output: 'C# toolchain not available', duration })
      }
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-cs-'))
      const proj = path.join(tmp, 'cg.csproj')
      const prog = path.join(tmp, 'Program.cs')
      const csproj = `<?xml version="1.0" encoding="utf-8"?>
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
</Project>`
      fs.writeFileSync(proj, csproj)
      fs.writeFileSync(prog, code)
      const run = spawn('dotnet', ['run'], { cwd: tmp, stdio: ['pipe', 'pipe', 'pipe'] })
      let out = ''
      let err = ''
      run.stdout.on('data', (d) => (out += d.toString()))
      run.stderr.on('data', (d) => (err += d.toString()))
      if (input) run.stdin.write(input)
      run.stdin.end()
      run.on('close', (code) => {
        const duration = Date.now() - started
        const combined = (out + (err ? `\n${err}` : '')).trim()
        fs.rm(tmp, { recursive: true, force: true }, () => {})
        // If there's an error during runtime, show it as an error
        if (code !== 0 && err.trim()) {
          return res.status(200).json({ output: '', error: 'C# Runtime Error:\n' + err.trim(), duration })
        }
        return res.status(200).json({ output: combined, error: code !== 0 ? err : undefined, duration })
      })
      return
    }
    if (language === 'sql') {
      // Try to use sqlite3 first, fallback to node-sqlite3 if available
      const sqliteOk = !spawnSync('sqlite3', ['--version']).error
      if (!sqliteOk) {
        const duration = Date.now() - started
        return res.status(200).json({ output: 'SQL toolchain not available. Please install sqlite3.', duration })
      }
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-sql-'))
      const db = path.join(tmp, 'temp.db')
      const script = path.join(tmp, 'script.sql')
      // Properly handle escaped newlines in the SQL code
      const formattedCode = code.replace(/\\n/g, '\n');
      fs.writeFileSync(script, formattedCode)
      
      // Create the database file first
      fs.closeSync(fs.openSync(db, 'w'))
      
      // Initialize SQLite with better settings for output
      const initCommands = [
        '.mode column',
        '.headers on',
        '.nullvalue NULL'
      ];
      
      // Write initialization commands to a file
      const initFile = path.join(tmp, 'init.sql');
      fs.writeFileSync(initFile, initCommands.join('\n') + '\n');
      
      // Execute the SQL script with better output formatting
      const run = spawn('sqlite3', [db, '.read', initFile, '.read', script], { cwd: tmp, stdio: ['pipe', 'pipe', 'pipe'] })
      let out = ''
      let err = ''
      run.stdout.on('data', (d) => (out += d.toString()))
      run.stderr.on('data', (d) => (err += d.toString()))
      
      // Set a timeout to ensure we always send a response
      const sqlTimeout = setTimeout(() => {
        run.kill()
        const duration = Date.now() - started
        fs.rm(tmp, { recursive: true, force: true }, () => {})
        return res.status(200).json({ output: out.trim(), error: 'SQL execution timed out', duration })
      }, 5000)
      
      run.on('close', (code) => {
        clearTimeout(sqlTimeout)
        const duration = Date.now() - started
        const combined = (out + (err ? `\n${err}` : '')).trim()
        fs.rm(tmp, { recursive: true, force: true }, () => {})
        // If there's an error during execution, show it as an error
        if (code !== 0 && err.trim()) {
          return res.status(200).json({ output: '', error: 'SQL Execution Error:\n' + err.trim(), duration })
        }
        return res.status(200).json({ output: combined, error: err || null, duration })
      })
      return
    }
    if (language === 'html' || language === 'css' || language === 'html/css') {
      const duration = Date.now() - started
      const codeContent = String(code || '').trim()
      
      // Parse the HTML to extract key information for simulation
      let title: string = 'Untitled Page'
      let headings: string[] = []
      let paragraphs: string[] = []
      let hasStyle: boolean = false
      
      if (codeContent) {
        // Simple parsing to extract basic info
        const titleMatch = codeContent.match(/<title[^>]*>([^<]*)<\/title>/i)
        if (titleMatch) title = titleMatch[1]
        
        const headingMatches = codeContent.match(/<h[1-6][^>]*>([^<]*)<\/h[1-6]>/gi)
        if (headingMatches) {
          headings = headingMatches.map(h => {
            const tagMatch = h.match(/<h[1-6]/i);
            const tag = tagMatch ? tagMatch[0].toUpperCase() : 'H';
            const content = h.replace(/<[^>]*>/g, '');
            return `${tag}: ${content}`;
          });
        }
        
        const paragraphMatches = codeContent.match(/<p[^>]*>([^<]*)<\/p>/gi);
        if (paragraphMatches) {
          paragraphs = paragraphMatches.map(p => p.replace(/<[^>]*>/g, ''));
        }
        
        hasStyle = /<style/i.test(codeContent) || /style=/i.test(codeContent);
      }
      
      const output = `=== HTML/CSS SIMULATED OUTPUT ===

📄 Page Title: ${title}
${headings.length > 0 ? '\n📝 Headings:\n' + headings.join('\n') : ''}
${paragraphs.length > 0 ? '\n📄 Paragraphs:\n' + paragraphs.map((p, i) => `${i + 1}. ${p}`).join('\n') : ''}
${hasStyle ? '\n🎨 Contains CSS styling' : '\n⬜ No CSS styling detected'}

=== RAW HTML CODE ===
${codeContent}

=== RENDERING INFO ===
In a browser environment, this would render as a webpage.
To see the actual rendered output, save this code to an .html file and open it in a browser.`
      return res.status(200).json({ output, duration })
    }
    const duration = Date.now() - started
    return res.status(200).json({ output: 'Language not supported', duration })
  } catch (e: any) {
    const duration = Date.now() - started
    return res.status(200).json({ output: '', error: e?.message || 'Execution failed', duration })
  }
})

router.get('/topics/progress', async (req, res) => {
  const email = String(req.query.email || '')
  if (!email) return res.status(400).json({ message: 'Missing email' })
  try {
    const db = getDb()
    if (db) {
      const userRows = await query<any>('SELECT id FROM users WHERE email=$1', [email])
      if (!userRows.length) return res.json({ completed: [] })
      const userId = userRows[0].id
      const completedRows = await query<any>('SELECT t.slug FROM user_topic_progress utp JOIN topics t ON utp.topic_id=t.id WHERE utp.user_id=$1 AND utp.is_completed=true', [userId])
      return res.json({ completed: completedRows.map(r => String(r.slug)) })
    }
  } catch (e) {}
  const set = topicProgress.get(email) || new Set<string>()
  return res.json({ completed: Array.from(set) })
})

// Topic extras (examples and associated problem IDs)
router.get('/topics/:id/extras', (req, res) => {
  const topicId = String(req.params.id)
  const v = topicExtras.get(topicId) || { examples: [], problemIds: [] }
  return res.json(v)
})

router.post('/topics/:id/extras', (req, res) => {
  const topicId = String(req.params.id)
  const { examples = [], problemIds = [] } = req.body || {}
  const v = { examples, problemIds }
  topicExtras.set(topicId, v)
  return res.status(200).json(v)
})
router.get('/courses/:slug/topics', async (req, res) => {
  const slug = String(req.params.slug)
  try {
    const db = getDb()
    if (db) {
      const courseRows = await query<any>('SELECT id FROM courses WHERE slug=$1', [slug])
      const courseId = courseRows[0]?.id
      if (!courseId) return res.status(404).json({ message: 'Course not found' })
      const rows = await query<any>('SELECT id, title, slug, description, content, video_url, order_index, estimated_duration_minutes FROM topics WHERE course_id=$1 ORDER BY order_index ASC', [courseId])
      const mapped = rows.map(r => ({ id: String(r.slug), title: r.title, description: r.description, content: r.content, videoUrl: r.video_url, order: r.order_index, duration: r.estimated_duration_minutes }))
      return res.json(mapped)
    }
  } catch (e) {}
  // Fallback to in-memory
  const course = courses.find(c => c.slug === slug)
  return res.json(course?.courseTopics || [])
})

router.put('/courses/:slug/topics', async (req, res) => {
  const slug = String(req.params.slug)
  const newTopics: CourseTopic[] = (req.body || []) as CourseTopic[]
  try {
    const db = getDb()
    if (db) {
      const courseRows = await query<any>('SELECT id FROM courses WHERE slug=$1', [slug])
      const courseId = courseRows[0]?.id
      if (!courseId) return res.status(404).json({ message: 'Course not found' })
      await query('DELETE FROM topics WHERE course_id=$1', [courseId])
      for (const t of newTopics) {
        await query('INSERT INTO topics (course_id, title, slug, description, content, video_url, order_index, estimated_duration_minutes, is_published) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [
          courseId,
          t.title,
          String(t.id),
          t.description || '',
          t.content || '',
          t.videoUrl || null,
          t.order,
          t.duration || null,
          true,
        ])
      }
      return res.json({ updated: newTopics.length })
    }
  } catch (e) {}
  const course = courses.find(c => c.slug === slug)
  if (!course) return res.status(404).json({ message: 'Course not found' })
  course.courseTopics = newTopics
  return res.json({ updated: newTopics.length })
})

// Report Management
router.get('/reports', async (req, res) => {
  try {
    const db = getDb()
    if (db) {
      const rows = await query<any>(`SELECT id, user_id as "userId", user_name as "userName", type, item_id as "itemId", item_title as "itemTitle", reason, description, status, to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as "createdAt" FROM reports ORDER BY created_at DESC`)
      return res.json(rows as Report[])
    }
  } catch (e) {}
  // Fallback to empty array
  return res.json([])
})

router.post('/reports', async (req, res) => {
  const body = req.body || {}
  if (!body.userId || !body.type || !body.itemId || !body.reason || !body.description) {
    return res.status(400).json({ message: 'Missing required fields: userId, type, itemId, reason, description' })
  }
  
  try {
    const db = getDb()
    if (db) {
      // Get user name from users table
      const userRows = await query<any>(`SELECT username FROM users WHERE id=$1`, [body.userId])
      const userName = userRows.length > 0 ? userRows[0].username : 'Unknown User'
      
      await query(`INSERT INTO reports (user_id, user_name, type, item_id, item_title, reason, description, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
        body.userId,
        userName,
        body.type,
        body.itemId,
        body.itemTitle || '',
        body.reason,
        body.description,
        'pending'
      ])
      
      // Get the newly created report
      const reportRows = await query<any>(`SELECT id, user_id as "userId", user_name as "userName", type, item_id as "itemId", item_title as "itemTitle", reason, description, status, to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as "createdAt" FROM reports WHERE user_id=$1 AND item_id=$2 AND created_at >= NOW() - INTERVAL '1 minute' ORDER BY created_at DESC LIMIT 1`, [body.userId, body.itemId])
      
      return res.status(201).json(reportRows[0] as Report)
    }
  } catch (e) {}
  
  // Fallback response
  return res.status(500).json({ message: 'Failed to create report' })
})

router.patch('/reports/:id', async (req, res) => {
  const id = Number(req.params.id)
  const updates = req.body || {}
  
  try {
    const db = getDb()
    if (db) {
      const validFields: string[] = []
      const values: any[] = []
      
      if (updates.status !== undefined) {
        validFields.push('status=$' + (values.length + 1))
        values.push(updates.status)
      }
      if (updates.reason !== undefined) {
        validFields.push('reason=$' + (values.length + 1))
        values.push(updates.reason)
      }
      if (updates.description !== undefined) {
        validFields.push('description=$' + (values.length + 1))
        values.push(updates.description)
      }
      
      if (validFields.length > 0) {
        values.push(id)
        await query(`UPDATE reports SET ${validFields.join(', ')}, updated_at=NOW() WHERE id=$${values.length}`, values)
      }
      
      // Return the updated report
      const rows = await query<any>(`SELECT id, user_id as "userId", user_name as "userName", type, item_id as "itemId", item_title as "itemTitle", reason, description, status, to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as "createdAt" FROM reports WHERE id=$1`, [id])
      if (rows.length === 0) return res.status(404).json({ message: 'Report not found' })
      
      return res.json(rows[0] as Report)
    }
  } catch (e) {}
  
  return res.status(500).json({ message: 'Failed to update report' })
})

router.delete('/reports/:id', async (req, res) => {
  const id = Number(req.params.id)
  
  try {
    const db = getDb()
    if (db) {
      await query(`DELETE FROM reports WHERE id=$1`, [id])
      return res.status(204).send()
    }
  } catch (e) {}
  
  return res.status(500).json({ message: 'Failed to delete report' })
})

router.get('/reports/:type', async (req, res) => {
  const type = req.params.type
  if (!['course', 'problem', 'challenge'].includes(type)) {
    return res.status(400).json({ message: 'Invalid report type' })
  }
  
  try {
    const db = getDb()
    if (db) {
      const rows = await query<any>(`SELECT id, user_id as "userId", user_name as "userName", type, item_id as "itemId", item_title as "itemTitle", reason, description, status, to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as "createdAt" FROM reports WHERE type=$1 ORDER BY created_at DESC`, [type])
      return res.json(rows as Report[])
    }
  } catch (e) {}
  
  return res.json([])
})

// Leaderboard API
router.get('/leaderboard', async (req, res) => {
  try {
    const db = getDb()
    if (db) {
      // Get users with their scores, problems solved, and other metrics
      const rows = await query<any>('SELECT id, username, full_name as "fullName", total_score as "totalScore", problems_solved as "problemsSolved", current_streak, created_at as "joinedAt" FROM users WHERE is_active = true ORDER BY total_score DESC, problems_solved DESC LIMIT 100')
      return res.json(rows)
    }
  } catch (e) {}
  
  // Fallback to empty array
  return res.json([])
})

router.get('/leaderboard/:period', async (req, res) => {
  const period = req.params.period
  const validPeriods = ['daily', 'weekly', 'monthly', 'all']
  if (!validPeriods.includes(period)) {
    return res.status(400).json({ message: 'Invalid period. Valid values: daily, weekly, monthly, all' })
  }
  
  try {
    const db = getDb()
    if (db) {
      let dateCondition = ''
      switch(period) {
        case 'daily':
          dateCondition = "created_at >= NOW() - INTERVAL '1 day'"
          break
        case 'weekly':
          dateCondition = "created_at >= NOW() - INTERVAL '7 days'"
          break
        case 'monthly':
          dateCondition = "created_at >= NOW() - INTERVAL '30 days'"
          break
        default:
          dateCondition = 'true' // no date restriction for 'all'
      }
      
      const rows = await query<any>('SELECT id, username, full_name as "fullName", total_score as "totalScore", problems_solved as "problemsSolved", current_streak, created_at as "joinedAt" FROM users WHERE is_active = true AND ' + dateCondition + ' ORDER BY total_score DESC, problems_solved DESC LIMIT 50')
      return res.json(rows)
    }
  } catch (e) {}
  
  return res.json([])
})
