import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    const supabase = getSupabaseClient()

    switch (action) {
      case 'process-reminders': {
        await supabase.rpc('process_scheduled_reminders')
        return NextResponse.json({ success: true, message: 'Reminders processed' })
      }

      case 'create-custody-reminder': {
        const { event_id, parental_unit_id, user_id, scheduled_for, message } = body
        
        if (!parental_unit_id || !user_id || !scheduled_for) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const { error } = await supabase.from('scheduled_reminders').insert({
          parental_unit_id,
          user_id,
          event_id,
          reminder_type: 'custody_swap',
          scheduled_for,
          message,
        })

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
      }

      case 'check-upcoming-custody': {
        const { parental_unit_id } = body
        
        if (!parental_unit_id) {
          return NextResponse.json({ error: 'Missing parental_unit_id' }, { status: 400 })
        }

        const { data: events, error } = await supabase
          .from('calendar_events')
          .select('*')
          .eq('parental_unit_id', parental_unit_id)
          .eq('type', 'custody')
          .gte('start_date', new Date().toISOString())
          .lte('start_date', new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString())
          .order('start_date', { ascending: true })

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ events: events || [] })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Scheduler API error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    endpoint: '/api/scheduler',
    actions: [
      'process-reminders',
      'create-custody-reminder',
      'check-upcoming-custody'
    ]
  })
}