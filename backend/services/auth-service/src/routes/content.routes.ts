import { Router, Request, Response } from 'express'
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


const router = Router()
const topicProgress = new Map<string, Set<string>>()
const topicExtras = new Map<string, { examples: any[]; problemIds: number[] }>()

// In-memory arrays for fallback when DB is not available
// Initialize courses and problems from files if they exist, otherwise start empty
let courses: Course[] = [];
let problems: Problem[] = [];

// File paths for persistence
const COURSES_FILE = path.join(__dirname, '../../data/courses.json');
const PROBLEMS_FILE = path.join(__dirname, '../../data/problems.json');

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load existing data from files if they exist
try {
  if (fs.existsSync(COURSES_FILE)) {
    const coursesData = fs.readFileSync(COURSES_FILE, 'utf8');
    courses = JSON.parse(coursesData);
  }
} catch (e) {
  console.warn('Could not load courses from file, starting with empty array:', e);
  courses = [];
}

try {
  if (fs.existsSync(PROBLEMS_FILE)) {
    const problemsData = fs.readFileSync(PROBLEMS_FILE, 'utf8');
    problems = JSON.parse(problemsData);
  }
} catch (e) {
  console.warn('Could not load problems from file, starting with empty array:', e);
  problems = [];
}

// Function to save courses to file
function saveCoursesToFile() {
  try {
    fs.writeFileSync(COURSES_FILE, JSON.stringify(courses, null, 2));
  } catch (e) {
    console.error('Could not save courses to file:', e);
  }
}

// Function to save problems to file
function saveProblemsToFile() {
  try {
    fs.writeFileSync(PROBLEMS_FILE, JSON.stringify(problems, null, 2));
  } catch (e) {
    console.error('Could not save problems to file:', e);
  }
}

// Helper functions to save data after operations
function addCourse(course: Course) {
  courses.push(course);
  saveCoursesToFile();
}

function removeCourse(index: number) {
  if (index !== -1) {
    courses.splice(index, 1);
    saveCoursesToFile();
  }
}

function addProblem(problem: Problem) {
  problems.push(problem);
  saveProblemsToFile();
}

function removeProblem(index: number) {
  if (index !== -1) {
    problems.splice(index, 1);
    saveProblemsToFile();
  }
}

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

// Get all courses
router.get('/courses', async (req: Request, res: Response) => {
  return res.json(courses)
})

// Get a single course by ID
router.get('/courses/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const course = courses.find(c => c.id === id)
  if (!course) return res.status(404).json({ message: 'Course not found' })
  return res.json(course)
})

// 184

router.get('/courses/:slug', async (req: Request, res: Response) => {
  const slug = String(req.params.slug)
  const course = courses.find(c => c.slug === slug)
  if (!course) return res.status(404).json({ message: 'Course not found' })
  return res.json(course)
})

router.post('/courses', async (req: Request, res: Response) => {
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
  addCourse(newCourse)
  // Database functionality removed
  res.status(201).json(newCourse)
})

router.patch('/courses/:id/publish', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const course = courses.find(c => c.id === id)
  if (!course) return res.status(404).json({ message: 'Not found' })
  course.isPublished = !course.isPublished
  res.json(course)
    saveCoursesToFile()
})

