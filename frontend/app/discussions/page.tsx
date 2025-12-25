'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare, ThumbsUp, Eye, Clock } from 'lucide-react'

export default function DiscussionsPage() {
  const router = useRouter()
  const [discussions, setDiscussions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch discussions from API
    const fetchDiscussions = async () => {
      try {
        const response = await fetch('/api/content/discussions')
        if (response.ok) {
          const data = await response.json()
          setDiscussions(data)
        } else {
          // If API is not available, use empty array
          setDiscussions([])
        }
      } catch (error) {
        console.error('Error fetching discussions:', error)
        setDiscussions([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchDiscussions()
  }, [])

  const handleNewDiscussion = () => {
    router.push('/discussions/new')
  }

  const [categories, setCategories] = useState([
    { name: 'All', count: 0 },
    { name: 'Algorithms', count: 0 },
    { name: 'Data Structures', count: 0 },
    { name: 'Challenges', count: 0 },
    { name: 'Learning', count: 0 },
    { name: 'Career', count: 0 }
  ])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/content/discussion-categories')
        if (response.ok) {
          const data = await response.json()
          // Update categories with actual counts
          const updatedCategories = [
            { name: 'All', count: data.reduce((sum: number, cat: any) => sum + cat.count, 0) },
            ...data.map((cat: any) => ({ name: cat.category, count: cat.count }))
          ]
          setCategories(updatedCategories)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setCategoriesLoading(false)
      }
    }
    
    fetchCategories()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Discussions
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Share knowledge and learn from the community
            </p>
          </div>
          <button 
            onClick={handleNewDiscussion}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            New Discussion
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-24">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Categories</h3>
              <div className="space-y-2">
                {categoriesLoading ? (
                  // Show loading placeholders
                  Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="w-full flex items-center justify-between px-3 py-2 rounded-lg">
                      <span className="text-gray-700 dark:text-gray-300 animate-pulse">Loading...</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">0</span>
                    </div>
                  ))
                ) : (
                  categories.map((category) => (
                    <button
                      key={category.name}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition-colors"
                    >
                      <span className="text-gray-700 dark:text-gray-300">{category.name}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{category.count}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Discussions List */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="text-gray-600 dark:text-gray-400">Loading discussions...</div>
                </div>
              ) : discussions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-500 dark:text-gray-400 mb-4">No discussions yet. Be the first to start a discussion!</div>
                </div>
              ) : (
                discussions.map((discussion) => (
                  <Link key={discussion.id} href={`/discussions/${discussion.id}`}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all p-6 cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400">
                            {discussion.title}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {discussion.tags?.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full text-xs font-medium">
                          {discussion.category}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-4">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {discussion.author}
                          </span>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{discussion.createdAt}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Eye className="h-4 w-4" />
                            <span>{discussion.views}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>{discussion.replies}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{discussion.likes}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
