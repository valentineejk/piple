import { api } from './api'
import type {
  CreateEmployeeRequest,
  CreateSalaryCodeRequest,
  CreateUserRequest,
  Employee,
  LoginResponse,
  PaginatedMeta,
  SalaryCode,
  UpdateEmployeeRequest,
  UpdateSalaryCodeRequest,
  UpdateUserRequest,
  User,
} from '@/types/api'

// ---------------- Auth ----------------
export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
    return data
  },
  async register(payload: {
    first_name: string
    last_name: string
    email: string
    password: string
  }) {
    const { data } = await api.post('/auth/register', payload)
    return data
  },
  async logout(refresh_token: string) {
    const { data } = await api.post('/auth/logout', { refresh_token })
    return data
  },
}

// ---------------- Users ----------------
interface UsersListResponse {
  data: User[]
  meta: PaginatedMeta
}

export interface UserFilters {
  role?: string
  status?: string
}

export const usersService = {
  async list(filters: UserFilters = {}): Promise<UsersListResponse> {
    const { data } = await api.get<UsersListResponse>('/users', { params: filters })
    return data
  },
  async me(): Promise<User> {
    const { data } = await api.get<{ data: User }>('/users/me')
    return data.data
  },
  async get(id: string): Promise<User> {
    const { data } = await api.get<{ data: User }>(`/users/${id}`)
    return data.data
  },
  async create(payload: CreateUserRequest): Promise<User> {
    const { data } = await api.post<{ data: User }>('/users', payload)
    return data.data
  },
  async update(id: string, payload: UpdateUserRequest): Promise<User> {
    const { data } = await api.patch<{ data: User }>(`/users/${id}`, payload)
    return data.data
  },
  async remove(id: string): Promise<User> {
    const { data } = await api.delete<{ data: User }>(`/users/${id}`)
    return data.data
  },
}

// ---------------- Employees ----------------
export const employeesService = {
  async create(payload: CreateEmployeeRequest): Promise<Employee> {
    const { data } = await api.post<{ data: Employee }>('/employees', payload)
    return data.data
  },
  async update(id: string, payload: UpdateEmployeeRequest): Promise<Employee> {
    const { data } = await api.patch<{ data: Employee }>(`/employees/${id}`, payload)
    return data.data
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/employees/${id}`)
  },
}

// ---------------- Salary codes ----------------
interface SalaryCodesListResponse {
  data: SalaryCode[]
  meta: PaginatedMeta
}

export interface SalaryCodeFilters {
  level?: string
  page?: number
  limit?: number
}

export const salaryCodesService = {
  async list(filters: SalaryCodeFilters = {}): Promise<SalaryCodesListResponse> {
    const { data } = await api.get<SalaryCodesListResponse>('/salary-codes', {
      params: filters,
    })
    return data
  },
  async get(id: string): Promise<SalaryCode> {
    const { data } = await api.get<{ data: SalaryCode }>(`/salary-codes/${id}`)
    return data.data
  },
  async create(payload: CreateSalaryCodeRequest): Promise<SalaryCode> {
    const { data } = await api.post<{ data: SalaryCode }>('/salary-codes', payload)
    return data.data
  },
  async update(id: string, payload: UpdateSalaryCodeRequest): Promise<SalaryCode> {
    const { data } = await api.patch<{ data: SalaryCode }>(`/salary-codes/${id}`, payload)
    return data.data
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/salary-codes/${id}`)
  },
}

// ---------------- Health ----------------
export const systemService = {
  async health(): Promise<unknown> {
    const { data } = await api.get('/health')
    return data
  },
}
