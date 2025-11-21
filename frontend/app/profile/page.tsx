'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, Calendar, Award, Code, Trophy, TrendingUp, Edit2, Save } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    bio: '',
    location: '',
    website: '',
    github: '',
  })

  useEffect(() => {
    // Check if user is logged in or admin
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
    const isAdmin = localStorage.getItem('isAdmin') === 'true'
    if (!isLoggedIn && !isAdmin) {
      router.push('/login')
      return
    }

    // Load user data
    const userName = localStorage.getItem('userName') || localStorage.getItem('adminEmail')?.split('@')[0] || 'User'
    const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('adminEmail') || 'user@example.com'
    
    setUserData({
      username: userName,
      email: userEmail,
      bio: 'Passionate coder and problem solver',
      location: 'San Francisco, CA',
      website: 'https://example.com',
      github: 'github.com/user',
    })
  }, [router])

  const handleSave = () => {
    // TODO: Save to API
    localStorage.setItem('userName', userData.username)
    setIsEditing(false)
  }

  // Mock stats
  const stats = {
    problemsSolved: 127,
    currentStreak: 15,
    totalScore: 4523,
    rank: 'Gold',
    joinedDate: 'January 2024',
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="h-12 w-12 text-white" />
              </div>
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    value={userData.username}
                    onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                    className="text-3xl font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded"
                  />
                ) : (
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {userData.username}
                  </h1>
                )}
                <p className="text-gray-600 dark:text-gray-400 flex items-center mt-2">
                  <Mail className="h-4 w-4 mr-2" />
                  {userData.email}
                </p>
                <p className="text-gray-600 dark:text-gray-400 flex items-center mt-1">
                  <Calendar className="h-4 w-4 mr-2" />
                  Joined {stats.joinedDate}
                </p>
              </div>
            </div>
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {isEditing ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              ) : (
                <>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Profile
                </>
              )}
            </button>
          </div>

          {/* Bio Section */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Bio</h3>
            {isEditing ? (
              <textarea
                value={userData.bio}
                onChange={(e) => setUserData({ ...userData, bio: e.target.value })}
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded"
                rows={3}
              />
            ) : (
              <p className="text-gray-600 dark:text-gray-400">{userData.bio}</p>
            )}
          </div>

          {/* Additional Info */}
          {isEditing && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={userData.location}
                  onChange={(e) => setUserData({ ...userData, location: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Website
                </label>
                <input
                  type="text"
                  value={userData.website}
                  onChange={(e) => setUserData({ ...userData, website: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded"
                />
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Problems Solved</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.problemsSolved}
                </p>
              </div>
              <Code className="h-10 w-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Current Streak</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.currentStreak}
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Total Score</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.totalScore.toLocaleString()}
                </p>
              </div>
              <Trophy className="h-10 w-10 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Rank</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.rank}
                </p>
              </div>
              <Award className="h-10 w-10 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {[
              { action: 'Solved', item: 'Two Sum', difficulty: 'Easy', time: '2 hours ago' },
              { action: 'Attempted', item: 'Merge K Sorted Lists', difficulty: 'Hard', time: '5 hours ago' },
              { action: 'Solved', item: 'Binary Tree Level Order', difficulty: 'Medium', time: '1 day ago' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b dark:border-gray-700 last:border-0">
                <div className="flex items-center space-x-4">
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${
                    activity.difficulty === 'Easy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    activity.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {activity.difficulty}
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white">
                      <span className="font-semibold">{activity.action}</span> - {activity.item}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
