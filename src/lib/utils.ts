import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================
// FINANCIAL UTILITIES (CENTS LOGIC)
// ============================================

/**
 * Convert cents to formatted euros string
 * @param cents - Amount in cents (e.g., 12350 = €123,50)
 */
export function centsToEuros(cents: number): string {
  const euros = cents / 100
  return euros.toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  })
}

/**
 * Convert euros input to cents (for storage)
 * @param euros - Amount in euros (e.g., 123.50)
 */
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100)
}

/**
 * Format cents to display string (e.g., "€123,50")
 */
export function formatCents(cents: number): string {
  return centsToEuros(cents)
}

/**
 * Calculate user balance from expenses
 * @param totalExpenses - Total expenses in cents
 * @param paidByUser - Amount user paid in cents
 * @param splitRatio - Split ratio (default 0.5 = 50%)
 */
export function calculateUserBalance(
  totalExpenses: number,
  paidByUser: number,
  splitRatio: number = 0.5
): number {
  const userShare = Math.round(totalExpenses * splitRatio)
  return paidByUser - userShare
}

// ============================================
// DATE UTILITIES (PORTUGAL)
// ============================================

/**
 * Format date to Portuguese format
 */
export function formatDatePT(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Format date short (pt-PT)
 */
export function formatDateShortPT(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'short',
  })
}

/**
 * Format time (pt-PT)
 */
export function formatTimePT(date: Date | string): string {
  if (typeof date === 'string' && date.includes('T')) {
    const timePart = date.split('T')[1]
    if (timePart) {
      const hourMinute = timePart.split(':')
      if (hourMinute.length >= 2) {
        return `${hourMinute[0]}:${hourMinute[1]}`
      }
    }
  }
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Get day of week in Portuguese
 */
export function getDayOfWeekPT(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  return days[d.getDay()]
}

/**
 * Get month name in Portuguese
 */
export function getMonthNamePT(month: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ]
  return months[month]
}

// ============================================
// EXPENSE CATEGORY ICONS
// ============================================

export const expenseCategoryIcons: Record<string, string> = {
  education: 'school',
  health: 'medical_services',
  food: 'restaurant',
  clothing: 'checkroom',
  leisure: 'celebration',
  transport: 'directions_car',
  housing: 'home',
  other: 'category',
}

export const expenseCategoryLabels: Record<string, string> = {
  education: 'Educação',
  health: 'Saúde',
  food: 'Alimentação',
  clothing: 'Vestuário',
  leisure: 'Lazer',
  transport: 'Transporte',
  housing: 'Habitação',
  other: 'Outros',
}

// ============================================
// EVENT TYPE COLORS
// ============================================

export const eventTypeColors: Record<string, string> = {
  custody: 'bg-blue-500',
  health: 'bg-red-400',
  education: 'bg-purple-500',
  holiday: 'bg-tertiary',
  activity: 'bg-orange-soft',
}

// ============================================
// MESSAGE TONE COLORS
// ============================================

export const messageToneColors: Record<string, string> = {
  positive: 'bg-tertiary',
  neutral: 'bg-surface-container-high',
  negative: 'bg-orange-soft',
}

// ============================================
// VALIDATION
// ============================================

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPassword(password: string): boolean {
  return password.length >= 6
}

// ============================================
// LOCAL STORAGE
// ============================================

export function getFromLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  const item = localStorage.getItem(key)
  return item ? JSON.parse(item) : defaultValue
}

export function setToLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

export function removeFromLocalStorage(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(key)
}