import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Macdame - Authentic South Indian Wear',
  description: 'Shop authentic traditional South Indian clothing including sarees, vesti, and more. Quality traditional wear for the modern Indian family.',
  keywords: 'traditional clothing, south indian wear, sarees, vesti, ethnic wear',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}