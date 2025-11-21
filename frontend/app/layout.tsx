import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { Toaster } from 'react-hot-toast'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CodeGymnasium - Master Your Coding Skills',
  description: 'Learn programming, practice coding challenges, and compete in contests. Master data structures, algorithms, and web development.',
  keywords: ['coding', 'programming', 'learn to code', 'coding challenges', 'DSA', 'algorithms', 'web development'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <Header />
            <main className="min-h-screen">
              {children}
            </main>
            <Footer />
            <Toaster position="top-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
