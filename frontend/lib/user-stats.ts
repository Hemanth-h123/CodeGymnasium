// User statistics tracking system
// This module manages user progress, achievements, and performance metrics

export interface UserStats {
  problemsSolved: number
  currentStreak: number
  totalScore: number
  rank: number
  lastActiveDate: string | null
  achievements: string[]
  recentActivity: UserActivity[]
}

export interface UserActivity {
  id: string
  type: 'problem' | 'course' | 'challenge'
  title: string
  status: 'solved' | 'in_progress' | 'completed' | 'participated'
  date: string
  points?: number
}

// Initialize user stats
export const initializeUserStats = (): UserStats => {
  // Check if stats exist in localStorage
  const storedStats = localStorage.getItem('userStats')
  if (storedStats) {
    try {
      return JSON.parse(storedStats)
    } catch {
      // If parsing fails, initialize fresh stats
    }
  }
  
  // Default initial stats
  const initialStats: UserStats = {
    problemsSolved: 0,
    currentStreak: 0,
    totalScore: 0,
    rank: 0,
    lastActiveDate: null,
    achievements: [],
    recentActivity: []
  }
  
  // Save to localStorage
  localStorage.setItem('userStats', JSON.stringify(initialStats))
  return initialStats
}

// Get current user stats
export const getUserStats = (): UserStats => {
  return initializeUserStats()
}

