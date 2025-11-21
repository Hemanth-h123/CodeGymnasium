'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Edit, Trash2, Eye, Search, Filter, ToggleLeft, ToggleRight, ArrowLeft } from 'lucide-react'
import { courseStore } from '@/lib/data-store'

export default function AdminCoursesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [courses, setCourses] = useState(courseStore.getAll())

  useEffect(() => {
    // Check if user is admin
    const isAdmin = localStorage.getItem('isAdmin') === 'true'
    if (!isAdmin) {
      router.push('/admin/login')
      return
    }

    // Load courses and listen for changes
    const loadData = () => setCourses(courseStore.getAll())
    loadData()
    window.addEventListener('dataChange', loadData)
    return () => window.removeEventListener('dataChange', loadData)
  }, [router])

  const filteredCourses = courses.filter(course => {
    if (searchQuery && !course.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (statusFilter === 'published' && !course.isPublished) return false
    if (statusFilter === 'draft' && course.isPublished) return false
    return true
  })

  const handleDelete = (id: number, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      courseStore.delete(id)
      setCourses(courseStore.getAll())
    }
  }

  const handleTogglePublish = (id: number) => {
    courseStore.togglePublish(id)
    setCourses(courseStore.getAll())
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Course Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create and manage all courses
            </p>
          </div>
          <Link
            href="/admin/courses/new"
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add New Course</span>
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-4">
              <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Courses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Courses Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Topics
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Enrolled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {course.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Created: {new Date(course.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {course.category}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                        course.difficulty === 'beginner'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : course.difficulty === 'intermediate'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {course.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {course.topics}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {course.enrolled.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        course.isPublished
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {course.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleTogglePublish(course.id)}
                          className={`p-2 transition-colors ${
                            course.isPublished
                              ? 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300'
                              : 'text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400'
                          }`}
                          title={course.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          {course.isPublished ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                        </button>
                        <Link
                          href={`/courses/${course.slug}`}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/courses/${course.id}/edit`}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(course.id, course.title)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                No courses found
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
