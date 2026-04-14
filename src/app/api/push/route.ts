import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, subscription, action } = body

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    switch (action) {
      case 'subscribe':
        if (!subscription) {
          return NextResponse.json({ error: 'Missing subscription' }, { status: 400 })
        }
        
        await supabase.from('push_subscriptions').upsert({
          user_id,
          endpoint: subscription.endpoint,
          keys_p256dh: subscription.keys.p256dh,
          keys_auth: subscription.keys.auth,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })
        
        return NextResponse.json({ success: true })

      case 'unsubscribe':
        await supabase.from('push_subscriptions')
          .delete()
          .eq('user_id', user_id)
        
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Push API error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseClient()
    
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')

    return NextResponse.json({ subscriptions: subscriptions || [] })
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}