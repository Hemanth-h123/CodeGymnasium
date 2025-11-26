'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { courseStore, problemStore } from '@/lib/data-store'

interface CourseTopic {
  id: string
  title: string
  description: string
  content: string
  duration: number
  videoUrl?: string
  order: number
  examples?: CourseExample[]
  associatedProblems?: number[]
}

interface CourseExample {
  id: string
  title: string
  description: string
  code: string
  language: string
  explanation: string
}

export default function EditCoursePage() {
  const router = useRouter()
  const params = useParams()
  const courseId = parseInt(params.id as string)
  const [isLoading, setIsLoading] = useState(false)
  const [topics, setTopics] = useState<CourseTopic[]>([])
  const [availableProblems, setAvailableProblems] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    category: '',
    difficulty: 'beginner',
    duration: '',
    thumbnail: '',
    isPublished: false,
    requirements: '',
    learningOutcomes: '',
    syllabus: ''
  })

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true'
    if (!isAdmin) {
      router.push('/admin/login')
      return
    }

    // Load available problems
    setAvailableProblems(problemStore.getAll())

    // Load course data
    const course = courseStore.getById(courseId)
    if (!course) {
      alert('Course not found')
      router.push('/admin/courses')
      return
    }

    setFormData({
      title: course.title,
      slug: course.slug,
      description: course.description,
      category: course.category,
      difficulty: course.difficulty,
      duration: course.duration.toString(),
      thumbnail: course.thumbnail,
      isPublished: course.isPublished,
      requirements: course.requirements || '',
      learningOutcomes: course.learningOutcomes || '',
      syllabus: course.syllabus || ''
    })

    // Load topics
    if (course.courseTopics) setTopics(course.courseTopics)
  }, [router, courseId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      courseStore.update(courseId, {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        category: formData.category,
        difficulty: formData.difficulty,
        duration: parseInt(formData.duration),
        thumbnail: formData.thumbnail || '📚',
        isPublished: formData.isPublished,
        requirements: formData.requirements,
        learningOutcomes: formData.learningOutcomes,
        syllabus: formData.syllabus,
        topics: topics.length,
        courseTopics: topics
      })
      const base = process.env.NEXT_PUBLIC_API_URL
      if (base) {
        try {
          for (const t of topics) {
            await fetch(`${base}/api/content/topics/${t.id}/extras`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ examples: t.examples || [], problemIds: t.associatedProblems || [] })
            })
          }
        } catch {}
      }
      
      alert('Course updated successfully!')
      router.push('/admin/courses')
    } catch (error) {
      alert('Failed to update course')
    } finally {
      setIsLoading(false)
    }
  }

  // Topic Management
  const addTopic = () => {
    const newTopic: CourseTopic = {
      id: Date.now().toString(),
      title: '',
      description: '',
      content: '',
      duration: 30,
      videoUrl: '',
      order: topics.length
    }
    setTopics([...topics, newTopic])
  }

  const updateTopic = (id: string, field: keyof CourseTopic, value: any) => {
    setTopics(topics.map(t => t.id === id ? { ...t, [field]: value } : t))
  }

  const removeTopic = (id: string) => {
    setTopics(topics.filter(t => t.id !== id))
  }

  const moveTopicUp = (index: number) => {
    if (index === 0) return
    const newTopics = [...topics]
    ;[newTopics[index], newTopics[index - 1]] = [newTopics[index - 1], newTopics[index]]
    newTopics.forEach((t, i) => t.order = i)
    setTopics(newTopics)
  }

  const moveTopicDown = (index: number) => {
    if (index === topics.length - 1) return
    const newTopics = [...topics]
    ;[newTopics[index], newTopics[index + 1]] = [newTopics[index + 1], newTopics[index]]
    newTopics.forEach((t, i) => t.order = i)
    setTopics(newTopics)
  }

  // Removed global examples/problems; use per-topic editors

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/courses')}
            className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Courses
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Course
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Course Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  <option value="Data Structures">Data Structures</option>
                  <option value="Algorithms">Algorithms</option>
                  <option value="Web Development">Web Development</option>
                  <option value="System Design">System Design</option>
                  <option value="Programming">Programming</option>
                  <option value="Database">Database</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Difficulty Level *
                </label>
                <select
                  required
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration (hours) *
                </label>
                <input
                  type="number"
                  required
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thumbnail Emoji
                </label>
                <input
                  type="text"
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          {/* Course Topics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Course Topics ({topics.length})
              </h2>
              <button
                type="button"
                onClick={addTopic}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Topic
              </button>
            </div>
            <div className="space-y-4">
              {topics.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No topics added yet. Click "Add Topic" to create course content.
                </p>
              ) : (
                topics.map((topic, index) => (
                  <div key={topic.id} className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Topic {index + 1}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => moveTopicUp(index)}
                          disabled={index === 0}
                          className="p-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 disabled:opacity-30"
                          title="Move Up"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveTopicDown(index)}
                          disabled={index === topics.length - 1}
                          className="p-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 disabled:opacity-30"
                          title="Move Down"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeTopic(topic.id)}
                          className="p-1 text-red-600 hover:text-red-700"
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={topic.title}
                        onChange={(e) => updateTopic(topic.id, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        placeholder="Topic title"
                      />
                      <textarea
                        value={topic.description}
                        onChange={(e) => updateTopic(topic.id, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        placeholder="Brief description"
                      />
                      <textarea
                        value={topic.content}
                        onChange={(e) => updateTopic(topic.id, 'content', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono"
                        placeholder="Topic content (markdown supported)"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Duration (minutes)
                          </label>
                          <input
                            type="number"
                            value={topic.duration}
                            onChange={(e) => updateTopic(topic.id, 'duration', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            min="1"
                          />
                        </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Video URL (optional)
                      </label>
                      <input
                        type="url"
                        value={topic.videoUrl || ''}
                        onChange={(e) => updateTopic(topic.id, 'videoUrl', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Examples for this Topic</h4>
                    <button type="button" onClick={() => updateTopic(topic.id, 'examples', [...(topic.examples||[]), { id: Date.now().toString(), title: '', description: '', code: '', language: 'javascript', explanation: '' }])} className="px-2 py-1 bg-blue-600 text-white text-xs rounded">Add Example</button>
                    {(topic.examples||[]).map((ex, idx) => (
                      <div key={ex.id} className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input value={ex.title} onChange={(e) => { const arr = [...(topic.examples||[])]; arr[idx] = { ...arr[idx], title: e.target.value }; updateTopic(topic.id, 'examples', arr) }} className="px-3 py-2 border rounded" placeholder="Example title" />
                        <input value={ex.language} onChange={(e) => { const arr = [...(topic.examples||[])]; arr[idx] = { ...arr[idx], language: e.target.value }; updateTopic(topic.id, 'examples', arr) }} className="px-3 py-2 border rounded" placeholder="Language" />
                        <textarea value={ex.description} onChange={(e) => { const arr = [...(topic.examples||[])]; arr[idx] = { ...arr[idx], description: e.target.value }; updateTopic(topic.id, 'examples', arr) }} className="px-3 py-2 border rounded md:col-span-2" placeholder="Description" />
                        <textarea value={ex.code} onChange={(e) => { const arr = [...(topic.examples||[])]; arr[idx] = { ...arr[idx], code: e.target.value }; updateTopic(topic.id, 'examples', arr) }} className="px-3 py-2 border rounded md:col-span-2" placeholder="Code" />
                        <textarea value={ex.explanation} onChange={(e) => { const arr = [...(topic.examples||[])]; arr[idx] = { ...arr[idx], explanation: e.target.value }; updateTopic(topic.id, 'examples', arr) }} className="px-3 py-2 border rounded md:col-span-2" placeholder="Explanation" />
                        <button type="button" onClick={() => { const arr = [...(topic.examples||[])]; arr.splice(idx, 1); updateTopic(topic.id, 'examples', arr) }} className="px-2 py-1 bg-red-600 text-white text-xs rounded">Remove Example</button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Associate Problems to this Topic</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {availableProblems.map((p) => (
                        <label key={p.id} className="flex items-center space-x-2 text-sm">
                          <input type="checkbox" checked={(topic.associatedProblems||[]).includes(p.id)} onChange={() => { const set = new Set(topic.associatedProblems||[]); if (set.has(p.id)) set.delete(p.id); else set.add(p.id); updateTopic(topic.id, 'associatedProblems', Array.from(set)) }} />
                          <span>{p.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>




          {/* Publishing Options */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Publishing Options
            </h2>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublished"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isPublished" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Published (visible to students)
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/admin/courses')}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Updating...' : 'Update Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
