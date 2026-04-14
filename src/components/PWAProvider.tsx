'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null
  return createClient(supabaseUrl, supabaseAnonKey)
}

interface PushPayload {
  title: string
  message: string
  url?: string
}

function urlBase64ToUint8Array(base64String: string): BufferSource {
  if (!base64String) return new Uint8Array(0)
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    registerServiceWorker()
    requestNotificationPermission()
  }, [])

  const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) return

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      })

      console.log('Service Worker registered:', registration.scope)

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New Service Worker available')
            }
          })
        }
      })
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return

    const supabase = getSupabaseClient()
    if (!supabase) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsReady(true)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!profile) {
        setIsReady(true)
        return
      }

      if (Notification.permission === 'granted') {
        await subscribeToPush(profile.id)
      } else if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          await subscribeToPush(profile.id)
        }
      }
    } catch (error) {
      console.error('Error setting up notifications:', error)
    } finally {
      setIsReady(true)
    }
  }

  const subscribeToPush = async (userId: string) => {
    try {
      const registration = await navigator.serviceWorker.ready
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

      if (!vapidKey) {
        console.warn('VAPID key not configured')
        return
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          subscription: {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: toBase64Url(subscription.getKey('p256dh')),
              auth: toBase64Url(subscription.getKey('auth')),
            },
          },
          action: 'subscribe',
        }),
      })

      console.log('Push subscription successful')
    } catch (error) {
      console.error('Push subscription failed:', error)
    }
  }

  const toBase64Url = (buffer: ArrayBuffer | null): string => {
    if (!buffer) return ''
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }

  return <>{children}</>
}