router.patch('/courses/:id', async (req: Request, res: Response) => {
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
  // Database functionality removed
  saveCoursesToFile()
  if (!course) return res.status(404).json({ message: 'Not found' })
  return res.json(course)
  
  saveCoursesToFile()

router.delete('/courses/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const index = courses.findIndex(c => c.id === id)
  removeCourse(index)
  // Database functionality removed
  return res.status(204).send()
})

// Slug-based course operations (persistent)
router.patch('/courses/by-slug/:slug', async (req: Request, res: Response) => {
  const slug = String(req.params.slug)
  const updates = req.body || {}
  // Database functionality removed
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
    saveCoursesToFile()
  
  return res.json(course)
})

router.delete('/courses/by-slug/:slug', async (req: Request, res: Response) => {
  const slug = String(req.params.slug)
  // Database functionality removed
  const index = courses.findIndex(c => c.slug === slug)
  removeCourse(index)
  return res.status(204).send()
})

router.get('/problems', async (req: Request, res: Response) => {
  return res.json(problems)
})

router.post('/problems', async (req: Request, res: Response) => {
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
  addProblem(newProblem)
  // Database functionality removed
  res.status(201).json(newProblem)
})

router.patch('/problems/:id/publish', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const problem = problems.find(p => p.id === id)
  if (!problem) return res.status(404).json({ message: 'Not found' })
  problem.isPublished = !problem.isPublished
    saveProblemsToFile()  
  return res.json(problem)
  return res.json(problem)
})

router.patch('/problems/:id', async (req: Request, res: Response) => {
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
        saveProblemsToFile()
  }
  // Database functionality removed
  if (!problem) return res.status(404).json({ message: 'Not found' })
  return res.json(problem)
})

router.delete('/problems/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const index = problems.findIndex(p => p.id === id)
  removeProblem(index)
  // Database functionality removed
  return res.status(204).send()
})

// Slug-based problem operations (persistent)
router.patch('/problems/by-slug/:slug', async (req: Request, res: Response) => {
  const slug = String(req.params.slug)
  const updates = req.body || {}
  // Database functionality removed
  const problem = problems.find(p => p.slug === slug)
  if (!problem) return res.status(404).json({ message: 'Not found' })
  Object.assign(problem, {
    title: updates.title ?? problem.title,
    description: updates.description ?? problem.description,
    category: updates.category ?? problem.category,
    difficulty: updates.difficulty ?? problem.difficulty,
    isPublished: updates.isPublished ?? problem.isPublished,
  })
    saveProblemsToFile()
  return res.json(problem)
})

