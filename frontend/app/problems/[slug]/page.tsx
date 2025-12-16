'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Play, RotateCcw, CheckCircle, XCircle, Clock, AlertCircle, BookOpen, Flag } from 'lucide-react'
import { problemStore, reportStore } from '@/lib/data-store'

export default function ProblemDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const [problem, setProblem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [output, setOutput] = useState('')
  const [testResults, setTestResults] = useState<any>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [activeTab, setActiveTab] = useState<'description' | 'submissions' | 'discussions'>('description')
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDescription, setReportDescription] = useState('')

  useEffect(() => {
    const loadData = () => {
      const loadedProblem = problemStore.getBySlug(params.slug)
      if (!loadedProblem) {
        setProblem(null)
        setLoading(false)
        return
      }
      setProblem(loadedProblem)
      if (loadedProblem.starterCode && loadedProblem.supportedLanguages) {
        const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
        const langParam = search?.get('lang') || ''
        const preferred = loadedProblem.supportedLanguages.includes(langParam) ? langParam : loadedProblem.supportedLanguages[0]
        setLanguage(preferred)
        setCode(loadedProblem.starterCode[preferred] || '')
      }
      setLoading(false)
    }
    loadData()
    window.addEventListener('dataChange', loadData)
    return () => window.removeEventListener('dataChange', loadData)
  }, [params.slug])

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang)
    if (problem?.starterCode) {
      setCode(problem.starterCode[newLang] || '')
    }
  }

  const parseExamplesToTestCases = (): { id: number; input: string; expected: string }[] => {
    const text = String(problem?.examples || '')
    const blocks = text.split('\n\n').filter(Boolean)
    const cases: { id: number; input: string; expected: string }[] = []
    let id = 1
    for (const block of blocks) {
      const inputMatch = block.match(/Input:\s*(.*)/i)
      const outputMatch = block.match(/Output:\s*(.*)/i)
      if (inputMatch && outputMatch) {
        cases.push({ id: id++, input: inputMatch[1].trim(), expected: outputMatch[1].trim() })
      }
    }
    return cases
  }

  const handleReport = () => {
    const userName = localStorage.getItem('userName') || 'Anonymous'
    const userId = localStorage.getItem('userId') || 'guest'
    
    reportStore.add({
      userId,
      userName,
      type: 'problem',
      itemId: problem.id,
      itemTitle: problem.title,
      reason: reportReason,
      description: reportDescription
    })
    
    alert('Report submitted successfully!')
    setShowReportModal(false)
    setReportReason('')
    setReportDescription('')
  }

  const handleRunCode = async () => {
    setIsRunning(true)
    const cases = parseExamplesToTestCases()
    const results: any[] = []
    try {
      const r = await fetch(`/api/content/code/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code })
      })
      const d = await r.json()
      const header = `Executing ${language} code...\n\n`
      const body = String(d.output || '')
      const footer = `\n\nExecution completed in ${d.duration ?? 0}ms`
      setOutput(header + body + footer)
    } catch {
      setOutput(`Error executing ${language} code`)
    }
    for (const tc of cases) {
      try {
        const res = await fetch(`/api/content/code/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language, code, input: tc.input })
        })
        const data = await res.json()
        const out = String(data.output || '').trim()
        const passed = tc.expected ? out === tc.expected : out.length > 0
        results.push({ id: tc.id, input: tc.input, expected: tc.expected, output: out, passed, time: Number(data.duration || 0) })
      } catch {
        results.push({ id: tc.id, input: tc.input, expected: tc.expected, output: '', passed: false, time: 0 })
      }
    }
    const passedCount = results.filter(r => r.passed).length
    setTestResults({ passed: passedCount, total: results.length, cases: results })
    setIsRunning(false)
  }

  const handleSubmit = async () => {
    setIsRunning(true)
    if (!testResults) {
      await handleRunCode()
    }
    const accepted = (testResults?.passed || 0) === (testResults?.total || 0)
    setTestResults({ ...(testResults || { passed: 0, total: 0, cases: [] }), accepted })
    setIsRunning(false)
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading problem...</div>
      </div>
    )
  }

  // Show problem not found
  if (!problem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Problem Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The problem you're looking for doesn't exist.</p>
          <Link
            href="/problems"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Back to Problems
          </Link>
        </div>
      </div>
    )
  }

  // Show coming soon if no description
  const hasContent = problem.description
  
  if (!hasContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{problem.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Content Coming Soon</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
            This problem is being prepared. Check back later!
          </p>
          <Link
            href="/problems"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Back to Problems
          </Link>
        </div>
      </div>
    )
  }

  // Parse examples and constraints from strings
  const examples = problem.examples ? problem.examples.split('\n\n').filter(Boolean) : []
  const constraints = problem.constraints ? problem.constraints.split('\n').filter(Boolean) : []

  return (
    <>
      <div className="h-[calc(100vh-64px)] flex flex-col">
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Problem Description */}
          <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {problem.title}
                </h1>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      problem.difficulty === 'easy'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : problem.difficulty === 'medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}
                  >
                    {problem.difficulty}
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

              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                {(['description', 'submissions', 'discussions'] as const).map((tab) => (
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
                      Problem Description
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {problem.description}
                    </p>
                  </div>

                  {examples.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Examples
                      </h3>
                      {examples.map((example: string, index: number) => (
                        <div key={index} className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="font-medium text-gray-900 dark:text-white mb-2">
                            Example {index + 1}:
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                            {example}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {constraints.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Constraints
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                        {constraints.map((constraint: string, index: number) => (
                          <li key={index}>{constraint}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {problem.hints && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Hints
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                        {problem.hints}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'submissions' && (
                <div className="text-gray-600 dark:text-gray-400">
                  Your previous submissions will appear here
                </div>
              )}

              {activeTab === 'discussions' && (
                <div className="text-gray-600 dark:text-gray-400">
                  Community discussions will appear here
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
                {problem.supportedLanguages?.map((lang: string) => (
                  <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                ))}
              </select>
              <button
                onClick={() => setCode(problem.starterCode?.[language] || '')}
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
            {output && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Execution Output
                </h3>
                <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{output}</pre>
              </div>
            )}
            {testResults && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Test Results: {testResults.passed}/{testResults.total} passed
                  </h3>
                  {testResults.accepted && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded-full text-sm font-medium">
                      Accepted
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {testResults.cases.map((testCase: any) => (
                    <div
                      key={testCase.id}
                      className={`p-3 rounded-lg ${
                        testCase.passed
                          ? 'bg-green-50 dark:bg-green-900/10'
                          : 'bg-red-50 dark:bg-red-900/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {testCase.passed ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-medium text-sm text-gray-900 dark:text-white">
                            Test Case {testCase.id}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span>{testCase.time}ms</span>
                        </div>
                      </div>
                      <div className="text-xs space-y-1">
                        <p className="text-gray-700 dark:text-gray-300">
                          Input: {testCase.input}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          Expected: {testCase.expected}
                        </p>
                        <p className={testCase.passed ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                          Output: {testCase.output}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex items-center justify-end space-x-3 bg-white dark:bg-gray-900">
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className="flex items-center space-x-2 px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                <span>{isRunning ? 'Running...' : 'Run Code'}</span>
              </button>
              <button
                onClick={handleSubmit}
                disabled={isRunning}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 font-medium"
              >
                {isRunning ? 'Submitting...' : 'Submit'}
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
                  <option value="typo">Typo/Grammar</option>
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
