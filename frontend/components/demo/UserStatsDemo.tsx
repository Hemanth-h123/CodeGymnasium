'use client'

import { useState } from 'react'
import { recordProblemSolved, recordCourseProgress, recordChallengeParticipation, resetUserStats } from '@/lib/user-stats'

export default function UserStatsDemo() {
  const [problemTitle, setProblemTitle] = useState('Two Sum')
  const [courseTitle, setCourseTitle] = useState('Data Structures Fundamentals')
  const [challengeTitle, setChallengeTitle] = useState('Weekly Coding Challenge')
  
  const handleSolveProblem = () => {
    recordProblemSolved(problemTitle, 100)
    alert(`Problem "${problemTitle}" solved! +100 points`)
  }
  
  const handleCourseProgress = () => {
    recordCourseProgress(courseTitle)
    alert(`Progress recorded for course "${courseTitle}"`)
  }
  
  const handleChallengeParticipation = () => {
    recordChallengeParticipation(challengeTitle)
    alert(`Participation recorded for challenge "${challengeTitle}"`)
  }
  
  const handleResetStats = () => {
    if (confirm('Are you sure you want to reset all your stats?')) {
      resetUserStats()
      alert('Stats reset successfully!')
    }
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">User Stats Demo</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Problem Title
          </label>
          <input
            type="text"
            value={problemTitle}
            onChange={(e) => setProblemTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={handleSolveProblem}
            className="mt-2 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Solve Problem (+100 pts)
          </button>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Course Title
          </label>
          <input
            type="text"
            value={courseTitle}
            onChange={(e) => setCourseTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={handleCourseProgress}
            className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Record Course Progress
          </button>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Challenge Title
          </label>
          <input
            type="text"
            value={challengeTitle}
            onChange={(e) => setChallengeTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={handleChallengeParticipation}
            className="mt-2 w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Participate in Challenge
          </button>
        </div>
      </div>
      
      <div className="flex space-x-3">
        <button
          onClick={handleResetStats}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Reset Stats
        </button>
      </div>
      
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p><strong>How it works:</strong> Click the buttons above to simulate user actions. The dashboard and profile pages will automatically update to reflect your progress.</p>
      </div>
    </div>
  )
}
