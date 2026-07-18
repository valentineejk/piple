import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useCreateSalaryCode, useUpdateSalaryCode } from '@/lib/hooks'
import type { SalaryCode } from '@/types/api'
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

const schema = z.object({
  level: z.string().min(1, 'Required'),
  // Entered in major units (Naira); converted to minor units on submit.
  amount: z.coerce.number().positive('Must be greater than 0'),
})

type FormValues = z.input<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  salaryCode?: SalaryCode | null
}

export function SalaryCodeFormDialog({ open, onOpenChange, salaryCode }: Props) {
  const isEdit = !!salaryCode
  const createMut = useCreateSalaryCode()
  const updateMut = useUpdateSalaryCode()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (open) {
      reset({
        level: salaryCode?.level ?? '',
        amount: salaryCode ? salaryCode.amount / 100 : ('' as unknown as number),
      })
    }
  }, [open, salaryCode, reset])

  const onSubmit = async (raw: FormValues) => {
    const values = schema.parse(raw)
    const amountMinor = Math.round(values.amount * 100)

    if (isEdit && salaryCode) {
      await updateMut.mutateAsync({
        id: salaryCode.id,
        payload: { level: values.level, amount: amountMinor },
      })
    } else {
      await createMut.mutateAsync({ level: values.level, amount: amountMinor })
    }
    onOpenChange(false)
  }

  const submitting = createMut.isPending || updateMut.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit salary code' : 'New salary code'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the pay level and monthly amount.'
              : 'The code identifier is generated automatically.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {isEdit && (
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={salaryCode?.code ?? ''} readOnly disabled />
              <p className="text-xs text-muted-foreground">
                The code is immutable once generated.
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="level">Level</Label>
            <Input id="level" placeholder="e.g. L3 or Senior" {...register('level')} />
            {errors.level && <p className="text-xs text-destructive">{errors.level.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Monthly amount (₦)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="450000"
              {...register('amount')}
            />
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Save changes' : 'Create code'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
