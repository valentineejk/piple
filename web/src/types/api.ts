// Types mirroring the Go backend (piple) JSON contracts.

export type Role = 'employee' | 'procurement' | 'ceo' | 'admin'
export const ROLES: Role[] = ['employee', 'procurement', 'ceo', 'admin']

export type EmployeeStatus = 'active' | 'inactive' | 'terminated' | 'on_leave'
export const EMPLOYEE_STATUSES: EmployeeStatus[] = [
  'active',
  'inactive',
  'terminated',
  'on_leave',
]

export interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  role: Role
  status: string
  created_at?: string | null
  deleted_at?: string | null
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
}

export interface PaginatedMeta {
  page: number
  limit: number
  total: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface CreateUserRequest {
  first_name: string
  last_name: string
  email: string
  password: string
  role: Role
}

export interface UpdateUserRequest {
  first_name?: string
  last_name?: string
  email?: string
  role?: Role
}

// The employees table stores id/user_id/salary_code_id as pgtype.UUID which
// serialises to { Bytes: [...], Valid: bool } unless it's a plain string.
// The write endpoints echo back the raw row, so we keep the shape permissive.
export interface Employee {
  id: string | PgUUID
  user_id: string | PgUUID
  first_name: string
  last_name: string
  dial_code: string
  phone: string
  resume?: string | null
  country?: string | null
  address?: string | null
  state?: string | null
  status: string
  level?: string | null
  salary_code_id: string | PgUUID
  department?: string | null
  bank_name?: string | null
  bank_code?: string | null
  account_number?: string | null
  hired_at?: PgTimestamp
  updated_at?: PgTimestamp
  created_at?: PgTimestamp
}

export interface PgUUID {
  Bytes?: number[]
  Valid: boolean
}

export interface PgTimestamp {
  Time: string
  Valid: boolean
}

export interface CreateEmployeeRequest {
  user_id: string
  first_name: string
  last_name: string
  dial_code: string
  phone: string
  salary_code_id: string
  resume?: string | null
  country?: string | null
  address?: string | null
  state?: string | null
  level?: string | null
  department?: string | null
  bank_name?: string | null
  bank_code?: string | null
  account_number?: string | null
  hired_at?: PgTimestamp
}

export type UpdateEmployeeRequest = Partial<
  Omit<CreateEmployeeRequest, 'user_id'> & { status: EmployeeStatus }
>

// ---------------- Salary codes ----------------
export interface SalaryCode {
  id: string
  code: string
  level: string
  amount: number
}

export interface CreateSalaryCodeRequest {
  level: string
  amount: number
}

export interface UpdateSalaryCodeRequest {
  level?: string
  amount?: number
}

export interface ApiError {
  code?: number
  message?: string
  error?: string
}
