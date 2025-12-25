'use client'

import Link from 'next/link'
import { Code2, BookOpen, Trophy, Users } from 'lucide-react'
import { useState, useEffect } from 'react'

interface HomepageStats {
  active_learners: number
  courses: number
  topics: number
  problems: number
}

export default function HomePage() {
  const [stats, setStats] = useState<HomepageStats>({
    active_learners: 0,
    courses: 0,
    topics: 0,
    problems: 0
  })
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/content/homepage-stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Error fetching homepage stats:', error)
      }
    }
    
    fetchStats()
  }, [])
  
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Welcome to <span className="text-blue-600">CodeGymnasium</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Master your coding skills through structured courses, practice problems, and competitive challenges
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/courses"
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Explore Courses
              </Link>
              <Link
                href="/problems"
                className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors font-semibold"
              >
                Practice Problems
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Why Choose CodeGymnasium?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<BookOpen className="w-12 h-12 text-blue-600" />}
              title="Structured Learning"
              description="Follow curated learning paths designed by industry experts"
            />
            <FeatureCard
              icon={<Code2 className="w-12 h-12 text-blue-600" />}
              title="Hands-on Practice"
              description="Practice with 1000+ coding problems with instant feedback"
            />
            <FeatureCard
              icon={<Trophy className="w-12 h-12 text-blue-600" />}
              title="Competitive Challenges"
              description="Participate in daily, weekly, and monthly coding contests"
            />
            <FeatureCard
              icon={<Users className="w-12 h-12 text-blue-600" />}
              title="Active Community"
              description="Learn together with thousands of developers worldwide"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <StatCard number={stats.active_learners.toLocaleString() + '+'} label="Active Learners" />
            <StatCard number={stats.courses.toLocaleString() + '+'} label="Courses" />
            <StatCard number={stats.topics.toLocaleString() + '+'} label="Topics" />
            <StatCard number={stats.problems.toLocaleString() + '+'} label="Practice Problems" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Level Up Your Skills?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of developers learning and growing together
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
          >
            Get Started for Free
          </Link>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="text-center p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  )
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{number}</div>
      <div className="text-gray-600 dark:text-gray-400">{label}</div>
    </div>
  )
}
