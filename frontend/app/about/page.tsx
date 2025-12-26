'use client'

import { useState, useEffect } from 'react'

interface HomepageStats {
  active_learners: number
  courses: number
  topics: number
  problems: number
}

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState('mission')
  const [stats, setStats] = useState<HomepageStats>({
    active_learners: 0,
    courses: 0,
    topics: 0,
    problems: 0
  })
  const [loading, setLoading] = useState(true)
  
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
      } finally {
        setLoading(false)
      }
    }
    
    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              About CodeGymnasium
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Empowering developers through interactive learning
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                <button
                  className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
                    activeTab === 'mission'
                      ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('mission')}
                >
                  Our Mission
                </button>
                <button
                  className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
                    activeTab === 'team'
                      ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('team')}
                >
                  Our Team
                </button>
                <button
                  className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
                    activeTab === 'values'
                      ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('values')}
                >
                  Our Values
                </button>
              </div>

              {activeTab === 'mission' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-block p-4 bg-blue-50 dark:bg-blue-900/30 rounded-full mb-4">
                      <div className="text-3xl">🎯</div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Our Mission</h2>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    At CodeGymnasium, our mission is to democratize programming education by providing 
                    an interactive, engaging, and accessible platform for developers of all skill levels. 
                    We believe that learning to code should be an enjoyable journey filled with practical 
                    experience and real-world applications.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Our platform combines cutting-edge technology with pedagogical best practices to create 
                    an environment where developers can practice, experiment, and grow their skills through 
                    hands-on coding challenges, interactive courses, and collaborative projects.
                  </p>
                </div>
              )}

              {activeTab === 'team' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-block p-4 bg-green-50 dark:bg-green-900/30 rounded-full mb-4">
                      <div className="text-3xl">👥</div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Our Team</h2>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    CodeGymnasium was founded by a passionate group of developers and educators who recognized 
                    the gap between traditional programming education and the practical skills needed in the 
                    modern tech industry. Our team combines deep expertise in software engineering, 
                    education, and user experience design.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full mb-4 flex items-center justify-center">
                        <span className="text-4xl">👨‍💻</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">John Doe</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Founder & CEO</p>
                    </div>
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full mb-4 flex items-center justify-center">
                        <span className="text-4xl">👩‍💻</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Jane Smith</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">CTO</p>
                    </div>
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full mb-4 flex items-center justify-center">
                        <span className="text-4xl">👨‍🏫</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Robert Chen</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Head of Education</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'values' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-block p-4 bg-purple-50 dark:bg-purple-900/30 rounded-full mb-4">
                      <div className="text-3xl">💎</div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Our Values</h2>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1 mr-4 text-xl">✓</div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Accessibility</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          We believe coding education should be accessible to everyone, regardless of background or experience level.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1 mr-4 text-xl">✓</div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Practical Learning</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          We prioritize hands-on experience and real-world applications over theoretical concepts.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1 mr-4 text-xl">✓</div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Community</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          We foster a collaborative environment where developers can learn from each other.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1 mr-4 text-xl">✓</div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Innovation</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          We continuously evolve our platform to incorporate the latest technologies and teaching methods.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{loading ? '...' : stats.active_learners.toLocaleString() + '+'}</h3>
              <p className="text-gray-600 dark:text-gray-400">Active Learners</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
              <div className="text-3xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{loading ? '...' : stats.problems.toLocaleString() + '+'}</h3>
              <p className="text-gray-600 dark:text-gray-400">Coding Challenges</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
              <div className="text-3xl mb-4">🎓</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{loading ? '...' : stats.courses.toLocaleString() + '+'}</h3>
              <p className="text-gray-600 dark:text-gray-400">Interactive Courses</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
