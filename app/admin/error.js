'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { PageHeader, Panel, adminPrimaryButton } from '@/components/admin/ui'

// Catches anything an admin page throws while rendering (a Supabase outage, a
// missing service key) so the sidebar stays put and the admin gets a way to
// retry instead of the storefront's generic error screen. Query errors that
// Supabase returns as values are handled inline by each page.
export default function AdminError({ error, reset }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <>
      <PageHeader title="Something went wrong" />
      <Panel>
        <div className="px-4 py-10 text-center">
          <p className="text-sm text-slate-600">
            This admin page could not be loaded. The shop itself is unaffected.
          </p>
          {error?.digest && (
            <p className="mt-1 text-xs text-slate-400">Reference: {error.digest}</p>
          )}
          <Button onClick={reset} className={`mt-4 ${adminPrimaryButton}`}>
            Try again
          </Button>
        </div>
      </Panel>
    </>
  )
}
