'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Play, RotateCcw, CheckCircle, XCircle, Clock, AlertCircle, BookOpen, Flag, Award, Calendar, Users } from 'lucide-react'
import { challengeStore, reportStore } from '@/lib/data-store'

export default function ChallengeDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const [challenge, setChallenge] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [testResults, setTestResults] = useState<any>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [activeTab, setActiveTab] = useState<'description' | 'leaderboard' | 'submissions'>('description')
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDescription, setReportDescription] = useState('')

  useEffect(() => {
    // Load challenge by slug
    const loadedChallenge = challengeStore.getBySlug(params.slug)
    
    if (!loadedChallenge) {
      setLoading(false)
      return
    }

    setChallenge(loadedChallenge)
    
    // Set starter code
    if (loadedChallenge.starterCode && loadedChallenge.supportedLanguages) {
      const defaultLang = loadedChallenge.supportedLanguages[0]
      setLanguage(defaultLang)
      setCode(loadedChallenge.starterCode[defaultLang] || getTemplate(defaultLang))
    }
    
    setLoading(false)
  }, [params.slug])

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang)
    if (challenge?.starterCode) {
      setCode(challenge.starterCode[newLang] || getTemplate(newLang))
    }
  }

  const handleReport = () => {
    const userName = localStorage.getItem('userName') || 'Anonymous'
    const userId = localStorage.getItem('userId') || 'guest'
    
    reportStore.add({
      userId,
      userName,
      type: 'challenge',
      itemId: challenge.id,
      itemTitle: challenge.title,
      reason: reportReason,
      description: reportDescription
    })
    
    alert('Report submitted successfully!')
    setShowReportModal(false)
    setReportReason('')
    setReportDescription('')
  }

  const getTemplate = (lang: string) => {
    if (lang === 'javascript') return "function solution() { return 'Hello, JavaScript!' }\nconsole.log(solution())"
    if (lang === 'typescript') return "function solution(): string { return 'Hello, TypeScript!' }\nconsole.log(solution())"
    if (lang === 'python') return "def solution():\n    return 'Hello, Python!'\n\nprint(solution())"
    if (lang === 'sql') return "SELECT 'Hello, SQL!';"
    if (lang === 'java') return "public class Solution {\n  public static void main(String[] args) {\n    System.out.println(\"Hello, Java!\");\n  }\n}"
    if (lang === 'cpp') return "#include <iostream>\nint main(){ std::cout << \"Hello, C++!\" << std::endl; return 0; }"
    if (lang === 'c') return "#include <stdio.h>\nint main(){ printf(\"Hello, C!\\n\"); return 0; }"
    if (lang === 'go') return "package main\nimport \"fmt\"\nfunc main(){ fmt.Println(\"Hello, Go!\") }"
    if (lang === 'rust') return "fn main(){ println!(\"Hello, Rust!\"); }"
    if (lang === 'csharp') return "using System;\nclass Solution{ static void Main(){ Console.WriteLine(\"Hello, C#!\"); } }"
    if (lang === 'html/css') return "<!DOCTYPE html>\n<html>\n  <head>\n    <style>\n      body { color: #222; font-family: Arial, sans-serif; }\n    </style>\n  </head>\n  <body>\n    <h1>Hello, HTML/CSS!</h1>\n    <p>This is a combined HTML/CSS example.</p>\n  </body>\n</html>"
    return ''
  }

  const handleSubmit = async () => {
    setIsRunning(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Simulate scoring
    const score = Math.floor(Math.random() * challenge.maxScore)
    setTestResults({
      score,
      maxScore: challenge.maxScore,
      passed: 8,
      total: 10,
      accepted: score > challenge.maxScore * 0.7
    })
    
    setIsRunning(false)
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading challenge...</div>
      </div>
    )
  }

  // Show challenge not found
  if (!challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Challenge Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The challenge you're looking for doesn't exist.</p>
          <Link
            href="/challenges"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Back to Challenges
          </Link>
        </div>
      </div>
    )
  }

  // If no description, still show the challenge interface with default content
  const hasContent = challenge.description

  // Parse examples and constraints from strings
  const examples = challenge.examples ? challenge.examples.split('\n\n').filter(Boolean) : []
  const constraints = challenge.constraints ? challenge.constraints.split('\n').filter(Boolean) : []
  const defaultLanguages = ['javascript','typescript','python','java','cpp','c','go','rust','csharp','sql','html/css']
  const supportedLanguages = (challenge.supportedLanguages && challenge.supportedLanguages.length > 0) ? challenge.supportedLanguages : defaultLanguages

  return (
    <>
      <div className="h-[calc(100vh-64px)] flex flex-col">
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Challenge Description */}
          <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {challenge.title}
                </h1>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      challenge.difficulty === 'easy'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : challenge.difficulty === 'medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}
                  >
                    {challenge.difficulty}
                  </span>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    title="Report Issue"
                  >
                    <Flag className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Challenge Info */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <Award className="h-4 w-4 mr-1" />
                    Max Score
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {challenge.maxScore}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <Clock className="h-4 w-4 mr-1" />
                    Time Limit
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {challenge.timeLimit || 'N/A'} min
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <Users className="h-4 w-4 mr-1" />
                    Participants
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {challenge.participants || 0}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                {(['description', 'leaderboard', 'submissions'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 font-medium capitalize ${
                      activeTab === tab
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Description Tab */}
              {activeTab === 'description' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Challenge Description
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {challenge.description || 'Challenge description coming soon. This challenge is being prepared.'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Examples
                    </h3>
                    {examples.length > 0 ? (
                      examples.map((example: string, index: number) => (
                        <div key={index} className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="font-medium text-gray-900 dark:text-white mb-2">
                            Example {index + 1}:
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                            {example}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          No examples provided yet.
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Constraints
                    </h3>
                    {constraints.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                        {constraints.map((constraint: string, index: number) => (
                          <li key={index}>{constraint}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-700 dark:text-gray-300">
                        No constraints specified.
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Hints
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {challenge.hints || 'No hints provided.'}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'leaderboard' && (
                <div className="text-gray-600 dark:text-gray-400">
                  Leaderboard will appear here
                </div>
              )}

              {activeTab === 'submissions' && (
                <div className="text-gray-600 dark:text-gray-400">
                  Your previous submissions will appear here
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Code Editor */}
          <div className="w-1/2 flex flex-col">
            {/* Language Selector */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {supportedLanguages.map((lang: string) => (
                  <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                ))}
              </select>
              <button
                onClick={() => setCode(challenge.starterCode?.[language] || getTemplate(language))}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset</span>
              </button>
            </div>

            {/* Code Editor */}
            <div className="flex-1 overflow-hidden">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-full p-4 font-mono text-sm bg-gray-900 text-gray-100 resize-none focus:outline-none"
                spellCheck={false}
              />
            </div>

            {/* Test Results */}
            {testResults && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Score: {testResults.score}/{testResults.maxScore}
                  </h3>
                  {testResults.accepted && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded-full text-sm font-medium">
                      Accepted
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Test Cases: {testResults.passed}/{testResults.total} passed
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex items-center justify-end space-x-3 bg-white dark:bg-gray-900">
              <button
                onClick={handleSubmit}
                disabled={isRunning}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 font-medium"
              >
                {isRunning ? 'Submitting...' : 'Submit Solution'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Report Issue</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select a reason</option>
                  <option value="incorrect_description">Incorrect Description</option>
                  <option value="wrong_test_case">Wrong Test Case</option>
                  <option value="unfair_scoring">Unfair Scoring</option>
                  <option value="time_limit_issue">Time Limit Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Describe the issue..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReport}
                  disabled={!reportReason || !reportDescription}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
