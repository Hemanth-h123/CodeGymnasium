'use client'

import Link from 'next/link'
import { Code2, Menu, X, User, LogOut, ChevronDown, UserCircle, PlaySquare } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export function Header() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userName, setUserName] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    
    // Check authentication status
    const checkAuth = () => {
      const adminStatus = localStorage.getItem('isAdmin') === 'true'
      const userLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
      const storedUserName = localStorage.getItem('userName') || 'User'
      
      setIsAdmin(adminStatus)
      setIsLoggedIn(userLoggedIn || adminStatus)
      setUserName(storedUserName)
    }

    checkAuth()

    // Listen for storage changes
    window.addEventListener('storage', checkAuth)
    // Listen for custom auth event
    window.addEventListener('authChange', checkAuth)
    
    return () => {
      window.removeEventListener('storage', checkAuth)
      window.removeEventListener('authChange', checkAuth)
    }
  }, [])

  useEffect(() => {
    async function syncData() {
      try {
        const [coursesRes, problemsRes] = await Promise.all([
          fetch('/api/content/courses'),
          fetch('/api/content/problems')
        ])
        if (coursesRes.ok) {
          const courses = await coursesRes.json()
          localStorage.setItem('courses', JSON.stringify(courses))
        }
        if (problemsRes.ok) {
          const problems = await problemsRes.json()
          localStorage.setItem('problems', JSON.stringify(problems))
        }
        window.dispatchEvent(new Event('dataChange'))
      } catch {}
    }
    syncData()
  }, [])

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('userName')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('isAdmin')
    localStorage.removeItem('adminEmail')
    setIsLoggedIn(false)
    setIsAdmin(false)
    setDropdownOpen(false)
    
    // Trigger auth change event
    window.dispatchEvent(new Event('authChange'))
    
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-gray-900">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Code2 className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              CodeGymnasium
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/courses"
              className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
            >
              Courses
            </Link>
            <Link
              href="/problems"
              className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
            >
              Problems
            </Link>
            <Link
              href="/playground"
              className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors flex items-center"
            >
              <PlaySquare className="h-4 w-4 mr-1" />
              Playground
            </Link>
            {mounted && isLoggedIn && !isAdmin && (
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
              >
                Dashboard
              </Link>
            )}
            {mounted && isAdmin && (
              <Link
                href="/admin"
                className="text-gray-700 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400 transition-colors"
              >
                Admin
              </Link>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {!mounted ? (
              // Loading state - show nothing to prevent flash
              <div className="w-32 h-10"></div>
            ) : isLoggedIn ? (
              <div className="relative" ref={dropdownRef}>
                {isAdmin ? (
                  // Admin view - just show logout
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </button>
                ) : (
                  // Regular user view - show dropdown
                  <>
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <UserCircle className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        {userName}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                    </button>
                    
                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                        <Link
                          href="/profile"
                          className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Profile
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 dark:text-gray-300"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t pt-4">
            <div className="flex flex-col space-y-4">
              <Link
                href="/courses"
                className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                Courses
              </Link>
              <Link
                href="/problems"
                className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                Problems
              </Link>
              <Link
                href="/playground"
                className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                Playground
              </Link>
              {mounted && isLoggedIn && !isAdmin && (
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              {mounted && isAdmin && (
                <Link
                  href="/admin"
                  className="text-gray-700 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
              <div className="pt-4 border-t space-y-4">
                {!mounted ? (
                  // Loading state
                  <div className="h-10"></div>
                ) : isLoggedIn ? (
                  isAdmin ? (
                    // Admin mobile view
                    <button
                      onClick={() => {
                        handleLogout()
                        setMobileMenuOpen(false)
                      }}
                      className="flex items-center w-full text-left text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  ) : (
                    // Regular user mobile view
                    <>
                      <Link
                        href="/profile"
                        className="flex items-center text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout()
                          setMobileMenuOpen(false)
                        }}
                        className="flex items-center w-full text-left text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </button>
                    </>
                  )
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className="block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
