'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Upload, X, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { courseStore, problemStore } from '@/lib/data-store'

interface CourseTopic {
  id: string
  title: string
  description: string
  content: string
  duration: number
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

export default function NewCoursePage() {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [topics, setTopics] = useState<CourseTopic[]>([])
  const [examples, setExamples] = useState<CourseExample[]>([])
  const [selectedProblems, setSelectedProblems] = useState<number[]>([])
  const [availableProblems, setAvailableProblems] = useState<any[]>([])
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('')
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    category: '',
    difficulty: 'beginner',
    duration: '',
    thumbnail: '',
    isPublished: false,
    price: '',
    syllabus: '',
    requirements: '',
    learningOutcomes: ''
  })

  useEffect(() => {
    setIsMounted(true)
    
    const isAdmin = localStorage.getItem('isAdmin') === 'true'
    if (!isAdmin) {
      router.push('/admin/login')
      return
    }
    
    // Load available problems
    setAvailableProblems(problemStore.getAll())
  }, [router])

  // Prevent hydration mismatch by not rendering until client-side
  if (!isMounted) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Create course using the data store
      courseStore.add({
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        category: formData.category,
        difficulty: formData.difficulty,
        duration: parseInt(formData.duration),
        thumbnail: formData.thumbnail || '📚',
        isPublished: formData.isPublished,
        topics: topics.length,
        requirements: formData.requirements,
        learningOutcomes: formData.learningOutcomes,
        syllabus: formData.syllabus,
        courseTopics: topics,
        courseExamples: examples,
        associatedProblems: selectedProblems
      })
      
      alert('Course created successfully!')
      router.push('/admin/courses')
    } catch (error) {
      alert('Failed to create course')
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

  // Example Management
  const addExample = () => {
    const newExample: CourseExample = {
      id: Date.now().toString(),
      title: '',
      description: '',
      code: '',
      language: 'javascript',
      explanation: ''
    }
    setExamples([...examples, newExample])
  }

  const updateExample = (id: string, field: keyof CourseExample, value: any) => {
    setExamples(examples.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  const removeExample = (id: string) => {
    setExamples(examples.filter(e => e.id !== id))
  }

  // Problem Selection
  const toggleProblem = (problemId: number) => {
    if (selectedProblems.includes(problemId)) {
      setSelectedProblems(selectedProblems.filter(id => id !== problemId))
    } else {
      setSelectedProblems([...selectedProblems, problemId])
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleTitleChange = (value: string) => {
    setFormData({
      ...formData,
      title: value,
      slug: generateSlug(value)
    })
  }

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setThumbnailFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setThumbnailPreview(result)
        setFormData({ ...formData, thumbnail: result })
      }
      reader.readAsDataURL(file)
    }
  }

  const clearThumbnailUpload = () => {
    setThumbnailFile(null)
    setThumbnailPreview('')
    setFormData({ ...formData, thumbnail: '' })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </button>
            <span className="text-gray-400 dark:text-gray-600">|</span>
            <button
              onClick={() => router.push('/admin/courses')}
              className="flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Present Courses
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create New Course
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Add a new course to the platform
          </p>
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
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Data Structures Fundamentals"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL Slug (auto-generated)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="data-structures-fundamentals"
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
                  placeholder="Brief description of the course..."
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
                  placeholder="12"
                  min="1"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thumbnail Emoji / Image
                </label>
                <div className="space-y-3">
                  {/* Selected Emoji/Image Display */}
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 flex items-center justify-center text-4xl bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-gray-300 dark:border-gray-600 overflow-hidden">
                      {thumbnailPreview ? (
                        <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                      ) : (
                        <span>{formData.thumbnail || '📚'}</span>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={thumbnailPreview ? '' : formData.thumbnail}
                        onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="📚 or paste any emoji"
                        maxLength={4}
                        disabled={!!thumbnailPreview}
                      />
                      {thumbnailPreview && (
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                          <span>Custom image uploaded</span>
                          <button
                            type="button"
                            onClick={clearThumbnailUpload}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Upload Custom Image */}
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg cursor-pointer transition-all">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Custom Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      PNG, JPG, GIF up to 5MB
                    </span>
                  </div>
                  
                  {/* Emoji Picker */}
                  {!thumbnailPreview && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick Select Emoji:</p>
                      <div className="grid grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-2">
                        {['📚', '💻', '🎓', '🚀', '⚡', '🔥', '💡', '🎯', '📊', '🧮', '🌐', '🎨', '🔧', '📱', '⚙️', '🏗️', '🧪', '📖', '✨', '🎪', '🎬', '🎮', '🎵', '🎤', '📷', '📺', '📡', '🔬', '🔭', '🧬', '💊', '🩺'].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setFormData({ ...formData, thumbnail: emoji })}
                            className={`w-10 h-10 flex items-center justify-center text-2xl rounded-lg transition-all hover:scale-110 ${
                              formData.thumbnail === emoji
                                ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500'
                                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                            title={emoji}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Course Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Course Content
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Requirements
                </label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Prerequisites and requirements for this course (one per line)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Learning Outcomes
                </label>
                <textarea
                  value={formData.learningOutcomes}
                  onChange={(e) => setFormData({ ...formData, learningOutcomes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="What students will learn (one per line)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Syllabus/Curriculum
                </label>
                <textarea
                  value={formData.syllabus}
                  onChange={(e) => setFormData({ ...formData, syllabus: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Course modules and topics (one per line)"
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
                      <div>
                        <input
                          type="text"
                          value={topic.title}
                          onChange={(e) => updateTopic(topic.id, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          placeholder="Topic title (e.g., Introduction to Arrays)"
                        />
                      </div>
                      <div>
                        <textarea
                          value={topic.description}
                          onChange={(e) => updateTopic(topic.id, 'description', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          placeholder="Brief description"
                        />
                      </div>
                      <div>
                        <textarea
                          value={topic.content}
                          onChange={(e) => updateTopic(topic.id, 'content', e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono"
                          placeholder="Topic content (markdown supported)"
                        />
                      </div>
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
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Course Examples */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Code Examples ({examples.length})
              </h2>
              <button
                type="button"
                onClick={addExample}
                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Example
              </button>
            </div>
            <div className="space-y-4">
              {examples.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No examples added yet. Click "Add Example" to provide code samples.
                </p>
              ) : (
                examples.map((example, index) => (
                  <div key={example.id} className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Example {index + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeExample(example.id)}
                        className="p-1 text-red-600 hover:text-red-700"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <input
                            type="text"
                            value={example.title}
                            onChange={(e) => updateExample(example.id, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            placeholder="Example title"
                          />
                        </div>
                        <div>
                          <select
                            value={example.language}
                            onChange={(e) => updateExample(example.id, 'language', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="cpp">C++</option>
                            <option value="go">Go</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <textarea
                          value={example.description}
                          onChange={(e) => updateExample(example.id, 'description', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          placeholder="Brief description"
                        />
                      </div>
                      <div>
                        <textarea
                          value={example.code}
                          onChange={(e) => updateExample(example.id, 'code', e.target.value)}
                          rows={6}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-900 text-green-400 text-sm font-mono"
                          placeholder="// Your code here..."
                        />
                      </div>
                      <div>
                        <textarea
                          value={example.explanation}
                          onChange={(e) => updateExample(example.id, 'explanation', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          placeholder="Explanation of the code..."
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Associated Problems */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Associated Practice Problems ({selectedProblems.length})
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select problems that students should practice for this course
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {availableProblems.map((problem) => (
                <label
                  key={problem.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedProblems.includes(problem.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedProblems.includes(problem.id)}
                    onChange={() => toggleProblem(problem.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {problem.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {problem.difficulty} • {problem.category}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Publishing Options */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Publishing Options
            </h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublished" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Publish immediately (make course visible to students)
                </label>
              </div>
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
              {isLoading ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
