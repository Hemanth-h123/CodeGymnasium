'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { MessageSquare, ThumbsUp, Eye, Clock, Reply } from 'lucide-react'

interface Discussion {
  id: string
  title: string
  content: string
  author: string
  category: string
  tags: string[]
  views: number
  replies: number
  likes: number
  createdAt: string
}

interface Comment {
  id: string
  content: string
  author: string
  likes: number
  createdAt: string
  replies?: Comment[]
}

export default function DiscussionDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [discussion, setDiscussion] = useState<Discussion | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [commentLoading, setCommentLoading] = useState(false)

  useEffect(() => {
    if (id) {
      fetchDiscussion()
      fetchComments()
    }
  }, [id])

  const fetchDiscussion = async () => {
    try {
      const response = await fetch(`/api/content/discussions/${id}`)
      if (response.ok) {
        const data = await response.json()
        setDiscussion(data)
      } else {
        // If API is not available, use mock data
        setDiscussion({
          id: '1',
          title: 'Sample Discussion',
          content: 'This is a sample discussion content.',
          author: 'sample_user',
          category: 'General',
          tags: ['sample', 'discussion'],
          views: 10,
          replies: 2,
          likes: 3,
          createdAt: '2023-01-01T00:00:00Z'
        })
      }
    } catch (error) {
      console.error('Error fetching discussion:', error)
    }
  }

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/content/discussions/${id}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      } else {
        // If API is not available, use mock data
        setComments([
          {
            id: '1',
            content: 'This is a sample comment.',
            author: 'commenter1',
            likes: 1,
            createdAt: '2023-01-01T00:00:00Z'
          },
          {
            id: '2',
            content: 'Another sample comment.',
            author: 'commenter2',
            likes: 0,
            createdAt: '2023-01-01T00:00:00Z'
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
      // Use mock data if API fails
      setComments([
        {
          id: '1',
          content: 'This is a sample comment.',
          author: 'commenter1',
          likes: 1,
          createdAt: '2023-01-01T00:00:00Z'
        },
        {
          id: '2',
          content: 'Another sample comment.',
          author: 'commenter2',
          likes: 0,
          createdAt: '2023-01-01T00:00:00Z'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setCommentLoading(true)

    try {
      // Get user info from localStorage (in a real app, this would come from auth context)
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      
      const commentData = {
        content: newComment,
        userId: user.id || '12345',
        author: user.username || 'Anonymous',
        createdAt: new Date().toISOString()
      }

      // Send to API
      const response = await fetch(`/api/content/discussions/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData),
      })

      if (response.ok) {
        const newCommentObj = await response.json()
        setComments([...comments, newCommentObj])
        setNewComment('')
        
        // Update discussion reply count
        if (discussion) {
          setDiscussion({
            ...discussion,
            replies: discussion.replies + 1
          })
        }
      } else {
        // Fallback to local state if API fails
        const fallbackComment: Comment = {
          id: (comments.length + 1).toString(),
          ...commentData,
          likes: 0
        }
        setComments([...comments, fallbackComment])
        setNewComment('')
        
        // Update discussion reply count
        if (discussion) {
          setDiscussion({
            ...discussion,
            replies: discussion.replies + 1
          })
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      // Fallback to local state if API fails
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const fallbackComment: Comment = {
        id: (comments.length + 1).toString(),
        content: newComment,
        author: user.username || 'Anonymous',
        likes: 0,
        createdAt: new Date().toISOString()
      }
      setComments([...comments, fallbackComment])
      setNewComment('')
      
      // Update discussion reply count
      if (discussion) {
        setDiscussion({
          ...discussion,
          replies: discussion.replies + 1
        })
      }
    } finally {
      setCommentLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center py-12">
            <div className="text-gray-600 dark:text-gray-400">Loading discussion...</div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!discussion) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center py-12">
            <div className="text-gray-600 dark:text-gray-400">Discussion not found.</div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => router.push('/discussions')}
            className="flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-6"
          >
            ← Back to Discussions
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {discussion.title}
                </h1>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {discussion.author}
                  </span>
                  <div className="flex items-center space-x-1 mx-2">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(discussion.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full text-sm font-medium">
                {discussion.category}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {discussion.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="prose prose-gray dark:prose-invert max-w-none mb-6">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {discussion.content}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-6 text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{discussion.views} views</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{discussion.replies} replies</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{discussion.likes} likes</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {discussion.replies} {discussion.replies === 1 ? 'Reply' : 'Replies'}
            </h2>

            <div className="space-y-4 mb-6">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-8 w-8 flex items-center justify-center mr-2">
                          <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                            {comment.author.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white text-sm">
                            {comment.author}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <ThumbsUp className="h-4 w-4" />
                        <span className="text-sm">{comment.likes}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      {comment.content}
                    </p>
                    <div className="mt-2">
                      <button className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        <Reply className="h-4 w-4 mr-1" />
                        Reply
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500 dark:text-gray-400">No replies yet. Be the first to reply!</p>
                </div>
              )}
            </div>

            <form onSubmit={handleAddComment}>
              <div className="mb-4">
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Add a reply
                </label>
                <textarea
                  id="comment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Write your reply here..."
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={commentLoading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {commentLoading ? 'Posting...' : 'Post Reply'}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
