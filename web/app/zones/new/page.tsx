'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { NavBar } from '@/components/nav-bar'
import { DisclaimerBanner } from '@/components/disclaimer-banner'
import { ZoneForm } from '@/components/zone-form'
import { Zone } from '@/lib/types'

export default function NewZonePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (formData: Omit<Zone, 'id' | 'created_at'>) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to create zone')
      }

      router.push('/zones')
    } catch (error) {
      console.error('Error creating zone:', error)
      alert('Failed to create zone')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <DisclaimerBanner />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Create New Zone</h1>
          <p className="text-muted-foreground">
            Define a new monitoring zone with its characteristics and location parameters.
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-8">
          <ZoneForm
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            isLoading={isLoading}
          />
        </div>
      </main>
    </div>
  )
}
