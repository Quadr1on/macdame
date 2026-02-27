'use client'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-red-600">
            Authentication Error
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Something went wrong during the authentication process. This could happen if:
          </p>
          <ul className="text-sm text-gray-500 text-left space-y-1 list-disc list-inside">
            <li>The sign-in link has expired</li>
            <li>The link was already used</li>
            <li>There was a network error</li>
          </ul>
          <div className="pt-4 space-y-2">
            <Link href="/login">
              <Button className="w-full text-[var(--color-cream)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]">
                Try signing in again
              </Button>
            </Link>
            <Link href="/" className="block text-sm text-gray-500 hover:text-gray-700">
              ← Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
