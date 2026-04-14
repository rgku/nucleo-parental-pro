'use client'

import { useEffect, useState, useCallback } from 'react'

interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

interface PushNotificationPayload {
  title: string
  message: string
  url?: string
  type?: string
}

export function usePushNotifications() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
    }
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }, [isSupported])

  const subscribe = useCallback(async (userId: string): Promise<PushSubscription | null> => {
    if (!isSupported || permission !== 'granted') return null

    try {
      const registration = await navigator.serviceWorker.ready
      
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        ),
      })

      const pushSubscription: PushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: toBase64UrlString(sub.getKey('p256dh')!),
          auth: toBase64UrlString(sub.getKey('auth')!),
        },
      }

      setSubscription(pushSubscription)

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          subscription: pushSubscription,
        }),
      })

      return pushSubscription
    } catch (error) {
      console.error('Error subscribing to push:', error)
      return null
    }
  }, [isSupported, permission])

  const unsubscribe = useCallback(async (userId: string): Promise<boolean> => {
    if (!subscription) return false

    try {
      const registration = await navigator.serviceWorker.ready
      await registration.pushManager.unsubscribe()

      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      })

      setSubscription(null)
      return true
    } catch (error) {
      console.error('Error unsubscribing from push:', error)
      return false
    }
  }, [subscription])

  const sendLocalNotification = useCallback(async (payload: PushNotificationPayload): Promise<void> => {
    if (permission !== 'granted') return

    const registration = await navigator.serviceWorker.ready
    await registration.showNotification(payload.title, {
      body: payload.message,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: { url: payload.url || '/' },
    })
  }, [permission])

  return {
    subscription,
    permission,
    isSupported,
    requestPermission,
    subscribe,
    unsubscribe,
    sendLocalNotification,
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function toBase64UrlString(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}