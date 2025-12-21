'use client'

import { useState, useEffect } from 'react'
import { Trophy, Target, Flame, Award, Book, Code, Calendar, TrendingUp } from 'lucide-react'
import { getUserStats, getAchievementDetails } from '@/lib/user-stats'
import UserStatsDemo from '@/components/demo/UserStatsDemo'

export default function DashboardPage() {
  const [userStats, setUserStats] = useState({
    problemsSolved: 0,
    currentStreak: 0,
    totalScore: 0,
    rank: 0,
    recentActivity: [] as any[],
    achievements: [] as any[],
  })

  useEffect(() => {
    // Load initial stats
    const stats = getUserStats()
    const achievements = getAchievementDetails(stats.achievements)
    
    setUserStats({
      problemsSolved: stats.problemsSolved,
      currentStreak: stats.currentStreak,
      totalScore: stats.totalScore,
      rank: stats.rank,
      recentActivity: stats.recentActivity,
      achievements: achievements,
    })
    
    // Listen for stats updates
    const handleStatsUpdate = (event: CustomEvent) => {
      const stats = event.detail
      const achievements = getAchievementDetails(stats.achievements)
      
      setUserStats({
        problemsSolved: stats.problemsSolved,
        currentStreak: stats.currentStreak,
        totalScore: stats.totalScore,
        rank: stats.rank,
        recentActivity: stats.recentActivity,
        achievements: achievements,
      })
    }
    
    window.addEventListener('userStatsUpdated', handleStatsUpdate as EventListener)
    
    return () => {
      window.removeEventListener('userStatsUpdated', handleStatsUpdate as EventListener)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, Coder! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {userStats.currentStreak > 0 
              ? `Keep up the great work! You're on a ${userStats.currentStreak} day streak.`
              : 'Start your coding journey today!'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Code className="h-6 w-6" />}
            label="Problems Solved"
            value={userStats.problemsSolved}
            color="blue"
          />
          <StatCard
            icon={<Flame className="h-6 w-6" />}
            label="Current Streak"
            value={`${userStats.currentStreak} ${userStats.currentStreak === 1 ? 'day' : 'days'}`}
            color="orange"
          />
          <StatCard
            icon={<Trophy className="h-6 w-6" />}
            label="Total Score"
            value={userStats.totalScore.toLocaleString()}
            color="yellow"
          />
          <StatCard
            icon={<TrendingUp className="h-6 w-6" />}
            label="Global Rank"
            value={userStats.rank > 0 ? `#${userStats.rank}` : 'Unranked'}
            color="green"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Recent Activity
            </h2>
            <div className="space-y-4">
              {userStats.recentActivity.length > 0 ? (
                userStats.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.status === 'solved' ? 'bg-green-500' :
                        activity.status === 'in_progress' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {activity.type}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {activity.date}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No recent activity yet</p>
                  <p className="text-sm mt-2">Start solving problems to see activity here</p>
                </div>
              )}
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Achievements
            </h2>
            <div className="space-y-4">
              {userStats.achievements.length > 0 ? (
                userStats.achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {achievement.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {achievement.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No achievements yet</p>
                  <p className="text-sm mt-2">Complete challenges to earn achievements</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <QuickAction
            icon={<Code className="h-8 w-8" />}
            title="Solve a Problem"
            description="Practice coding challenges"
            href="/problems"
            color="blue"
          />
          <QuickAction
            icon={<Book className="h-8 w-8" />}
            title="Continue Learning"
            description="Resume your courses"
            href="/courses"
            color="green"
          />
          <QuickAction
            icon={<Trophy className="h-8 w-8" />}
            title="Join Challenge"
            description="Compete in contests"
            href="/challenges"
            color="purple"
          />
        </div>
      </div>
      
      {/* Demo Component - Remove in production */}
      <UserStatsDemo />
    </div>
  )
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
}) {
  const colors = {
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
    orange: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
    yellow: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
    green: 'text-green-600 bg-green-100 dark:bg-green-900/20',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className={`inline-flex p-3 rounded-lg ${colors[color as keyof typeof colors]}`}>
        {icon}
      </div>
      <h3 className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-400">
        {label}
      </h3>
      <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  )
}

function QuickAction({ icon, title, description, href, color }: {
  icon: React.ReactNode
  title: string
  description: string
  href: string
  color: string
}) {
  const colors = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
  }

  return (
    <a
      href={href}
      className={`block p-6 rounded-lg ${colors[color as keyof typeof colors]} text-white transition-all hover:shadow-lg`}
    >
      <div className="mb-3">{icon}</div>
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm opacity-90">{description}</p>
    </a>
  )
}
