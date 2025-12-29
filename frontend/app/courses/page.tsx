'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Clock, Users, Star, Filter } from 'lucide-react'
import { courseStore, enrollmentStore } from '@/lib/data-store'

export default function CoursesPage() {
  const router = useRouter()
  const [filter, setFilter] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [courses, setCourses] = useState<any[]>([])
  const [enrolledIds, setEnrolledIds] = useState<number[]>([])

  useEffect(() => {
    setMounted(true)
    // Check if user is logged in or admin
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true' || localStorage.getItem('isAdmin') === 'true'
    setIsLoggedIn(loggedIn)

    // Load courses and enrollments
    const fetchCourses = async () => {
      try {
        // Get user email from localStorage
        const userEmail = localStorage.getItem('userEmail')
        const emailParam = userEmail ? `?email=${encodeURIComponent(userEmail)}` : ''
        
        const response = await fetch(`/api/content/courses${emailParam}`)
        if (response.ok) {
          const data = await response.json()
          // Filter to only show published courses
          const publishedCourses = data.filter((c: any) => c.isPublished)
          setCourses(publishedCourses)
        }
      } catch (error) {
        console.error('Error fetching courses:', error)
      }
      
      if (loggedIn) {
        const enrollments = JSON.parse(localStorage.getItem('enrollments') || '[]')
        setEnrolledIds(enrollments)
      }
    }
    
    fetchCourses()
  }, [isLoggedIn])

  const handleEnroll = (courseSlug: string, courseId: number, isEnrolled: boolean) => {
    if (!isLoggedIn) {
      // Save intended destination
      localStorage.setItem('redirectAfterLogin', `/courses/${courseSlug}`)
      router.push('/login')
      return
    }
    // If already logged in (or admin) and not enrolled, enroll
    if (!isEnrolled) {
      enrollmentStore.enroll(courseId)
      const enrollments = JSON.parse(localStorage.getItem('enrollments') || '[]')
      setEnrolledIds(enrollments)
    }
    // Navigate to course
    router.push(`/courses/${courseSlug}`)
  }

  const filteredCourses = courses
    .map(course => ({
      ...course,
      isEnrolled: enrolledIds.includes(course.id)
    }))
    .filter(course => {
      if (filter !== 'all' && course.category !== filter) return false
      if (difficulty !== 'all' && course.difficulty !== difficulty) return false
      return true
    })

  const categories = ['all', 'Data Structures', 'Algorithms', 'Web Development', 'System Design', 'Programming']

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" suppressHydrationWarning>
      {!mounted ? null : (
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Explore Courses
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Master new skills with our structured learning paths
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="flex items-center mb-4">
            <Filter className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {cat === 'all' ? 'All' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty
              </label>
              <div className="flex flex-wrap gap-2">
                {['all', 'beginner', 'intermediate', 'advanced'].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                      difficulty === diff
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} onEnroll={handleEnroll} isLoggedIn={isLoggedIn} />
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No courses found matching your filters
            </p>
          </div>
        )}
      </div>
      )}
    </div>
  )
}

function CourseCard({ course, onEnroll, isLoggedIn }: { course: any; onEnroll: (slug: string, courseId: number, isEnrolled: boolean) => void; isLoggedIn: boolean }) {
  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    advanced: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onEnroll(course.slug, course.id, course.isEnrolled)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all cursor-pointer h-full flex flex-col">
      <Link href={isLoggedIn ? `/courses/${course.slug}` : '#'} className="flex-1">
        <div className="p-6 flex-1">
          <div className="text-5xl mb-4 flex items-center justify-center">
            {course.thumbnail?.startsWith('data:image') ? (
              <img 
                src={course.thumbnail} 
                alt={course.title}
                className="w-20 h-20 object-cover rounded-lg"
              />
            ) : (
              <span>{course.thumbnail || '📚'}</span>
            )}
          </div>
          
          <div className="flex items-center justify-between mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${difficultyColors[course.difficulty as keyof typeof difficultyColors]}`}>
              {course.difficulty}
            </span>
            {isLoggedIn && course.isEnrolled && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                Enrolled
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {course.title}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            {course.description}
          </p>

          {isLoggedIn && course.isEnrolled && course.progress > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Progress</span>
                <span className="font-medium text-gray-900 dark:text-white">{course.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${course.progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>{course.duration}h</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>{course.enrolled.toLocaleString()}</span>
            </div>
            <div className="flex items-center">
              <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
              <span>{course.rating}</span>
            </div>
          </div>
        </div>
      </Link>

      <div className="p-6 pt-0">
        <button 
          onClick={handleClick}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            isLoggedIn && course.isEnrolled
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}>
          {isLoggedIn ? (course.isEnrolled ? 'Continue Learning' : 'Enroll Now') : 'Login to Enroll'}
        </button>
      </div>
    </div>
  )
}
