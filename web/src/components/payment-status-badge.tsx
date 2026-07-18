import { Badge } from '@/components/ui/badge'
import type { BadgeProps } from '@/components/ui/badge'

const VARIANT: Record<string, BadgeProps['variant']> = {
  pending: 'warning',
  processing: 'secondary',
  approved: 'success',
  completed: 'success',
  success: 'success',
  rejected: 'destructive',
  failed: 'destructive',
  insufficient_funds: 'destructive',
}

export function PaymentStatusBadge({ status }: { status?: string | null }) {
  if (!status) return <span className="text-muted-foreground">—</span>
  return (
    <Badge variant={VARIANT[status] ?? 'secondary'} className="capitalize">
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}
