'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, BookOpen, Code, Trophy, TrendingUp, Activity, FileText, MessageSquare } from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()

  const [adminMetrics, setAdminMetrics] = useState({
    dailyActiveUsers: 0,
    avgSessionTime: '0 min',
    problemSolveRate: '0%'
  })
  
  useEffect(() => {
    // Check if user is admin
    const isAdmin = localStorage.getItem('isAdmin') === 'true'
    if (!isAdmin) {
      router.push('/admin/login')
    }
  }, [router])
  
  useEffect(() => {
    const fetchAdminMetrics = async () => {
      try {
        const response = await fetch('/api/content/admin/metrics')
        if (response.ok) {
          const data = await response.json()
          setAdminMetrics(data)
        }
      } catch (error) {
        console.error('Error fetching admin metrics:', error)
      }
    }
    
    fetchAdminMetrics()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('isAdmin')
    localStorage.removeItem('adminEmail')
    router.push('/admin/login')
  }
  // Mock data - TODO: Fetch from API
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalCourses: 0,
    totalProblems: 0,
    totalSubmissions: 0,
    activeChallenges: 0,
    pendingReports: 0,
    discussions: 0,
  })
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch homepage stats
        const homepageResponse = await fetch('/api/content/homepage-stats')
        if (homepageResponse.ok) {
          const homepageData = await homepageResponse.json()
          setStats((prev: any) => ({
            ...prev,
            totalCourses: homepageData.courses || 0,
            totalProblems: homepageData.problems || 0,
            activeChallenges: homepageData.challenges || 0,
            activeUsers: homepageData.active_learners || 0
          }))
        }
        
        // Fetch other stats
        const coursesResponse = await fetch('/api/content/courses')
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json()
          setStats((prev: any) => ({
            ...prev,
            totalCourses: coursesData.length || 0
          }))
        }
        
        const problemsResponse = await fetch('/api/content/problems')
        if (problemsResponse.ok) {
          const problemsData = await problemsResponse.json()
          setStats((prev: any) => ({
            ...prev,
            totalProblems: problemsData.length || 0
          }))
        }
        
        const challengesResponse = await fetch('/api/content/challenges')
        if (challengesResponse.ok) {
          const challengesData = await challengesResponse.json()
          setStats((prev: any) => ({
            ...prev,
            activeChallenges: challengesData.length || 0
          }))
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }
    
    fetchStats()
  }, [])

  const recentActivity: any[] = []

  const topPerformers: any[] = []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage and monitor the CodeGymnasium platform
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Users className="h-6 w-6" />}
            label="Total Users"
            value={stats.totalUsers.toLocaleString()}
            subValue={`${stats.activeUsers.toLocaleString()} active`}
            color="blue"
            link="/admin/users"
          />
          <StatCard
            icon={<BookOpen className="h-6 w-6" />}
            label="Courses"
            value={stats.totalCourses}
            subValue="Published courses"
            color="green"
            link="/admin/courses"
          />
          <StatCard
            icon={<Code className="h-6 w-6" />}
            label="Problems"
            value={stats.totalProblems}
            subValue="Coding challenges"
            color="purple"
            link="/admin/problems"
          />
          <StatCard
            icon={<Trophy className="h-6 w-6" />}
            label="Submissions"
            value={stats.totalSubmissions.toLocaleString()}
            subValue="Total submissions"
            color="yellow"
            link="/admin/problems"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/admin/courses/new"
            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all text-center"
          >
            <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <span className="font-medium text-gray-900 dark:text-white">Add Course</span>
          </Link>
          <Link
            href="/admin/problems/new"
            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all text-center"
          >
            <Code className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <span className="font-medium text-gray-900 dark:text-white">Add Problem</span>
          </Link>
          <Link
            href="/admin/reports"
            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all text-center relative"
          >
            <FileText className="h-8 w-8 mx-auto mb-2 text-red-600" />
            <span className="font-medium text-gray-900 dark:text-white">View Reports</span>
            {stats.pendingReports > 0 && (
              <span className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                {stats.pendingReports}
              </span>
            )}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Recent Activity
            </h2>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'user' ? 'bg-blue-500' :
                    activity.type === 'submission' ? 'bg-green-500' :
                    activity.type === 'course' ? 'bg-purple-500' :
                    activity.type === 'report' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">{activity.user}</span> - {activity.action}
                    </p>
                    {(activity as any).problem && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Problem: {(activity as any).problem}
                      </p>
                    )}
                    {(activity as any).course && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Course: {(activity as any).course}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Top Performers
            </h2>
            <div className="space-y-3">
              {topPerformers.map((user) => (
                <div
                  key={user.rank}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      user.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                      user.rank === 2 ? 'bg-gray-300 text-gray-900' :
                      user.rank === 3 ? 'bg-orange-400 text-orange-900' :
                      'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}>
                      {user.rank}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.username}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {user.problems} problems
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {user.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Platform Metrics */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Platform Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              label="Daily Active Users"
              value={adminMetrics.dailyActiveUsers}
              change="+0%"
              positive={true}
            />
            <MetricCard
              label="Avg. Session Time"
              value={adminMetrics.avgSessionTime}
              change="+0%"
              positive={true}
            />
            <MetricCard
              label="Problem Solve Rate"
              value={adminMetrics.problemSolveRate}
              change="+0%"
              positive={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, subValue, color, link }: {
  icon: React.ReactNode
  label: string
  value: string | number
  subValue: string
  color: string
  link: string
}) {
  const colors = {
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
    green: 'text-green-600 bg-green-100 dark:bg-green-900/20',
    purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
    yellow: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
  }

  return (
    <Link href={link} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-all">
      <div className={`inline-flex p-3 rounded-lg ${colors[color as keyof typeof colors]}`}>
        {icon}
      </div>
      <h3 className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-400">
        {label}
      </h3>
      <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {subValue}
      </p>
    </Link>
  )
}

function MetricCard({ label, value, change, positive }: {
  label: string
  value: string
  change: string
  positive: boolean
}) {
  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
        {label}
      </p>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
        <span className={`text-sm font-medium ${
          positive ? 'text-green-600' : 'text-red-600'
        }`}>
          {change}
        </span>
      </div>
    </div>
  )
}