router.delete('/problems/by-slug/:slug', async (req: Request, res: Response) => {
  const slug = String(req.params.slug)
  // Database functionality removed
  const index = problems.findIndex(p => p.slug === slug)
  removeProblem(index)
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

router.get('/discussions', async (req: Request, res: Response) => {
  // Database functionality removed
  return res.json([])
  return res.json([])
})

router.post('/discussions', async (req: Request, res: Response) => {
  const body = req.body || {}
  if (!body.title || !body.content || !body.category || !body.authorId) {
    return res.status(400).json({ message: 'Missing required fields: title, content, category, authorId' })
  }
  
  // Database functionality removed
  return res.status(500).json({ message: 'Database functionality removed' })
  
  return res.status(500).json({ message: 'Failed to create discussion' })
})

router.get('/discussions/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id)
  // Database functionality removed
  return res.status(404).json({ message: 'Discussion not found' })
  
  return res.status(404).json({ message: 'Discussion not found' })
})

router.get('/discussions/:id/comments', async (req: Request, res: Response) => {
  const id = String(req.params.id)
  // Database functionality removed
  return res.json([])
  
  return res.json([])
})

router.post('/discussions/:id/comments', async (req: Request, res: Response) => {
  const id = String(req.params.id)
  const body = req.body || {}
  if (!body.content || !body.userId) {
    return res.status(400).json({ message: 'Missing required fields: content, userId' })
  }
  
  // Database functionality removed
  return res.status(500).json({ message: 'Database functionality removed' })
  
  return res.status(500).json({ message: 'Failed to add comment' })
})

// Discussion categories API
router.get('/discussion-categories', async (req: Request, res: Response) => {
  // Database functionality removed
  return res.json([])
  
  return res.json([])
})

// Homepage statistics API
router.get('/homepage-stats', async (req: Request, res: Response) => {
  // Database functionality removed
  return res.json({
    active_learners: 0,
    courses: 0,
    topics: 0,
    problems: 0
  })
  
  return res.json({
    active_learners: 0,
    courses: 0,
    topics: 0,
    problems: 0
  })
})

// Update homepage stats when users register
router.post('/homepage-stats/users', async (req: Request, res: Response) => {
  // Database functionality removed
  return res.json({ count: 0 })
  
  return res.status(500).json({ message: 'Failed to update user count' })
})

// Update homepage stats when content is created
router.post('/homepage-stats/:type', async (req: Request, res: Response) => {
  const type = req.params.type
  const validTypes = ['courses', 'topics', 'problems']
  if (!validTypes.includes(type)) {
    return res.status(400).json({ message: 'Invalid type. Valid values: courses, topics, problems' })
  }
  
  // Database functionality removed
  return res.json({ count: 0 })
  
  return res.status(500).json({ message: 'Failed to update content count' })
})

// Admin dashboard metrics API
router.get('/admin/metrics', async (req: Request, res: Response) => {
  // Database functionality removed
  return res.json({
    dailyActiveUsers: 0,
    avgSessionTime: '0 min',
    problemSolveRate: '0%'
  })
  
  // Return default values if anything fails
  return res.json({
    dailyActiveUsers: 0,
    avgSessionTime: '0 min',
    problemSolveRate: '0%'
  })
})

// Update metrics when users interact with the platform
router.post('/admin/metrics/update', async (req: Request, res: Response) => {
  const { metricType, increment = 1 } = req.body
  
  if (!metricType) {
    return res.status(400).json({ message: 'Missing metricType' })
  }
  
  try {
    // For now, we're just logging the metric update request
    // In a full implementation, we would update appropriate tables
    console.log(`Metric update requested: ${metricType} with increment ${increment}`)
    
    return res.json({ success: true, message: 'Metrics update request received' })
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

router.get('/challenges', async (req: Request, res: Response) => {
  // Database functionality removed
  return res.json([])
  return res.json([])
})

router.post('/challenges', async (req: Request, res: Response) => {
  const body = req.body || {}
  if (!body.title || !body.slug || !body.type || !body.difficulty || !body.startTime || !body.endTime) {
    return res.status(400).json({ message: 'Missing required fields: title, slug, type, difficulty, startTime, endTime' })
  }
  
  // Database functionality removed
  return res.status(500).json({ message: 'Database functionality removed' })
  
  return res.status(500).json({ message: 'Failed to create challenge' })
})

router.patch('/challenges/:id/publish', async (req: Request, res: Response) => {
  const id = req.params.id
  // Database functionality removed
  return res.status(500).json({ message: 'Database functionality removed' })
  
  return res.status(500).json({ message: 'Failed to toggle challenge publish status' })
})

// Update challenges count if not exists in homepage_stats
router.get('/ensure-challenges-count', async (req: Request, res: Response) => {
  // Database functionality removed
  return res.json({ message: 'Database functionality removed' })
  return res.status(500).json({ message: 'Failed to ensure challenges count' })
})

export default router
// Topic progress
router.post('/topics/:id/complete', async (req: Request, res: Response) => {
  const email = (req.body && req.body.email) || req.header('X-User-Email') || ''
  const topicSlug = String(req.params.id)
  if (!email) return res.status(400).json({ message: 'Missing email' })
  // Database functionality removed
  const set = topicProgress.get(email) || new Set<string>()
  set.add(topicSlug)
  topicProgress.set(email, set)
  return res.status(200).json({ completed: Array.from(set) })
})

// Code execution (basic, JS sandbox + Python child process)
router.post('/code/execute', async (req: Request, res: Response) => {
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

router.get('/topics/progress', async (req: Request, res: Response) => {
  const email = String(req.query.email || '')
  if (!email) return res.status(400).json({ message: 'Missing email' })
  try {
    // Database functionality removed
    // Return in-memory progress
    const set = topicProgress.get(email) || new Set<string>()
    return res.json({ completed: Array.from(set) })
  } catch (e) {}
  const set = topicProgress.get(email) || new Set<string>()
  return res.json({ completed: Array.from(set) })
})

// Topic extras (examples and associated problem IDs)
router.get('/topics/:id/extras', (req: Request, res: Response) => {
  const topicId = String(req.params.id)
  const v = topicExtras.get(topicId) || { examples: [], problemIds: [] }
  return res.json(v)
})

router.post('/topics/:id/extras', (req: Request, res: Response) => {
  const topicId = String(req.params.id)
  const { examples = [], problemIds = [] } = req.body || {}
  const v = { examples, problemIds }
  topicExtras.set(topicId, v)
  return res.status(200).json(v)
})
router.get('/courses/:slug/topics', async (req: Request, res: Response) => {
  const slug = String(req.params.slug)
  // Database functionality removed
  // Fallback to in-memory
  const course = courses.find(c => c.slug === slug)
  return res.json(course?.courseTopics || [])
})

router.put('/courses/:slug/topics', async (req: Request, res: Response) => {
  const slug = String(req.params.slug)
  const newTopics: CourseTopic[] = (req.body || []) as CourseTopic[]
  // Database functionality removed
  const course = courses.find(c => c.slug === slug)
  if (!course) return res.status(404).json({ message: 'Course not found' })
  course.courseTopics = newTopics
  return res.json({ updated: newTopics.length })
})

// Report Management
router.get('/reports', async (req: Request, res: Response) => {
  // Database functionality removed
  return res.json([])
})

router.post('/reports', async (req: Request, res: Response) => {
  const body = req.body || {}
  if (!body.userId || !body.type || !body.itemId || !body.reason || !body.description) {
    return res.status(400).json({ message: 'Missing required fields: userId, type, itemId, reason, description' })
  }
  
  // Database functionality removed
  
  // Fallback response
  return res.status(500).json({ message: 'Failed to create report' })
})

router.patch('/reports/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const updates = req.body || {}
  
  // Database functionality removed
  
  return res.status(500).json({ message: 'Failed to update report' })
})

router.delete('/reports/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  
  // Database functionality removed
  
  return res.status(500).json({ message: 'Failed to delete report' })
})

router.get('/reports/:type', async (req: Request, res: Response) => {
  const type = req.params.type
  if (!['course', 'problem', 'challenge'].includes(type)) {
    return res.status(400).json({ message: 'Invalid report type' })
  }
  
  try {
    // Database functionality removed
    // Return empty array for reports
    return res.json([])
  } catch (e) {}

  return res.json([])
})

// Problem Submission API
router.post('/problems/:slug/submit', async (req: Request, res: Response) => {
  const slug = String(req.params.slug)
  const { userId, code, language, status } = req.body || {}
  
  if (!userId || !code || !language || !status) {
    return res.status(400).json({ message: 'Missing required fields: userId, code, language, status' })
  }
  
  try {
    // Database functionality removed
    // In-memory processing is not implemented for submissions
    // Return success response with a mock submission ID
    const isAccepted = status === 'accepted'
    
    return res.status(201).json({ 
      submissionId: Date.now(), // Mock submission ID
      message: 'Submission recorded successfully',
      accepted: isAccepted
    })
  } catch (e) {
    console.error('Error processing submission:', e)
    return res.status(500).json({ message: 'Failed to process submission' })
  }
  
  return res.status(500).json({ message: 'Failed to process submission' })
})

// Leaderboard API
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    // Database functionality removed
    // Fallback to empty array
    return res.json([])
  } catch (e) {}
  
  // Fallback to empty array
  return res.json([])
})

router.get('/leaderboard/:period', async (req: Request, res: Response) => {
  const period = req.params.period
  const validPeriods = ['daily', 'weekly', 'monthly', 'all']
  if (!validPeriods.includes(period)) {
    return res.status(400).json({ message: 'Invalid period. Valid values: daily, weekly, monthly, all' })
  }
  
  try {
    // Database functionality removed
    // Fallback to empty array
    return res.json([])
  } catch (e) {}
  
  return res.json([])
})
