'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter, Shield, Ban, CheckCircle, XCircle } from 'lucide-react'

export default function AdminUsersPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    // Check if user is admin
    const isAdmin = localStorage.getItem('isAdmin') === 'true'
    if (!isAdmin) {
      router.push('/admin/login')
    }
  }, [router])

  // Mock data - TODO: Fetch from API
  const users = [
    {
      id: 1,
      username: 'john_doe',
      email: 'john@example.com',
      fullName: 'John Doe',
      role: 'student',
      subscription: 'premium',
      problemsSolved: 145,
      totalScore: 3456,
      isActive: true,
      isEmailVerified: true,
      joinedAt: '2025-08-15',
      lastActive: '2 hours ago'
    },
    {
      id: 2,
      username: 'alice_smith',
      email: 'alice@example.com',
      fullName: 'Alice Smith',
      role: 'instructor',
      subscription: 'premium',
      problemsSolved: 234,
      totalScore: 5678,
      isActive: true,
      isEmailVerified: true,
      joinedAt: '2025-07-20',
      lastActive: '5 hours ago'
    },
    {
      id: 3,
      username: 'bob_jones',
      email: 'bob@example.com',
      fullName: 'Bob Jones',
      role: 'student',
      subscription: 'free',
      problemsSolved: 45,
      totalScore: 1234,
      isActive: true,
      isEmailVerified: true,
      joinedAt: '2025-10-01',
      lastActive: '1 day ago'
    },
    {
      id: 4,
      username: 'inactive_user',
      email: 'inactive@example.com',
      fullName: 'Inactive User',
      role: 'student',
      subscription: 'free',
      problemsSolved: 12,
      totalScore: 345,
      isActive: false,
      isEmailVerified: false,
      joinedAt: '2025-09-15',
      lastActive: '30 days ago'
    },
    {
      id: 5,
      username: 'admin_user',
      email: 'admin@codegymnasium.com',
      fullName: 'Admin User',
      role: 'admin',
      subscription: 'premium',
      problemsSolved: 0,
      totalScore: 0,
      isActive: true,
      isEmailVerified: true,
      joinedAt: '2025-01-01',
      lastActive: '1 hour ago'
    }
  ]

  const filteredUsers = users.filter(user => {
    if (searchQuery && 
        !user.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !user.email.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !user.fullName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (roleFilter !== 'all' && user.role !== roleFilter) return false
    if (statusFilter === 'active' && !user.isActive) return false
    if (statusFilter === 'inactive' && user.isActive) return false
    return true
  })

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    premium: users.filter(u => u.subscription === 'premium').length,
    admins: users.filter(u => u.role === 'admin').length,
    instructors: users.filter(u => u.role === 'instructor').length,
    students: users.filter(u => u.role === 'student').length
  }

  const handleToggleStatus = (userId: number, currentStatus: boolean) => {
    // TODO: Implement actual API call
    console.log(`Toggle user ${userId} status from ${currentStatus} to ${!currentStatus}`)
  }

  const handleChangeRole = (userId: number, newRole: string) => {
    // TODO: Implement actual API call
    console.log(`Change user ${userId} role to ${newRole}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage users, roles, and permissions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Premium</p>
            <p className="text-2xl font-bold text-blue-600">{stats.premium}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Admins</p>
            <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Instructors</p>
            <p className="text-2xl font-bold text-orange-600">{stats.instructors}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Students</p>
            <p className="text-2xl font-bold text-cyan-600">{stats.students}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="instructor">Instructor</option>
              <option value="student">Student</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.fullName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          @{user.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleChangeRole(user.id, e.target.value)}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm capitalize"
                      >
                        <option value="student">Student</option>
                        <option value="instructor">Instructor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                        user.subscription === 'premium'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {user.subscription}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-900 dark:text-white font-medium">
                          {user.problemsSolved} problems
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          {user.totalScore} points
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        {user.isActive ? (
                          <span className="flex items-center text-green-600 text-sm">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center text-red-600 text-sm">
                            <XCircle className="h-4 w-4 mr-1" />
                            Inactive
                          </span>
                        )}
                        {user.isEmailVerified && (
                          <span className="text-xs text-gray-500">✓ Verified</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {user.lastActive}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleStatus(user.id, user.isActive)}
                          className={`p-2 rounded transition-colors ${
                            user.isActive
                              ? 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                              : 'text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400'
                          }`}
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="View Details"
                        >
                          <Shield className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                No users found
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
