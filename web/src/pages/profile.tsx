import { useAuth } from '@/features/auth/auth-context'
import { formatDate, initials } from '@/lib/format'
import { PageHeader } from '@/components/page-header'
import { RoleBadge, StatusBadge } from '@/components/role-badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{children}</span>
    </div>
  )
}

export function ProfilePage() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <div>
      <PageHeader title="Profile" description="Your account details." />
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-xl">
                {initials(user.first_name, user.last_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <RoleBadge role={user.role} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Account information</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Row label="User ID">
              <span className="font-mono text-xs">{user.id}</span>
            </Row>
            <Separator />
            <Row label="First name">{user.first_name}</Row>
            <Separator />
            <Row label="Last name">{user.last_name}</Row>
            <Separator />
            <Row label="Email">{user.email}</Row>
            <Separator />
            <Row label="Role">
              <RoleBadge role={user.role} />
            </Row>
            <Separator />
            <Row label="Status">
              <StatusBadge status={user.status} />
            </Row>
            <Separator />
            <Row label="Member since">{formatDate(user.created_at)}</Row>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
