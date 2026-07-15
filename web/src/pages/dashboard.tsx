import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  UserCog,
  Users,
  UserSquare,
} from 'lucide-react'
import { useAuth } from '@/features/auth/auth-context'
import { useHealth, useUsers } from '@/lib/hooks'
import { PageHeader } from '@/components/page-header'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Role } from '@/types/api'

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  loading?: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { user, role } = useAuth()
  const isAdmin = role === 'admin'
  const { data: usersData, isLoading } = useUsers({})
  const { data: health, isError: healthError } = useHealth()

  const users = usersData?.data ?? []
  const total = usersData?.meta?.total ?? users.length
  const countByRole = (r: Role) => users.filter((u) => u.role === r).length

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.first_name ?? ''}`}
        description="Overview of your payroll workspace."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isAdmin && (
          <>
            <StatCard label="Total users" value={total} icon={Users} loading={isLoading} />
            <StatCard
              label="Employees"
              value={countByRole('employee')}
              icon={UserSquare}
              loading={isLoading}
            />
            <StatCard
              label="Procurement"
              value={countByRole('procurement')}
              icon={UserCog}
              loading={isLoading}
            />
            <StatCard
              label="Admins & CEO"
              value={countByRole('admin') + countByRole('ceo')}
              icon={ShieldCheck}
              loading={isLoading}
            />
          </>
        )}
        {!isAdmin && (
          <Card className="sm:col-span-2 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Your role
              </CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="text-base capitalize">
                {role}
              </Badge>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              API status
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={health && !healthError ? 'success' : 'destructive'}>
              {health && !healthError ? 'Operational' : 'Unreachable'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Jump to the most common tasks.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {isAdmin && (
              <Button asChild variant="outline" className="justify-between">
                <Link to="/users">
                  Manage users <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" className="justify-between">
              <Link to="/employees">
                Manage employees <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between">
              <Link to="/profile">
                View your profile <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting started</CardTitle>
            <CardDescription>How the payroll workspace fits together.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Users</span> are login accounts with a
              role. Admins create and manage them.
            </p>
            <p>
              <span className="font-medium text-foreground">Employees</span> extend a user with
              payroll details — bank account, salary level and department.
            </p>
            <p>
              Payouts, wallet top-ups and payment requests run on top of these records.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
