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
      } catch {
        const duration = Date.now() - started
        return res.status(200).json({ output: 'TypeScript toolchain not available', duration })
      }
    }
    if (language === 'python') {
      const py = spawn('python3', ['-u', '-'], { stdio: ['pipe', 'pipe', 'pipe'] })
      let out = ''
      let err = ''
      py.stdout.on('data', (d) => (out += d.toString()))
      py.stderr.on('data', (d) => (err += d.toString()))
      py.on('error', () => {})
      py.stdin.write(code)
      if (input) py.stdin.write(`

# input
${input}
`)
      py.stdin.end()
      py.on('close', () => {
        const duration = Date.now() - started
        const combined = (out + (err ? `\n${err}` : '')).trim()
        return res.status(200).json({ output: combined, error: err, duration })
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
          return res.status(200).json({ output: combined, error: cErr, duration })
        }
        const j = spawn('java', ['-cp', tmp, className], { cwd: tmp, stdio: ['pipe', 'pipe', 'pipe'] })
        let out = ''
        let err = ''
        j.stdout.on('data', (d) => (out += d.toString()))
        j.stderr.on('data', (d) => (err += d.toString()))
        if (input) j.stdin.write(input)
        j.stdin.end()
        j.on('close', () => {
          const duration = Date.now() - started
          const combined = (out + (err ? `\n${err}` : '')).trim()
          fs.rm(tmp, { recursive: true, force: true }, () => {})
          return res.status(200).json({ output: combined, error: err, duration })
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
          return res.status(200).json({ output: combined, error: cErr, duration })
        }
        const run = spawn(bin, [], { cwd: tmp, stdio: ['pipe', 'pipe', 'pipe'] })
        let out = ''
        let err = ''
        run.stdout.on('data', (d) => (out += d.toString()))
        run.stderr.on('data', (d) => (err += d.toString()))
        if (input) run.stdin.write(input)
        run.stdin.end()
        run.on('close', () => {
          const duration = Date.now() - started
          const combined = (out + (err ? `\n${err}` : '')).trim()
          fs.rm(tmp, { recursive: true, force: true }, () => {})
          return res.status(200).json({ output: combined, error: err, duration })
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
            return res.status(200).json({ output: combined, error: cErr, duration })
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
        
        run.on('close', () => {
          clearTimeout(execTimeout)
          if (!isResponseSent) {
            isResponseSent = true
            const duration = Date.now() - started
            const combined = (out + (err ? `\n${err}` : '')).trim()
            fs.rm(tmp, { recursive: true, force: true }, () => {})
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
      run.on('close', () => {
        const duration = Date.now() - started
        const combined = (out + (err ? `\n${err}` : '')).trim()
        fs.rm(tmp, { recursive: true, force: true }, () => {})
        return res.status(200).json({ output: combined, error: err, duration })
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
          return res.status(200).json({ output: combined, error: cErr, duration })
        }
        const run = spawn(bin, [], { cwd: tmp, stdio: ['pipe', 'pipe', 'pipe'] })
        let out = ''
        let err = ''
        run.stdout.on('data', (d) => (out += d.toString()))
        run.stderr.on('data', (d) => (err += d.toString()))
        if (input) run.stdin.write(input)
        run.stdin.end()
        run.on('close', () => {
          const duration = Date.now() - started
          const combined = (out + (err ? `\n${err}` : '')).trim()
          fs.rm(tmp, { recursive: true, force: true }, () => {})
          return res.status(200).json({ output: combined, error: err, duration })
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
      run.on('close', () => {
        const duration = Date.now() - started
        const combined = (out + (err ? `\n${err}` : '')).trim()
        fs.rm(tmp, { recursive: true, force: true }, () => {})
        return res.status(200).json({ output: combined, error: err, duration })
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
      
      run.on('close', () => {
        clearTimeout(sqlTimeout)
        const duration = Date.now() - started
        const combined = (out + (err ? `\n${err}` : '')).trim()
        fs.rm(tmp, { recursive: true, force: true }, () => {})
        return res.status(200).json({ output: combined, error: err || null, duration })
      })
      return
    }
    if (language === 'html' || language === 'css') {
      const duration = Date.now() - started
      return res.status(200).json({ output: String(code || '').trim(), duration })
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
