"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Plus, X, Check, AlertCircle, Save, Upload } from 'lucide-react'

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
}

export default function PlaygroundPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [code, setCode] = useState('// Write your code here\nfunction solution() {\n  \n  return "Hello, World!";\n}\n\nconsole.log(solution());')
  const [language, setLanguage] = useState('javascript')
  const [testCases, setTestCases] = useState<TestCase[]>([
    { id: '1', input: '', expectedOutput: '' }
  ])
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<{ id: string; passed: boolean; output: string }[]>([])

  useEffect(() => {
    setMounted(true)
    
    // Check if user is logged in or admin
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
    const isAdmin = localStorage.getItem('isAdmin') === 'true'
    if (!isLoggedIn && !isAdmin) {
      router.push('/login')
    }
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

  const getTemplate = (lang: string) => {
    if (lang === 'javascript') return "// JavaScript\nfunction main() {\n  console.log('Hello, JavaScript!')\n}\nmain()";
    if (lang === 'typescript') return "// TypeScript\nfunction main(msg: string): void {\n  console.log(msg)\n}\nmain('Hello, TypeScript!')";
   if (lang === 'java') return "public class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello, Java!\");\n  }\n}";
    if (lang === 'cpp') return "#include <iostream>\nint main(){ std::cout << \"Hello, C++!\" << std::endl; return 0; }";
    if (lang === 'go') return "package main\nimport \"fmt\"\nfunc main(){ fmt.Println(\"Hello, Go!\") }";
    if (lang === 'rust') return "fn main(){ println!(\"Hello, Rust!\"); }";
    if (lang === 'csharp') return "using System;\nclass Program{ static void Main(){ Console.WriteLine(\"Hello, C#!\"); } }";
     if (lang === 'python') return "def solution():\n    return 'Hello, Python!'\n\nprint(solution())"
     if (lang === 'sql') return "SELECT 'Hello, SQL!';";
     if (lang === 'c') return "#include <stdio.h>\\nint main(){ printf(\\\"Hello, C!\\\\n\\\"); return 0; }"
     if (lang === 'html') return "<!DOCTYPE html>\\n<html>\\n<body>\\n<h1>Hello, HTML!</h1>\\n</body>\\n</html>"
     if (lang === 'css') return "/* Hello, CSS! */\\nbody { color: #222; }"
    return code;
  }

  const addTestCase = () => {
    setTestCases([...testCases, { id: Date.now().toString(), input: '', expectedOutput: '' }])
  }

  const removeTestCase = (id: string) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter(tc => tc.id !== id))
    }
  }

  const updateTestCase = (id: string, field: 'input' | 'expectedOutput', value: string) => {
    setTestCases(testCases.map(tc => 
      tc.id === id ? { ...tc, [field]: value } : tc
    ))
  }

  const runCode = async () => {
    setIsRunning(true)
    setOutput('')
    setTestResults([])

    try {
      const res = await fetch(`/api/content/code/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code })
      })
      const data = await res.json()
      const header = `Executing ${language} code...\n\n`
      const rawOut = String(data.output || '').trim()
      const rawErr = String(data.error || '').trim()
      const body = rawOut.length > 0 ? rawOut : (rawErr.length > 0 ? rawErr : 'No output produced')
      const footer = `\n\nExecution completed in ${data.duration ?? 0}ms`
      setOutput(header + body + footer)

      if (testCases.some(tc => tc.input || tc.expectedOutput)) {
        const results: { id: string; passed: boolean; output: string }[] = []
        for (const tc of testCases) {
          try {
            const r = await fetch(`/api/content/code/execute`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ language, code, input: tc.input })
            })
            const d = await r.json()
            const out = String(d.output || d.error || '')
            const passed = tc.expectedOutput ? out.trim() === tc.expectedOutput.trim() : out.length > 0
            results.push({ id: tc.id, passed, output: out })
          } catch {
            results.push({ id: tc.id, passed: false, output: '' })
          }
        }
        setTestResults(results)
      }
    } catch {
      setOutput(`Error executing ${language} code`)
    } finally {
      setIsRunning(false)
    }
  }

  const saveCode = () => {
    // TODO: Implement save to local storage or API
    const savedCode = {
      code,
      language,
      testCases,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('playground_code', JSON.stringify(savedCode))
    alert('Code saved successfully!')
  }

  const loadCode = () => {
    // TODO: Implement load from local storage or API
    const savedCode = localStorage.getItem('playground_code')
    if (savedCode) {
      const parsed = JSON.parse(savedCode)
      setCode(parsed.code)
      setLanguage(parsed.language)
      setTestCases(parsed.testCases)
      alert('Code loaded successfully!')
    } else {
      alert('No saved code found')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Code Playground
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Practice your coding skills with custom test cases
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={loadCode}
              className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <Upload className="h-4 w-4 mr-2" />
              Load
            </button>
            <button
              onClick={saveCode}
              className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Code Editor */}
          <div className="space-y-4">
            {/* Language Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => { const v = e.target.value; setLanguage(v); setCode(getTemplate(v)); }}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
               <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="csharp">C#</option>
                 <option value="python">Python</option>
                 <option value="sql">SQL</option>
                 <option value="c">C</option>
                 <option value="html">HTML</option>
                 <option value="css">CSS</option>
              </select>
            </div>

            {/* Code Editor */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="border-b dark:border-gray-700 px-4 py-3 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">Code Editor</h3>
                <button
                  onClick={runCode}
                  disabled={isRunning}
                  className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isRunning ? 'Running...' : 'Run Code'}
                </button>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-96 p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none resize-none"
                spellCheck={false}
              />
            </div>

            {/* Output Console */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="border-b dark:border-gray-700 px-4 py-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Output</h3>
              </div>
              <div className="p-4 h-48 overflow-y-auto">
                {output ? (
                  <pre className="font-mono text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {output}
                  </pre>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">
                    Output will appear here after running the code
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Test Cases */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="border-b dark:border-gray-700 px-4 py-3 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Test Cases (Optional)
                </h3>
                <button
                  onClick={addTestCase}
                  className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Test Case
                </button>
              </div>
              <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                {testCases.map((testCase, index) => (
                  <div
                    key={testCase.id}
                    className="border dark:border-gray-700 rounded-lg p-4 relative"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Test Case {index + 1}
                      </h4>
                      <div className="flex items-center space-x-2">
                        {testResults.find(r => r.id === testCase.id) && (
                          <span className={`flex items-center text-sm ${
                            testResults.find(r => r.id === testCase.id)?.passed
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {testResults.find(r => r.id === testCase.id)?.passed ? (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Passed
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-4 w-4 mr-1" />
                                Failed
                              </>
                            )}
                          </span>
                        )}
                        {testCases.length > 1 && (
                          <button
                            onClick={() => removeTestCase(testCase.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Input
                        </label>
                        <textarea
                          value={testCase.input}
                          onChange={(e) => updateTestCase(testCase.id, 'input', e.target.value)}
                          placeholder="Enter test input..."
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white font-mono text-sm"
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Expected Output
                        </label>
                        <textarea
                          value={testCase.expectedOutput}
                          onChange={(e) => updateTestCase(testCase.id, 'expectedOutput', e.target.value)}
                          placeholder="Enter expected output..."
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white font-mono text-sm"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Results Summary */}
            {testResults.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Test Results
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Passed: {testResults.filter(r => r.passed).length} / {testResults.length}
                  </span>
                  <div className="flex space-x-2">
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-sm font-medium">
                      {testResults.filter(r => r.passed).length} Passed
                    </span>
                    <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-sm font-medium">
                      {testResults.filter(r => !r.passed).length} Failed
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
