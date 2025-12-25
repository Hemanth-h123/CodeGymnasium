'use client'

import { useState, useEffect } from 'react'

interface LeaderboardUser {
  id: string
  username: string
  fullName: string
  totalScore: number
  problemsSolved: number
  currentStreak: number
  joinedAt: string
}

export default function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('all')
  const [activeTab, setActiveTab] = useState<'overall' | 'problems' | 'streak'>('overall')

  useEffect(() => {
    fetchLeaderboard()
  }, [period])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/content/leaderboard/${period}`)
      if (response.ok) {
        const data = await response.json()
        setLeaderboardData(data)
      } else {
        // Fallback to overall leaderboard if period-specific fails
        const fallbackResponse = await fetch('/api/content/leaderboard')
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json()
          setLeaderboardData(data)
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      // Fallback to mock data if API fails
      setLeaderboardData(mockLeaderboardData)
    } finally {
      setLoading(false)
    }
  }

  // Mock data for fallback
  const mockLeaderboardData: LeaderboardUser[] = [
    {
      id: '1',
      username: 'codemaster',
      fullName: 'Alex Johnson',
      totalScore: 2450,
      problemsSolved: 128,
      currentStreak: 24,
      joinedAt: '2023-01-15'
    },
    {
      id: '2',
      username: 'dev_guru',
      fullName: 'Sarah Chen',
      totalScore: 2320,
      problemsSolved: 115,
      currentStreak: 18,
      joinedAt: '2023-02-20'
    },
    {
      id: '3',
      username: 'js_ninja',
      fullName: 'Michael Rodriguez',
      totalScore: 2180,
      problemsSolved: 105,
      currentStreak: 32,
      joinedAt: '2023-03-10'
    },
    {
      id: '4',
      username: 'python_pro',
      fullName: 'Emily Watson',
      totalScore: 1950,
      problemsSolved: 98,
      currentStreak: 15,
      joinedAt: '2023-01-30'
    },
    {
      id: '5',
      username: 'react_king',
      fullName: 'David Kim',
      totalScore: 1870,
      problemsSolved: 89,
      currentStreak: 12,
      joinedAt: '2023-04-05'
    }
  ]

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  const formatJoinedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    })
  }

  const getSortedData = () => {
    if (activeTab === 'overall') {
      return [...leaderboardData].sort((a, b) => b.totalScore - a.totalScore)
    } else if (activeTab === 'problems') {
      return [...leaderboardData].sort((a, b) => b.problemsSolved - a.problemsSolved)
    } else {
      return [...leaderboardData].sort((a, b) => b.currentStreak - a.currentStreak)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Leaderboard
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              See how you rank against other developers
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                <div className="flex space-x-2">
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      period === 'daily'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => setPeriod('daily')}
                  >
                    Daily
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      period === 'weekly'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => setPeriod('weekly')}
                  >
                    Weekly
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      period === 'monthly'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => setPeriod('monthly')}
                  >
                    Monthly
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      period === 'all'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => setPeriod('all')}
                  >
                    All Time
                  </button>
                </div>

                <div className="flex space-x-2">
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      activeTab === 'overall'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => setActiveTab('overall')}
                  >
                    Overall Score
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      activeTab === 'problems'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => setActiveTab('problems')}
                  >
                    Problems Solved
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      activeTab === 'streak'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => setActiveTab('streak')}
                  >
                    Streak
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                          Rank
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                          User
                        </th>
                        {activeTab === 'overall' && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                            Score
                          </th>
                        )}
                        {activeTab === 'problems' && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                            Problems
                          </th>
                        )}
                        {activeTab === 'streak' && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                            Streak
                          </th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {getSortedData().map((user, index) => (
                        <tr key={user.id} className={index < 3 ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-lg">{getRankIcon(index + 1)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-10 w-10 flex items-center justify-center">
                                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                                    {user.username.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {user.fullName || user.username}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  @{user.username}
                                </div>
                              </div>
                            </div>
                          </td>
                          {activeTab === 'overall' && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white font-semibold">
                                {user.totalScore.toLocaleString()}
                              </div>
                            </td>
                          )}
                          {activeTab === 'problems' && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white font-semibold">
                                {user.problemsSolved}
                              </div>
                            </td>
                          )}
                          {activeTab === 'streak' && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white font-semibold">
                                {user.currentStreak} days
                              </div>
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatJoinedDate(user.joinedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {leaderboardData.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="text-gray-500 dark:text-gray-400">No leaderboard data available.</div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">How It Works</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Earn points by solving coding challenges</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Complete courses to boost your score</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Maintain streaks for bonus points</span>
                </li>
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ranking Factors</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Difficulty of problems solved</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Number of problems completed</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Consistency and streak maintenance</span>
                </li>
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Achievement Tiers</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span>Gold: Top 10% of users</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>Silver: Top 25% of users</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-700 mr-2">•</span>
                  <span>Bronze: Top 50% of users</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