// Update user stats when a problem is solved
export const recordProblemSolved = (problemTitle: string, points: number = 100): void => {
  const stats = getUserStats()
  
  // Update stats
  stats.problemsSolved += 1
  stats.totalScore += points
  
  // Update streak
  const today = new Date().toISOString().split('T')[0]
  if (stats.lastActiveDate) {
    const lastActive = new Date(stats.lastActiveDate)
    const todayDate = new Date(today)
    const diffDays = Math.floor((todayDate.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) {
      // Consecutive day - increment streak
      stats.currentStreak += 1
    } else if (diffDays > 1) {
      // Break in streak - reset to 1
      stats.currentStreak = 1
    }
    // If diffDays is 0 (same day), don't change streak
  } else {
    // First activity - start streak
    stats.currentStreak = 1
  }
  
  stats.lastActiveDate = today
  
  // Add to recent activity
  stats.recentActivity.unshift({
    id: `problem-${Date.now()}`,
    type: 'problem',
    title: problemTitle,
    status: 'solved',
    date: 'Just now',
    points
  })
  
  // Keep only the last 10 activities
  if (stats.recentActivity.length > 10) {
    stats.recentActivity = stats.recentActivity.slice(0, 10)
  }
  
  // Check for achievements
  checkAchievements(stats)
  
  // Update rank based on score
  updateRank(stats)
  
  // Save updated stats
  localStorage.setItem('userStats', JSON.stringify(stats))
  
  // Dispatch event to notify UI of changes
  window.dispatchEvent(new CustomEvent('userStatsUpdated', { detail: stats }))
}

// Record course progress
export const recordCourseProgress = (courseTitle: string): void => {
  const stats = getUserStats()
  
  // Add to recent activity
  stats.recentActivity.unshift({
    id: `course-${Date.now()}`,
    type: 'course',
    title: courseTitle,
    status: 'in_progress',
    date: 'Just now'
  })
  
  // Keep only the last 10 activities
  if (stats.recentActivity.length > 10) {
    stats.recentActivity = stats.recentActivity.slice(0, 10)
  }
  
  // Save updated stats
  localStorage.setItem('userStats', JSON.stringify(stats))
  
  // Dispatch event to notify UI of changes
  window.dispatchEvent(new CustomEvent('userStatsUpdated', { detail: stats }))
}

// Record challenge participation
export const recordChallengeParticipation = (challengeTitle: string): void => {
  const stats = getUserStats()
  
  // Add to recent activity
  stats.recentActivity.unshift({
    id: `challenge-${Date.now()}`,
    type: 'challenge',
    title: challengeTitle,
    status: 'participated',
    date: 'Just now'
  })
  
  // Keep only the last 10 activities
  if (stats.recentActivity.length > 10) {
    stats.recentActivity = stats.recentActivity.slice(0, 10)
  }
  
  // Save updated stats
  localStorage.setItem('userStats', JSON.stringify(stats))
  
  // Dispatch event to notify UI of changes
  window.dispatchEvent(new CustomEvent('userStatsUpdated', { detail: stats }))
}

// Check for achievements
const checkAchievements = (stats: UserStats): void => {
  // First problem solved
  if (stats.problemsSolved >= 1 && !stats.achievements.includes('first-problem')) {
    stats.achievements.push('first-problem')
  }
  
  // 5 problems solved
  if (stats.problemsSolved >= 5 && !stats.achievements.includes('five-problems')) {
    stats.achievements.push('five-problems')
  }
  
  // 10 problems solved
  if (stats.problemsSolved >= 10 && !stats.achievements.includes('ten-problems')) {
    stats.achievements.push('ten-problems')
  }
  
  // 3 day streak
  if (stats.currentStreak >= 3 && !stats.achievements.includes('three-day-streak')) {
    stats.achievements.push('three-day-streak')
  }
  
  // 7 day streak
  if (stats.currentStreak >= 7 && !stats.achievements.includes('seven-day-streak')) {
    stats.achievements.push('seven-day-streak')
  }
  
  // 1000 points
  if (stats.totalScore >= 1000 && !stats.achievements.includes('thousand-points')) {
    stats.achievements.push('thousand-points')
  }
}

// Update rank based on total score
const updateRank = (stats: UserStats): void => {
  if (stats.totalScore >= 5000) {
    stats.rank = 1 // Master
  } else if (stats.totalScore >= 3000) {
    stats.rank = 10 // Expert
  } else if (stats.totalScore >= 1500) {
    stats.rank = 50 // Advanced
  } else if (stats.totalScore >= 500) {
    stats.rank = 100 // Intermediate
  } else if (stats.totalScore >= 100) {
    stats.rank = 200 // Beginner
  } else {
    stats.rank = 500 // Newbie
  }
}

// Get achievements with details
export const getAchievementDetails = (achievementKeys: string[]): Array<{id: string, name: string, icon: string, desc: string}> => {
  const achievementMap: Record<string, {name: string, icon: string, desc: string}> = {
    'first-problem': {
      name: 'First Steps',
      icon: '🎯',
      desc: 'Solved first problem'
    },
    'five-problems': {
      name: 'Problem Solver',
      icon: '⭐',
      desc: 'Solved 5 problems'
    },
    'ten-problems': {
      name: 'Code Warrior',
      icon: '⚔️',
      desc: 'Solved 10 problems'
    },
    'three-day-streak': {
      name: 'Consistent Learner',
      icon: '📅',
      desc: '3 day streak'
    },
    'seven-day-streak': {
      name: 'Week Warrior',
      icon: '🔥',
      desc: '7 day streak'
    },
    'thousand-points': {
      name: 'Point Collector',
      icon: '💎',
      desc: 'Earned 1000 points'
    }
  }
  
  return achievementKeys.map(key => ({
    id: key,
    ...achievementMap[key]
  })).filter(a => a.name) // Filter out any undefined achievements
}

// Reset user stats (for testing purposes)
export const resetUserStats = (): void => {
  const resetStats: UserStats = {
    problemsSolved: 0,
    currentStreak: 0,
    totalScore: 0,
    rank: 0,
    lastActiveDate: null,
    achievements: [],
    recentActivity: []
  }
  
  localStorage.setItem('userStats', JSON.stringify(resetStats))
  window.dispatchEvent(new CustomEvent('userStatsUpdated', { detail: resetStats }))
}
