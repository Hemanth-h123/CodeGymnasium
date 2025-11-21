'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Clock, BookOpen, AlertCircle, CheckCircle, Circle, ChevronRight, ChevronLeft } from 'lucide-react'
import { courseStore } from '@/lib/data-store'

export default function CourseTopicPage({ params }: { params: { slug: string; id: string } }) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [course, setCourse] = useState<any>(null)
  const [topic, setTopic] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [topics, setTopics] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(-1)

  useEffect(() => {
    setMounted(true)
    const loadData = () => {
      const c = courseStore.getBySlug(params.slug)
      if (!c) {
        setCourse(null)
        setTopic(null)
        setLoading(false)
        return
      }
      setCourse(c)
      const tp = c.courseTopics || []
      const idx = tp.findIndex((t: any) => String(t.id) === String(params.id))
      setTopics(tp)
      setCurrentIndex(idx)
      setTopic(idx >= 0 ? tp[idx] : null)
      setLoading(false)
    }
    loadData()
    window.addEventListener('dataChange', loadData)
    return () => window.removeEventListener('dataChange', loadData)
  }, [params.slug, params.id])

  if (!mounted) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading topic...</p>
        </div>
      </div>
    )
  }

  if (!course || !topic) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Topic Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The requested topic does not exist.</p>
          <Link href={`/courses/${params.slug}`} className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Back to Course
          </Link>
        </div>
      </div>
    )
  }

  const completedCount = topics.filter((t: any) => t.completed).length
  const progress = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0

  const markComplete = () => {
    if (currentIndex < 0) return
    const updated = topics.map((t: any, i: number) => i === currentIndex ? { ...t, completed: true } : t)
    setTopics(updated)
    setTopic({ ...topic, completed: true })
    courseStore.update(course.id, { courseTopics: updated })
    window.dispatchEvent(new Event('dataChange'))
  }

  const goPrev = () => {
    if (currentIndex > 0) {
      const prev = topics[currentIndex - 1]
      router.push(`/courses/${course.slug}/topics/${prev.id}`)
    }
  }

  const goNext = () => {
    if (currentIndex < topics.length - 1) {
      const next = topics[currentIndex + 1]
      router.push(`/courses/${course.slug}/topics/${next.id}`)
    } else {
      localStorage.setItem(`courseCompleted:${course.id}`, 'true')
      router.push(`/courses/${course.slug}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                <button onClick={() => router.push(`/courses/${course.slug}`)} className="hover:underline">{course.title}</button>
                <ChevronRight className="h-4 w-4 mx-2" />
                <span className="text-gray-900 dark:text-white font-medium">{topic.title}</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Course Progress</h2>
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Clock className="h-4 w-4 mr-1" />
              <span>{topic.duration} minutes</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-2">
            <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Topics</h3>
              <div className="space-y-2">
                {topics.map((t: any, i: number) => (
                  <button
                    key={t.id}
                    onClick={() => router.push(`/courses/${course.slug}/topics/${t.id}`)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                      i === currentIndex
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <span className="mr-2 truncate">{i + 1}. {t.title}</span>
                    {t.completed ? (
                      <CheckCircle className={`h-4 w-4 ${i === currentIndex ? 'text-white' : 'text-green-600'}`} />
                    ) : (
                      <Circle className={`h-4 w-4 ${i === currentIndex ? 'text-white' : 'text-gray-400'}`} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <main className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{topic.title}</h1>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{topic.duration} minutes</span>
                </div>
              </div>

              {topic.description && (
                <p className="text-gray-700 dark:text-gray-300 mb-4">{topic.description}</p>
              )}

              {topic.videoUrl && (
                <div className="mb-6">
                  <div className="aspect-w-16 aspect-h-9 bg-black rounded-lg overflow-hidden">
                    <iframe
                      src={topic.videoUrl}
                      title={topic.title}
                      className="w-full h-64"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              <div className="prose dark:prose-invert max-w-none">
                {topic.content ? (
                  <div>{topic.content}</div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Content Coming Soon</h3>
                    <p className="text-gray-600 dark:text-gray-400">This topic is being prepared. Check back later!</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={goPrev}
                  disabled={currentIndex <= 0}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${currentIndex <= 0 ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white'}`}
                >
                  <ChevronLeft className="h-4 w-4 inline mr-2" /> Previous
                </button>

                {!topic.completed ? (
                  <button
                    onClick={markComplete}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white"
                  >
                    Mark as Complete
                  </button>
                ) : (
                  <button
                    onClick={goNext}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {currentIndex < topics.length - 1 ? 'Next Topic' : 'Finish Course'}
                  </button>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}