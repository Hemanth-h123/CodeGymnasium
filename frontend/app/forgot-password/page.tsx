'use client'

import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'request' | 'reset'>('request')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const base = process.env.NEXT_PUBLIC_API_URL

  const requestReset = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${base}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed')
      setToken(data.token || '')
      setMessage('Enter the token and your new password')
      setStep('reset')
    } catch (e: any) {
      setError(e.message || 'Failed to request reset')
    } finally {
      setLoading(false)
    }
  }

  const performReset = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${base}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed')
      setMessage('Password updated. You can now login with the new password.')
    } catch (e: any) {
      setError(e.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Forgot Password</h1>
        {message && <div className="mb-3 text-green-600 dark:text-green-400">{message}</div>}
        {error && <div className="mb-3 text-red-600 dark:text-red-400">{error}</div>}
        {step === 'request' ? (
          <>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Email</label>
            <input className="w-full px-3 py-2 border rounded mb-4 dark:bg-gray-700 dark:text-white" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button disabled={loading} onClick={requestReset} className="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">Request Reset</button>
          </>
        ) : (
          <>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Token</label>
            <input className="w-full px-3 py-2 border rounded mb-4 dark:bg-gray-700 dark:text-white" value={token} onChange={(e) => setToken(e.target.value)} />
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">New Password</label>
            <input className="w-full px-3 py-2 border rounded mb-4 dark:bg-gray-700 dark:text-white" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
            <input className="w-full px-3 py-2 border rounded mb-4 dark:bg-gray-700 dark:text-white" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            <button disabled={loading} onClick={performReset} className="w-full px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50">Reset Password</button>
          </>
        )}
      </div>
    </div>
  )
}
