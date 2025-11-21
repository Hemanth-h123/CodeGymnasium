'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare, ThumbsUp, Eye, Clock } from 'lucide-react'

export default function DiscussionsPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
    if (!isLoggedIn) {
      router.push('/login')
    }
  }, [router])
  
  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-gray-600 dark:text-gray-400">Loading...</div>
          </div>
        </div>
      </div>
    )
  }
  // Mock data - TODO: Fetch from API
  const discussions = [
    {
      id: 1,
      title: 'How to optimize Two Sum solution?',
      author: 'john_doe',
      category: 'Algorithms',
      views: 342,
      replies: 15,
      likes: 28,
      createdAt: '2 hours ago',
      tags: ['array', 'hash-table', 'optimization']
    },
    {
      id: 2,
      title: 'Best resources for learning Dynamic Programming',
      author: 'alice_smith',
      category: 'Learning',
      views: 856,
      replies: 42,
      likes: 67,
      createdAt: '5 hours ago',
      tags: ['dynamic-programming', 'resources', 'learning']
    },
    {
      id: 3,
      title: 'Weekly Contest #125 Discussion',
      author: 'contest_admin',
      category: 'Challenges',
      views: 1234,
      replies: 89,
      likes: 145,
      createdAt: '1 day ago',
      tags: ['contest', 'weekly', 'discussion']
    },
    {
      id: 4,
      title: 'Alternative approach to Binary Tree Traversal',
      author: 'tech_guru',
      category: 'Data Structures',
      views: 523,
      replies: 23,
      likes: 41,
      createdAt: '1 day ago',
      tags: ['trees', 'traversal', 'algorithms']
    },
    {
      id: 5,
      title: 'Tips for System Design Interview',
      author: 'senior_dev',
      category: 'Career',
      views: 2341,
      replies: 156,
      likes: 398,
      createdAt: '3 days ago',
      tags: ['system-design', 'interview', 'career']
    }
  ]

  const categories = [
    { name: 'All', count: 2456 },
    { name: 'Algorithms', count: 832 },
    { name: 'Data Structures', count: 654 },
    { name: 'Challenges', count: 423 },
    { name: 'Learning', count: 347 },
    { name: 'Career', count: 200 }
  ]

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
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            New Discussion
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-24">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.name}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition-colors"
                  >
                    <span className="text-gray-700 dark:text-gray-300">{category.name}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{category.count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Discussions List */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {discussions.map((discussion) => (
                <Link key={discussion.id} href={`/discussions/${discussion.id}`}>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all p-6 cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400">
                          {discussion.title}
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {discussion.tags.map((tag) => (
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
