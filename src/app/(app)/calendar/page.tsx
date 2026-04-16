'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/card'
import { getMonthNamePT } from '@/lib/utils'
import { NATIONAL_HOLIDAYS_2026, MUNICIPALITIES, getMunicipalityHoliday } from '@/lib/holidays-pt'

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null
  return import('@supabase/supabase-js').then(m => m.createClient(supabaseUrl, supabaseAnonKey))
}

interface CalendarEvent {
  id: string
  title: string
  start_date: string
  end_date?: string
  type: string
  created_by: string
  parent?: string
}

interface CalendarDay {
  date: number
  month: number
  year: number
  dateStr: string
  events: CalendarEvent[]
  holiday?: string
  isToday: boolean
}

const DAYS_OF_WEEK = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const EVENT_TYPES = [
  { id: 'custody', label: 'Custódia', icon: 'child_care', color: 'bg-blue-600' },
  { id: 'health', label: 'Consulta', icon: 'medical_services', color: 'bg-orange-500' },
  { id: 'education', label: 'Escola', icon: 'school', color: 'bg-violet-500' },
  { id: 'activity', label: 'Atividade', icon: 'sports', color: 'bg-cyan-500' },
  { id: 'other', label: 'Outro', icon: 'event', color: 'bg-zinc-500' },
]

