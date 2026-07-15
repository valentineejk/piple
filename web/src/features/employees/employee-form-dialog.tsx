import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useCreateEmployee, useUpdateEmployee, useUsers } from '@/lib/hooks'
import { uuidToString } from '@/lib/format'
import { useAuth } from '@/features/auth/auth-context'
import {
  EMPLOYEE_STATUSES,
  type CreateEmployeeRequest,
  type Employee,
  type EmployeeStatus,
} from '@/types/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const optionalStr = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== '' ? v : undefined))

const schema = z.object({
  user_id: z.string().min(1, 'Required'),
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  dial_code: z.string().min(1, 'Required'),
  phone: z.string().min(1, 'Required'),
  salary_code_id: z.string().min(1, 'Required'),
  status: z.enum(['active', 'inactive', 'terminated', 'on_leave']).optional(),
  level: optionalStr,
  department: optionalStr,
  country: optionalStr,
  state: optionalStr,
  address: optionalStr,
  bank_name: optionalStr,
  bank_code: optionalStr,
  account_number: optionalStr,
  hired_at: optionalStr,
})

type FormValues = z.input<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee?: Employee | null
  onSaved?: (employee: Employee) => void
}

export function EmployeeFormDialog({ open, onOpenChange, employee, onSaved }: Props) {
  const isEdit = !!employee
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const createMut = useCreateEmployee()
  const updateMut = useUpdateEmployee()

  // Only admins can list users; others type the user_id directly.
  const { data: usersData } = useUsers(isAdmin && open ? { role: 'employee' } : {})
  const users = isAdmin ? usersData?.data ?? [] : []

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (open) {
      reset({
        user_id: employee ? uuidToString(employee.user_id) : '',
        first_name: employee?.first_name ?? '',
        last_name: employee?.last_name ?? '',
        dial_code: employee?.dial_code ?? '+234',
        phone: employee?.phone ?? '',
        salary_code_id: employee ? uuidToString(employee.salary_code_id) : '',
        status: (employee?.status as EmployeeStatus) ?? 'active',
        level: employee?.level ?? '',
        department: employee?.department ?? '',
        country: employee?.country ?? '',
        state: employee?.state ?? '',
        address: employee?.address ?? '',
        bank_name: employee?.bank_name ?? '',
        bank_code: employee?.bank_code ?? '',
        account_number: employee?.account_number ?? '',
        hired_at: '',
      })
    }
  }, [open, employee, reset])

  const userId = watch('user_id')
  const status = watch('status')

  const onSubmit = async (raw: FormValues) => {
    const values = schema.parse(raw)
    const hiredAt = values.hired_at
      ? { Time: new Date(values.hired_at).toISOString(), Valid: true }
      : undefined

    let saved: Employee
    if (isEdit && employee) {
      saved = await updateMut.mutateAsync({
        id: uuidToString(employee.id),
        payload: {
          first_name: values.first_name,
          last_name: values.last_name,
          dial_code: values.dial_code,
          phone: values.phone,
          salary_code_id: values.salary_code_id,
          status: values.status,
          level: values.level,
          department: values.department,
          country: values.country,
          state: values.state,
          address: values.address,
          bank_name: values.bank_name,
          bank_code: values.bank_code,
          account_number: values.account_number,
          ...(hiredAt ? { hired_at: hiredAt } : {}),
        },
      })
    } else {
      const payload: CreateEmployeeRequest = {
        user_id: values.user_id,
        first_name: values.first_name,
        last_name: values.last_name,
        dial_code: values.dial_code,
        phone: values.phone,
        salary_code_id: values.salary_code_id,
        level: values.level,
        department: values.department,
        country: values.country,
        state: values.state,
        address: values.address,
        bank_name: values.bank_name,
        bank_code: values.bank_code,
        account_number: values.account_number,
        ...(hiredAt ? { hired_at: hiredAt } : {}),
      }
      saved = await createMut.mutateAsync(payload)
    }
    onSaved?.(saved)
    onOpenChange(false)
  }

  const submitting = createMut.isPending || updateMut.isPending

  const field = (name: keyof FormValues, label: string, placeholder?: string) => (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} placeholder={placeholder} {...register(name)} />
      {errors[name] && <p className="text-xs text-destructive">{errors[name]?.message}</p>}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit employee' : 'New employee record'}</DialogTitle>
          <DialogDescription>
            Payroll details linked to a user account. Salary code and bank details drive payouts.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Linked user */}
          <div className="space-y-2">
            <Label>Linked user</Label>
            {isAdmin && !isEdit ? (
              <Select value={userId} onValueChange={(v) => setValue('user_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user account" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.first_name} {u.last_name} — {u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="User UUID"
                readOnly={isEdit}
                {...register('user_id')}
              />
            )}
            {errors.user_id && (
              <p className="text-xs text-destructive">{errors.user_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field('first_name', 'First name')}
            {field('last_name', 'Last name')}
            {field('dial_code', 'Dial code', '+234')}
            {field('phone', 'Phone', '8012345678')}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="salary_code_id">Salary code ID</Label>
              <Input
                id="salary_code_id"
                placeholder="Salary code UUID"
                {...register('salary_code_id')}
              />
              {errors.salary_code_id && (
                <p className="text-xs text-destructive">{errors.salary_code_id.message}</p>
              )}
            </div>
            {field('level', 'Level', 'e.g. L3')}
            {field('department', 'Department', 'Engineering')}
            {isEdit && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setValue('status', v as EmployeeStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="hired_at">Hired at</Label>
              <Input id="hired_at" type="date" {...register('hired_at')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field('country', 'Country')}
            {field('state', 'State')}
          </div>
          {field('address', 'Address')}

          <div className="grid grid-cols-3 gap-3">
            {field('bank_name', 'Bank name')}
            {field('bank_code', 'Bank code')}
            {field('account_number', 'Account number')}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Save changes' : 'Create record'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
