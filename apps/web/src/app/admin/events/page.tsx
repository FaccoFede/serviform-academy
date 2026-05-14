'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminEventsRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin/announcements') }, [router])
  return null
}
