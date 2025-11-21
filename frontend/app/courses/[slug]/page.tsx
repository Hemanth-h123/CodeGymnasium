'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Clock, Users, Star, CheckCircle, PlayCircle, BookOpen, ChevronRight, AlertCircle } from 'lucide-react'
import { courseStore, problemStore } from '@/lib/data-store'

export default function CourseDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const [enrolledTopics, setEnrolledTopics] = useState<number[]>([1, 2])
  const [course, setCourse] = useState<any>(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = () => {
      const loadedCourse = courseStore.getBySlug(params.slug)
      if (!loadedCourse) {
        setCourse(null)
        setLoading(false)
        return
      }
      setCourse(loadedCourse)
      const enrollments = JSON.parse(localStorage.getItem('enrollments') || '[]')
      setIsEnrolled(enrollments.includes(loadedCourse.id))
      setLoading(false)
    }
    loadData()
    window.addEventListener('dataChange', loadData)
    return () => window.removeEventListener('dataChange', loadData)
  }, [params.slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading course...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Course Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The course you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/courses"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Courses
          </Link>
        </div>
      </div>
    )
  }

  const topics = course.courseTopics || []
  const hasContent = topics.length > 0
  const completedTopics = topics.filter((t: any) => t.completed).length
  const progress = topics.length > 0 ? Math.round((completedTopics / topics.length) * 100) : 0
  const associatedProblems = (course.associatedProblems || [])
    .map((id: number) => problemStore.getById(id))
    .filter((p: any) => p && p.isPublished)
  

  const handleEnroll = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
    const isAdmin = localStorage.getItem('isAdmin') === 'true'
    
    if (!isLoggedIn && !isAdmin) {
      localStorage.setItem('redirectAfterLogin', `/courses/${params.slug}`)
      router.push('/login')
      return
    }
    
    const enrollments = JSON.parse(localStorage.getItem('enrollments') || '[]')
    if (!enrollments.includes(course.id)) {
      enrollments.push(course.id)
      localStorage.setItem('enrollments', JSON.stringify(enrollments))
      
      // Update course enrolled count
      courseStore.update(course.id, { enrolled: course.enrolled + 1 })
      setIsEnrolled(true)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            <div className="flex items-center space-x-2 mb-4">
              <Link href="/courses" className="hover:underline">Courses</Link>
              <ChevronRight className="h-4 w-4" />
              <span>{course.category}</span>
            </div>

            <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
            <p className="text-xl opacity-90 mb-6">{course.description}</p>

            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center">
                <Star className="h-5 w-5 mr-2 fill-yellow-400" />
                <span>{course.rating} rating</span>
              </div>
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                <span>{course.enrolled.toLocaleString()} students</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                <span>{course.duration} hours</span>
              </div>
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                <span>{course.topics.length} topics</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Progress */}
            {isEnrolled && hasContent && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Your Progress
                </h2>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    {completedTopics} of {topics.length} topics completed
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Course Content */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Course Content
              </h2>
              {hasContent ? (
                <div className="space-y-3">
                  {topics.map((topic: any, index: number) => (
                    <div
                      key={topic.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        topic.completed
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          {topic.completed ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          ) : (
                            <PlayCircle className="h-6 w-6 text-gray-400" />
                          )}
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {index + 1}. {topic.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {topic.duration} minutes
                            </p>
                          </div>
                        </div>
                        {isEnrolled && (
                          <Link
                            href={`/courses/${params.slug}/topics/${topic.id}`}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            {topic.completed ? 'Review' : 'Start'}
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Content Coming Soon
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Course content is being prepared. Check back later!
                  </p>
                </div>
              )}
            </div>

            {progress === 100 && (
              <div className="bg-green-600/10 border border-green-600 rounded-lg p-4 mb-6">
                <p className="text-green-700 dark:text-green-300 font-medium">Course completed! You can revisit any topic or restart.</p>
              </div>
            )}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Practice Problems
              </h2>
              {associatedProblems.length > 0 ? (
                <div className="space-y-3">
                  {associatedProblems.map((p: any) => (
                    <div key={p.id} className="p-4 rounded-lg border-2 transition-all border-gray-200 dark:border-gray-700 hover:border-blue-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {p.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {p.difficulty} • {p.category}
                          </p>
                        </div>
                        <Link href={`/problems/${p.slug}`} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                          Solve
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-600 dark:text-gray-400">No practice problems yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                About this course
              </h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Difficulty
                  </p>
                  <p className="text-gray-900 dark:text-white font-medium capitalize">
                    {course.difficulty}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Category
                  </p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {course.category}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Topics
                  </p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {topics.length} {topics.length === 1 ? 'topic' : 'topics'}
                  </p>
                </div>
              </div>

              {!isEnrolled ? (
                <button 
                  onClick={handleEnroll}
                  className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Enroll Now
                </button>
              ) : (
                <button className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                  Continue Learning
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
