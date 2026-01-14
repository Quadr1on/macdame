'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Home() {
  const [testValue, setTestValue] = useState('')

  return (
    <div className="min-h-screen bg-cream">
      <div className="container-custom py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-[var(--color-primary)] mb-4">
            Traditional Clothing Store
          </h1>
          <p className="text-xl text-gray-600">
            Setup Test & Component Verification
          </p>
        </div>

        {/* Setup Status */}
        <Card className="mb-8 bg-white">
          <CardHeader>
            <CardTitle className="text-2xl text-[var(--color-primary)]">
              ✅ Day 1 Setup Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Next.js 15 with App Router</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Tailwind CSS v4 configured</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Custom color palette loaded</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Shadcn UI components ready</span>
            </div>
          </CardContent>
        </Card>

        {/* Button Tests */}
        <Card className="mb-8 bg-white">
          <CardHeader>
            <CardTitle>Button Components Test</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button>Default Button</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
            <Button className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white">
              Primary Color
            </Button>
            <Button className="bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-dark)] text-white">
              Secondary Color
            </Button>
            <Button className="bg-[var(--color-terracotta)] hover:opacity-90 text-white">
              Terracotta
            </Button>
          </CardContent>
        </Card>

        {/* Form Components Test */}
        <Card className="mb-8 bg-white">
          <CardHeader>
            <CardTitle>Form Components Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-input">Test Input</Label>
              <Input 
                id="test-input"
                placeholder="Type something..." 
                value={testValue}
                onChange={(e) => setTestValue(e.target.value)}
              />
              {testValue && (
                <p className="text-sm text-gray-600">You typed: {testValue}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Color Palette */}
        <Card className="mb-8 bg-white">
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="w-full h-24 rounded-lg bg-[var(--color-primary)] mb-2 shadow"></div>
                <p className="text-sm font-medium">Primary</p>
                <p className="text-xs text-gray-500">#8B4513</p>
              </div>
              <div className="text-center">
                <div className="w-full h-24 rounded-lg bg-[var(--color-secondary)] mb-2 shadow"></div>
                <p className="text-sm font-medium">Secondary</p>
                <p className="text-xs text-gray-500">#D4AF37</p>
              </div>
              <div className="text-center">
                <div className="w-full h-24 rounded-lg bg-[var(--color-cream)] border-2 mb-2 shadow"></div>
                <p className="text-sm font-medium">Cream</p>
                <p className="text-xs text-gray-500">#FFF8F0</p>
              </div>
              <div className="text-center">
                <div className="w-full h-24 rounded-lg bg-[var(--color-terracotta)] mb-2 shadow"></div>
                <p className="text-sm font-medium">Terracotta</p>
                <p className="text-xs text-gray-500">#C85A3E</p>
              </div>
              <div className="text-center">
                <div className="w-full h-24 rounded-lg bg-gray-900 mb-2 shadow"></div>
                <p className="text-sm font-medium">Text</p>
                <p className="text-xs text-gray-500">Default</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-blue-800">
            <p>1. Run database schema in Supabase SQL Editor</p>
            <p>2. Test database connection at <a href="/test" className="underline font-semibold">/test</a></p>
            <p>3. Ready to start Day 2: Authentication</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}