'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trophy, Calendar, Users, Clock, Award, BookOpen } from 'lucide-react'
import { challengeStore } from '@/lib/data-store'

export default function ChallengesPage() {
  const router = useRouter()
  const [challenges, setChallenges] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    
    // Load published challenges from API
    const fetchChallenges = async () => {
      try {
        // Get user email from localStorage
        const userEmail = localStorage.getItem('userEmail')
        const emailParam = userEmail ? `?email=${encodeURIComponent(userEmail)}` : ''
        
        const response = await fetch(`/api/content/challenges${emailParam}`)
        if (response.ok) {
          const data = await response.json()
          // Filter to only show active challenges
          const activeChallenges = data.filter((c: any) => c.isActive)
          setChallenges(activeChallenges)
        }
      } catch (error) {
        console.error('Error fetching challenges:', error)
      }
    }
    
    fetchChallenges()
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
  
  // Simplified view - just show all challenges
  const activeChallenge = challenges
  const upcomingChallenges: any[] = []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Challenges & Contests
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Compete with developers worldwide and prove your skills
          </p>
        </div>

        {/* Active Challenges */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Active Now
          </h2>
          {activeChallenge.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeChallenge.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 dark:text-gray-400 mb-4">No active challenges available.</div>
            </div>
          )}
        </div>

        {/* Upcoming Challenges */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Upcoming Challenges
          </h2>
          {upcomingChallenges.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {upcomingChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 dark:text-gray-400 mb-4">No upcoming challenges available.</div>
            </div>
          )}
        </div>

        {/* Leaderboard Teaser - Only show if there are challenges */}
        {activeChallenge.length > 0 || upcomingChallenges.length > 0 ? (
        <div className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Check the Leaderboard</h2>
              <p className="opacity-90">See where you rank among the top coders</p>
            </div>
            <Link
              href="/leaderboard"
              className="px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
            >
              View Leaderboard
            </Link>
          </div>
        </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Challenges Coming Soon</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Check back later for new challenges!</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ChallengeCard({ challenge }: { challenge: any }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {challenge.title}
            </h3>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${
              challenge.difficulty === 'easy'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : challenge.difficulty === 'medium'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              {challenge.difficulty}
            </span>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Users className="h-4 w-4 mr-2" />
            <span>{challenge.participants || 0} participants</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Clock className="h-4 w-4 mr-2" />
            <span>Time Limit: {challenge.timeLimit || 'N/A'} minutes</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Award className="h-4 w-4 mr-2" />
            <span>Max Score: {challenge.maxScore}</span>
          </div>
          {challenge.category && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Category: {challenge.category}
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <Link
            href={`/challenges/${challenge.slug}`}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-center font-medium transition-colors"
          >
            View Challenge
          </Link>
          <Link
            href={`/challenges/${challenge.slug}`}
            className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-600 dark:hover:border-blue-400 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  )
}
