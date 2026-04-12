// ============================================
// NÚCLEO PARENTAL PRO - TypeScript Types
// ============================================

// ============ ENUMS ============

export type UserRole = 'parent_a' | 'parent_b'

export type ExpenseCategory = 
  | 'education' 
  | 'health' 
  | 'food' 
  | 'clothing' 
  | 'leisure' 
  | 'transport' 
  | 'housing' 
  | 'other'

export type ExpenseStatus = 'pending' | 'paid' | 'disputed'

export type EventType = 
  | 'custody' 
  | 'health' 
  | 'education' 
  | 'holiday' 
  | 'activity'

export type MessageTone = 'positive' | 'neutral' | 'negative'

// ============ USER & PROFILE ============

export interface User {
  id: string
  email: string
  created_at: string
}

export interface Profile {
  id: string
  user_id: string
  name: string
  role: UserRole
  avatar_url?: string
  municipality_id?: string
  created_at: string
  updated_at: string
}

// ============ PARENTAL UNIT ============

export interface ParentalUnit {
  id: string
  agreement_name: string
  parent_a_id: string
  parent_b_id: string
  municipality_id: string
  created_at: string
}

// ============ CHILDREN ============

export interface Child {
  id: string
  parental_unit_id: string
  name: string
  birth_date: string
  created_at: string
}

// ============ CALENDAR EVENTS ============

export interface CalendarEvent {
  id: string
  parental_unit_id: string
  title: string
  description?: string
  start_date: string
  end_date?: string
  type: EventType
  created_by: string
  created_at: string
}

// ============ EXPENSES ============

export interface Expense {
  id: string
  parental_unit_id: string
  description: string
  amount_cents: number
  category: ExpenseCategory
  paid_by_id: string
  split_ratio: number
  status: ExpenseStatus
  requires_approval: boolean
  approved_by?: string
  created_at: string
  updated_at: string
}

// ============ MESSAGES ============

export interface Message {
  id: string
  parental_unit_id: string
  sender_id: string
  content: string
  original_content?: string
  is_mediated: boolean
  tone?: MessageTone
  created_at: string
}

// ============ MUNICIPALITIES (PORTUGAL) ============

export interface Municipality {
  id: string
  name: string
  holiday_date: string
  holiday_name: string
}

// ============ HOLIDAYS 2026 (PORTUGAL) ============

export interface Holiday {
  date: string
  name: string
  type: 'national' | 'municipal'
  municipality?: string
}

// ============ API RESPONSES ============

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// ============ DASHBOARD STATS ============

export interface DashboardStats {
  balance: number // in cents
  totalExpenses: number
  expensesPaidByUser: number
  expensesPaidByOther: number
  nextEvent?: CalendarEvent
  pendingApprovals: number
}

// ============ CHAT MEDIATION ============

export interface MediationRequest {
  content: string
  parental_unit_id: string
  sender_id: string
}

export interface MediationResponse {
  original_content: string
  mediated_content: string
  tone: MessageTone
  should_suggest_rewrite: boolean
}

// ============ EXPENSE FORM DATA ============

export interface ExpenseFormData {
  description: string
  amount_cents: number
  category: ExpenseCategory
  paid_by_id: string
  split_ratio: number
}

// ============ NOTIFICATION TYPES ============

export type NotificationType = 
  | 'new_expense'
  | 'new_event'
  | 'custody_swap_reminder'
  | 'approval_request'
  | 'message_received'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  created_at: string
}