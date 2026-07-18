import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from './api'
import {
  employeesService,
  salaryCodesService,
  systemService,
  usersService,
  type SalaryCodeFilters,
  type UserFilters,
} from './services'
import type {
  CreateEmployeeRequest,
  CreateSalaryCodeRequest,
  CreateUserRequest,
  UpdateEmployeeRequest,
  UpdateSalaryCodeRequest,
  UpdateUserRequest,
} from '@/types/api'

export const qk = {
  users: (filters: UserFilters) => ['users', filters] as const,
  user: (id: string) => ['users', id] as const,
  me: ['me'] as const,
  health: ['health'] as const,
  salaryCodes: (filters: SalaryCodeFilters) => ['salary-codes', filters] as const,
}

// ---------------- Users ----------------
export function useUsers(filters: UserFilters) {
  return useQuery({
    queryKey: qk.users(filters),
    queryFn: () => usersService.list(filters),
  })
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: qk.user(id ?? ''),
    queryFn: () => usersService.get(id as string),
    enabled: !!id,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateUserRequest) => usersService.create(payload),
    onSuccess: () => {
      toast.success('User created')
      void qc.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserRequest }) =>
      usersService.update(id, payload),
    onSuccess: () => {
      toast.success('User updated')
      void qc.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => usersService.remove(id),
    onSuccess: () => {
      toast.success('User deleted')
      void qc.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}

// ---------------- Employees ----------------
export function useCreateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateEmployeeRequest) => employeesService.create(payload),
    onSuccess: () => {
      toast.success('Employee record created')
      void qc.invalidateQueries({ queryKey: ['employees'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}

export function useUpdateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEmployeeRequest }) =>
      employeesService.update(id, payload),
    onSuccess: () => {
      toast.success('Employee record updated')
      void qc.invalidateQueries({ queryKey: ['employees'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}

export function useDeleteEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => employeesService.remove(id),
    onSuccess: () => {
      toast.success('Employee record deleted')
      void qc.invalidateQueries({ queryKey: ['employees'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}

// ---------------- Salary codes ----------------
export function useSalaryCodes(filters: SalaryCodeFilters) {
  return useQuery({
    queryKey: qk.salaryCodes(filters),
    queryFn: () => salaryCodesService.list(filters),
  })
}

export function useCreateSalaryCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSalaryCodeRequest) => salaryCodesService.create(payload),
    onSuccess: (created) => {
      toast.success(`Salary code ${created.code} created`)
      void qc.invalidateQueries({ queryKey: ['salary-codes'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}

export function useUpdateSalaryCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSalaryCodeRequest }) =>
      salaryCodesService.update(id, payload),
    onSuccess: () => {
      toast.success('Salary code updated')
      void qc.invalidateQueries({ queryKey: ['salary-codes'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}

export function useDeleteSalaryCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => salaryCodesService.remove(id),
    onSuccess: () => {
      toast.success('Salary code deleted')
      void qc.invalidateQueries({ queryKey: ['salary-codes'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}

// ---------------- Health ----------------
export function useHealth() {
  return useQuery({
    queryKey: qk.health,
    queryFn: () => systemService.health(),
    refetchInterval: 30_000,
    retry: false,
  })
}
