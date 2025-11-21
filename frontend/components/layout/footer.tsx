import Link from 'next/link'
import { Github, Twitter, Linkedin, Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">
              CodeGymnasium
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Master your coding skills through structured learning and practice.
            </p>
          </div>

          {/* Learn */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              Learn
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/courses"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Courses
                </Link>
              </li>
              <li>
                <Link
                  href="/problems"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Problems
                </Link>
              </li>
              <li>
                <Link
                  href="/challenges"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Challenges
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              Community
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/discussions"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Discussions
                </Link>
              </li>
              <li>
                <Link
                  href="/leaderboard"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              Connect
            </h4>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="mailto:support@codegymnasium.com"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-gray-600 dark:text-gray-400">
          <p>© {new Date().getFullYear()} CodeGymnasium. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