export default function CalendarPage() {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [municipalityId, setMunicipalityId] = useState('lisboa')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [profile, setProfile] = useState<{ id: string; role: string } | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([])
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventType, setNewEventType] = useState('custody')
  const [isRange, setIsRange] = useState(false)
  const [endDate, setEndDate] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    const supabase = await getSupabaseClient()
    if (!supabase) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('user_id', user.id)
        .single()

      if (!profile) return

      const { data: parentalUnit } = await supabase
        .from('parental_units')
        .select('id')
        .or(`parent_a_id.eq.${profile.id},parent_b_id.eq.${profile.id}`)
        .single()

      if (parentalUnit) {
        console.log('Fetching events for parental unit:', parentalUnit.id)
        const { data: eventsData, error: eventsError } = await supabase
          .from('calendar_events')
          .select('*')
          .eq('parental_unit_id', parentalUnit.id)

        console.log('Events fetched:', eventsData, eventsError)
        setEvents(eventsData || [])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  const monthName = getMonthNamePT(currentMonth)
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const adjustFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

  const generateCalendarDays = (): CalendarDay[] => {
    const days: CalendarDay[] = []
    
    // Empty cells before first day
    for (let i = 0; i < adjustFirstDay; i++) {
      days.push({ date: 0, month: currentMonth, year: currentYear, dateStr: '', events: [], isToday: false })
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${String(currentYear)}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayEvents: CalendarEvent[] = []
      let holiday: string | undefined

      // Check national holidays
      const dateStrShort = `${String(day).padStart(2, '0')}-${String(currentMonth + 1).padStart(2, '0')}`
      const nationalHoliday = NATIONAL_HOLIDAYS_2026.find(h => h.date === dateStrShort)
      if (nationalHoliday) {
        holiday = nationalHoliday.name
      }

      // Check municipal holiday
      const municipalHoliday = getMunicipalityHoliday(municipalityId)
      if (municipalHoliday?.date === dateStrShort) {
        holiday = municipalHoliday.name
      }

      // Check DB events for this day (including multi-day events)
      const dayEventsData = events.filter(e => {
        const eventStartDateStr = e.start_date.split('T')[0]
        const eventEndDateStr = e.end_date ? e.end_date.split('T')[0] : eventStartDateStr
        const currentDayStr = dateStr
        
        return currentDayStr >= eventStartDateStr && currentDayStr <= eventEndDateStr
      })
      dayEvents.push(...dayEventsData)

      const isToday = 
        day === today.getDate() && 
        currentMonth === today.getMonth() && 
        currentYear === today.getFullYear()

      days.push({
        date: day,
        month: currentMonth,
        year: currentYear,
        dateStr,
        events: dayEvents,
        holiday,
        isToday,
      })
    }

    return days
  }

  const calendarDays = generateCalendarDays()

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const getEventColor = (type: string, parent?: string) => {
    // Type-based colors (custody uses parent color)
    if (type === 'custody' && parent) {
      return parent === 'parent_a' ? 'bg-blue-600' : 'bg-teal-600'
    }
    // Type-based colors
    switch (type) {
      case 'health': return 'bg-orange-500'
      case 'education': return 'bg-violet-500'
      case 'activity': return 'bg-cyan-500'
      case 'other': return 'bg-zinc-500'
      case 'national': return 'bg-tertiary'
      case 'municipal': return 'bg-yellow-400'
      default: return 'bg-zinc-400'
    }
  }

  const handleDayClick = (day: CalendarDay) => {
    if (day.date > 0) {
      setSelectedDate(day.dateStr)
      setSelectedDayEvents(day.events)
      setShowAddModal(true)
    }
  }

  const deleteEvent = async (eventId: string) => {
    const supabase = await getSupabaseClient()
    if (!supabase) return

    // Optimistic update - remove from UI immediately
    const remainingEvents = selectedDayEvents.filter(e => e.id !== eventId)
    setSelectedDayEvents(remainingEvents)
    
    // Delete from database
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId)

    if (error) {
      console.error('Error deleting event:', error)
      // Revert if error
      setSelectedDayEvents([...selectedDayEvents])
      return
    }

    // Refresh data
    await fetchEvents()
    
    // Close modal if no events left
    if (remainingEvents.length === 0) {
      setShowAddModal(false)
    }
  }

  const handleAddEvent = async () => {
    if (!newEventTitle.trim() || !selectedDate) return

    const supabase = await getSupabaseClient()
    if (!supabase) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('user_id', user.id)
        .single()

      if (!profile) return

      const { data: parentalUnit } = await supabase
        .from('parental_units')
        .select('id')
        .or(`parent_a_id.eq.${profile.id},parent_b_id.eq.${profile.id}`)
        .single()

      if (!parentalUnit) {
        console.error('No parental unit found for profile:', profile.id)
        return
      }

      const insertData: any = {
          parental_unit_id: parentalUnit.id,
          title: newEventTitle,
          start_date: `${selectedDate}T00:00:00`,
          type: newEventType,
          created_by: profile.id,
          parent: profile.role,
        }
        
        if (isRange && endDate) {
          insertData.end_date = `${endDate}T23:59:59`
        }

      console.log('Inserting calendar event:', insertData)

      const { data, error } = await supabase
        .from('calendar_events')
        .insert(insertData)

      console.log('Insert result:', data, error)

      if (error) {
        console.error('Error inserting event:', error)
      }

      setShowAddModal(false)
      setNewEventTitle('')
      setNewEventType('custody')
      setIsRange(false)
      setEndDate(null)
      
      setTimeout(() => fetchEvents(), 500)
    } catch (error) {
      console.error('Error adding event:', error)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Month Navigation */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-extrabold font-headline tracking-tight">
            {monthName}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={goToPrevMonth}
              className="p-2 rounded-full hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-full hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Municipality Selector */}
        <div className="flex gap-2 flex-wrap">
          {MUNICIPALITIES.slice(0, 10).map((m) => (
            <button
              key={m.id}
              onClick={() => setMunicipalityId(m.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                municipalityId === m.id
                  ? 'bg-primary text-white'
                  : 'bg-surface-container-low text-secondary hover:bg-surface-container-high'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>

        {/* Calendar Card */}
        <Card className="p-4">
          {/* Days Header */}
          <div className="grid grid-cols-7 mb-4">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="text-center text-[10px] font-bold text-secondary uppercase tracking-widest"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-y-2">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                onClick={() => handleDayClick(day)}
                className={`flex flex-col items-center gap-0.5 min-h-[40px] cursor-pointer hover:bg-surface-container-low rounded ${
                  day.date === 0 ? 'invisible' : ''
                }`}
              >
                {day.date > 0 && (
                  <>
                    <span
                      className={`text-xs font-medium ${
                        day.isToday
                          ? 'w-6 h-6 flex items-center justify-center rounded-full bg-primary text-white text-xs'
                          : 'text-on-surface text-xs'
                      }`}
                    >
                      {day.date}
                    </span>
                    {day.events.length > 0 && (
                      <div className="flex gap-1 flex-wrap justify-center">
                        {day.events.slice(0, 3).map((event, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${getEventColor(event.type, event.parent)}`}
                          />
                        ))}
                      </div>
                    )}
                    {day.holiday && (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                        <span className="text-[8px] text-tertiary font-medium truncate max-w-[60px]">
                          {day.holiday}
                        </span>
                      </>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Legend */}
        <Card className="p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-secondary mb-4">
            Legenda
          </h2>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-600" />
              <span className="text-sm text-on-surface-variant font-medium">Progenitor A</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-teal-600" />
              <span className="text-sm text-on-surface-variant font-medium">Progenitor B</span>
            </div>
            <div className="border-t border-outline-variant/30 my-2" />
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-sm text-on-surface-variant font-medium">Consulta</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-violet-500" />
              <span className="text-sm text-on-surface-variant font-medium">Escola</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-cyan-500" />
              <span className="text-sm text-on-surface-variant font-medium">Atividade</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-zinc-500" />
              <span className="text-sm text-on-surface-variant font-medium">Outro</span>
            </div>
            <div className="border-t border-outline-variant/30 my-2" />
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-tertiary" />
              <span className="text-sm text-on-surface-variant font-medium">Feriado Nacional</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="text-sm text-on-surface-variant font-medium">Feriado Municipal</span>
            </div>
          </div>
        </Card>

        {/* Event Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 bg-orange-soft/10 p-3 rounded-xl border-l-4 border-yellow-400">
            <p className="text-[10px] font-bold text-orange-soft uppercase mb-1">Municipal</p>
            <h3 className="text-sm font-bold font-headline">
              {getMunicipalityHoliday(municipalityId)?.name || 'Selecione município'}
            </h3>
            <p className="text-xs text-secondary">
              {getMunicipalityHoliday(municipalityId)?.date || '-'} de {getMonthNamePT(currentMonth)}
            </p>
          </div>
          <div className="bg-primary/5 p-3 rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">child_care</span>
            <div>
              <h3 className="text-xs font-bold text-primary">Próxima Troca</h3>
              <p className="text-[10px] text-primary/80">13 de Abril, 18:00</p>
            </div>
          </div>
          <div className="bg-tertiary/5 p-3 rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-xl">restaurant</span>
            <div>
              <h3 className="text-xs font-bold text-tertiary">Jantar Pai</h3>
              <p className="text-[10px] text-tertiary/80">20 de Abril</p>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-semibold font-headline mb-4">Eventos do dia {selectedDate}</h3>
            
            <div className="space-y-4">
              {/* Existing events */}
              {selectedDayEvents.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs text-secondary">Eventos existentes</label>
                  {selectedDayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`p-3 rounded-lg flex items-center gap-2 ${
                        event.parent === 'parent_a' ? 'bg-blue-50 border border-blue-200' : 
                        event.parent === 'parent_b' ? 'bg-emerald-50 border border-emerald-200' : 
                        'bg-surface-container-low'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${getEventColor(event.type, event.parent)}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-secondary">
                          {event.parent === 'parent_a' ? 'Progenitor A' : event.parent === 'parent_b' ? 'Progenitor B' : 'Evento'}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="p-1.5 rounded-lg hover:bg-red-100 text-red-400"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new event */}
              <div>
                <label className="text-xs text-secondary mb-1 block">Título do evento</label>
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="ex: Dia de descida"
                  className="w-full p-3 rounded-xl border border-outline-variant/30 bg-white"
                />
              </div>

              {/* Range toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRange"
                  checked={isRange}
                  onChange={(e) => {
                    setIsRange(e.target.checked)
                    if (!e.target.checked) setEndDate(null)
                  }}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="isRange" className="text-sm text-secondary">
                  Vários dias (período)
                </label>
              </div>

              {isRange && (
                <div>
                  <label className="text-xs text-secondary mb-1 block">Data fim</label>
                  <input
                    type="date"
                    value={endDate || ''}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={selectedDate || undefined}
                    className="w-full p-3 rounded-xl border border-outline-variant/30 bg-white"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-secondary mb-1 block">Tipo</label>
                <div className="grid grid-cols-3 gap-2">
                  {EVENT_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setNewEventType(type.id)}
                      className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                        newEventType === type.id
                          ? 'bg-primary text-white'
                          : 'bg-surface-container-low text-secondary hover:bg-surface-container-high'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setNewEventTitle('')
                  setNewEventType('custody')
                }}
                className="flex-1 py-3 px-4 rounded-xl border border-outline-variant/30 text-secondary font-medium text-sm hover:bg-surface-container-low transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={handleAddEvent}
                disabled={!newEventTitle.trim()}
                className="flex-1 py-3 px-4 rounded-xl bg-primary text-white font-medium text-sm hover:opacity-90 transition-colors disabled:opacity-50"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}