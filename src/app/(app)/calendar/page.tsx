'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { getMonthNamePT, formatDatePT } from '@/lib/utils'
import { NATIONAL_HOLIDAYS_2026, MUNICIPALITIES, getMunicipalityHoliday } from '@/lib/holidays-pt'

interface CalendarDay {
  date: number
  month: number
  year: number
  dateStr: string
  events: string[]
  holiday?: string
  isToday: boolean
}

const DAYS_OF_WEEK = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

// Demo events
const demoEvents = [
  { date: '2026-04-13', type: 'custody' },
  { date: '2026-04-15', type: 'health' },
  { date: '2026-04-20', type: 'education' },
]

export default function CalendarPage() {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [municipalityId, setMunicipalityId] = useState('lisboa')

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
      const dateStr = `${String(day).padStart(2, '0')}-${String(currentMonth + 1).padStart(2, '0')}`
      const events: string[] = []
      let holiday: string | undefined

      // Check national holidays
      const nationalHoliday = NATIONAL_HOLIDAYS_2026.find(h => h.date === dateStr)
      if (nationalHoliday) {
        holiday = nationalHoliday.name
        events.push('national')
      }

      // Check municipal holiday
      const municipalHoliday = getMunicipalityHoliday(municipalityId)
      if (municipalHoliday?.date === dateStr) {
        holiday = municipalHoliday.name
        events.push('municipal')
      }

      // Check demo events
      const demoEvent = demoEvents.find(e => {
        const eventDate = new Date(e.date)
        return eventDate.getDate() === day && 
               eventDate.getMonth() === currentMonth && 
               eventDate.getFullYear() === currentYear
      })
      if (demoEvent) {
        events.push(demoEvent.type)
      }

      const isToday = 
        day === today.getDate() && 
        currentMonth === today.getMonth() && 
        currentYear === today.getFullYear()

      days.push({
        date: day,
        month: currentMonth,
        year: currentYear,
        dateStr,
        events,
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

  const getEventColor = (type: string) => {
    switch (type) {
      case 'custody': return 'bg-blue-500'
      case 'health': return 'bg-red-400'
      case 'education': return 'bg-purple-500'
      case 'national': return 'bg-tertiary'
      case 'municipal': return 'bg-yellow-400'
      default: return 'bg-gray-400'
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
          <div className="grid grid-cols-7 gap-y-4">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`flex flex-col items-center gap-1 min-h-[60px] ${
                  day.date === 0 ? 'invisible' : ''
                }`}
              >
                {day.date > 0 && (
                  <>
                    <span
                      className={`text-sm font-medium ${
                        day.isToday
                          ? 'w-8 h-8 flex items-center justify-center rounded-full bg-primary text-white'
                          : 'text-on-surface'
                      }`}
                    >
                      {day.date}
                    </span>
                    {day.events.length > 0 && (
                      <div className="flex gap-1 flex-wrap justify-center">
                        {day.events.slice(0, 3).map((event, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${getEventColor(event)}`}
                          />
                        ))}
                      </div>
                    )}
                    {day.holiday && (
                      <span className="text-[8px] text-tertiary font-medium truncate max-w-[60px]">
                        {day.holiday}
                      </span>
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
            Legenda de Eventos
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-on-surface-variant font-medium">Dias de Custódia</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-tertiary" />
              <span className="text-sm text-on-surface-variant font-medium">Feriados Nacionais</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="text-sm text-on-surface-variant font-medium">Feriados Municipais</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-sm text-on-surface-variant font-medium">Eventos Educacionais</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <span className="text-sm text-on-surface-variant font-medium">Eventos de Saúde</span>
            </div>
          </div>
        </Card>

        {/* Event Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 bg-orange-soft/10 p-5 rounded-xl border-l-4 border-yellow-400">
            <p className="text-[10px] font-bold text-orange-soft uppercase mb-1">Municipal</p>
            <h3 className="text-lg font-bold font-headline">
              {getMunicipalityHoliday(municipalityId)?.name || 'Selecione município'}
            </h3>
            <p className="text-xs text-secondary">
              {getMunicipalityHoliday(municipalityId)?.date || '-'} de {getMonthNamePT(currentMonth)}
            </p>
          </div>
          <div className="bg-primary/5 p-4 rounded-xl flex flex-col justify-between aspect-square">
            <span className="material-symbols-outlined text-primary">child_care</span>
            <div>
              <h3 className="text-sm font-bold text-primary">Próxima Troca</h3>
              <p className="text-xs text-primary/80">13 de Abril, 18:00</p>
            </div>
          </div>
          <div className="bg-tertiary/5 p-4 rounded-xl flex flex-col justify-between aspect-square">
            <span className="material-symbols-outlined text-tertiary">restaurant</span>
            <div>
              <h3 className="text-sm font-bold text-tertiary">Jantar Pai</h3>
              <p className="text-xs text-tertiary/80">20 de Abril</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}