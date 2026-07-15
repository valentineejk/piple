import { Badge } from '@/components/ui/badge'
import type { BadgeProps } from '@/components/ui/badge'

const ROLE_VARIANT: Record<string, BadgeProps['variant']> = {
  admin: 'default',
  ceo: 'default',
  procurement: 'secondary',
  employee: 'outline',
}

const STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
  active: 'success',
  on_leave: 'warning',
  inactive: 'secondary',
  terminated: 'destructive',
}

export function RoleBadge({ role }: { role?: string | null }) {
  if (!role) return <span className="text-muted-foreground">—</span>
  return (
    <Badge variant={ROLE_VARIANT[role] ?? 'outline'} className="capitalize">
      {role}
    </Badge>
  )
}

export function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return <span className="text-muted-foreground">—</span>
  return (
    <Badge variant={STATUS_VARIANT[status] ?? 'secondary'} className="capitalize">
      {status.replace('_', ' ')}
    </Badge>
  )
}
