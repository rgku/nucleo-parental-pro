'use client'

import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { cn, centsToEuros, formatDatePT, formatTimePT } from '@/lib/utils'

// Demo data - will be replaced with Supabase data
const demoBalance = {
  balance: 45000, // €450 positive
  yourExpenses: 120000, // €1200
  otherExpenses: 75000, // €750
}

const demoNextEvent = {
  title: 'Troca de Turno: Lucas',
  date: '2026-04-13T18:00:00',
  location: 'Escola Primária Central',
}

const demoAlert = {
  title: 'Assinatura necessária',
  message: 'Autorização escolar requer validação até amanhã.',
}

export default function DashboardPage() {
  const isPositive = demoBalance.balance >= 0

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <section>
          <h1 className="text-3xl font-extrabold font-headline tracking-tight">
            Bom dia, André.
          </h1>
          <p className="text-secondary mt-1">
            Aqui está o resumo da sua coparentalidade.
          </p>
        </section>

        {/* Alert Card */}
        <section className="bg-orange-soft/10 rounded-xl p-4 border-l-4 border-orange-soft">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-orange-soft" style={{ fontVariationSettings: "'FILL' 1" }}>
              warning
            </span>
            <div>
              <h3 className="font-semibold text-on-surface text-sm">{demoAlert.title}</h3>
              <p className="text-secondary text-xs mt-0.5">{demoAlert.message}</p>
            </div>
          </div>
        </section>

        {/* Balance Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <span className="material-symbols-outlined text-6xl">account_balance_wallet</span>
          </div>
          <div className="relative z-10">
            <span className="text-xs font-medium uppercase tracking-wider text-secondary">
              Balanço Financeiro
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={cn(
                'text-3xl font-extrabold font-headline tracking-tighter',
                isPositive ? 'text-tertiary' : 'text-orange-soft'
              )}>
                {centsToEuros(Math.abs(demoBalance.balance))}
              </span>
              <span className={cn(
                'text-sm font-medium',
                isPositive ? 'text-tertiary' : 'text-orange-soft'
              )}>
                {isPositive ? 'a receber' : 'a pagar'}
              </span>
            </div>
            <div className="mt-4 flex gap-4">
              <div className="bg-surface-container-low rounded-lg px-3 py-2 flex-1">
                <span className="block text-[10px] text-secondary uppercase">Suas Despesas</span>
                <span className="text-sm font-semibold text-on-surface">{centsToEuros(demoBalance.yourExpenses)}</span>
              </div>
              <div className="bg-surface-container-low rounded-lg px-3 py-2 flex-1">
                <span className="block text-[10px] text-secondary uppercase">Parte Outro</span>
                <span className="text-sm font-semibold text-on-surface">{centsToEuros(demoBalance.otherExpenses)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Next Event Card */}
        <Card>
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-medium uppercase tracking-wider text-secondary">
              Próxima Custódia
            </span>
            <div className="bg-tertiary/10 text-tertiary px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter">
              Confirmado
            </div>
          </div>
          <h2 className="text-xl font-bold font-headline">{demoNextEvent.title}</h2>
          <div className="mt-2 flex items-center gap-2 text-secondary">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            <span className="text-sm">{formatDatePT(demoNextEvent.date)}</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-secondary">
            <span className="material-symbols-outlined text-sm">schedule</span>
            <span className="text-sm">{formatTimePT(demoNextEvent.date)} • {demoNextEvent.location}</span>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center">
                <span className="material-symbols-outlined text-sm text-secondary">person</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center border-2 border-white">
                <span className="material-symbols-outlined text-sm text-secondary">person</span>
              </div>
            </div>
            <span className="text-xs text-secondary">Encontro com Mariana</span>
          </div>
        </Card>

        {/* Quick Actions */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest px-1">
            Ações Rápidas
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="bg-gradient-to-br from-primary to-primary-container text-white rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-primary/10">
              <span className="material-symbols-outlined text-2xl">add_card</span>
              <span className="text-xs font-medium tracking-wide">Nova Despesa</span>
            </button>
            <button className="bg-surface-container-highest text-on-surface rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-transform active:scale-95">
              <span className="material-symbols-outlined text-2xl">chat</span>
              <span className="text-xs font-medium tracking-wide">Mensagem</span>
            </button>
            <button className="bg-surface-container-highest text-on-surface rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-transform active:scale-95">
              <span className="material-symbols-outlined text-2xl">event_available</span>
              <span className="text-xs font-medium tracking-wide">Troca Evento</span>
            </button>
            <button className="bg-surface-container-highest text-on-surface rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-transform active:scale-95">
              <span className="material-symbols-outlined text-2xl">folder_shared</span>
              <span className="text-xs font-medium tracking-wide">Documentos</span>
            </button>
          </div>
        </section>
      </div>
    </AppLayout>
  )
}