import { useMemo, useState } from 'react'
import { Banknote, Play, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate, formatMoney } from '@/lib/format'
import { mockPayouts, type PayoutMock } from '@/lib/mock-data'
import { PageHeader } from '@/components/page-header'
import { PaymentStatusBadge } from '@/components/payment-status-badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const ALL = 'all'

export function PayoutsPage() {
  const [rows, setRows] = useState<PayoutMock[]>(mockPayouts)
  const [period, setPeriod] = useState(ALL)
  const [running, setRunning] = useState(false)

  const periods = useMemo(
    () => Array.from(new Set(mockPayouts.map((p) => p.pay_period))).sort().reverse(),
    [],
  )

  const filtered = period === ALL ? rows : rows.filter((r) => r.pay_period === period)

  const totals = {
    completed: filtered.filter((r) => r.status === 'completed').length,
    processing: filtered.filter((r) => r.status === 'processing').length,
    failed: filtered.filter((r) => ['failed', 'insufficient_funds'].includes(r.status)).length,
    amount: filtered
      .filter((r) => r.status === 'completed')
      .reduce((s, r) => s + r.amount, 0),
  }

  const runBatch = () => {
    setRunning(true)
    toast.info('Running payout batch…')
    setTimeout(() => {
      setRows((prev) =>
        prev.map((r) => (r.status === 'processing' ? { ...r, status: 'completed' } : r)),
      )
      setRunning(false)
      toast.success('Payout batch complete')
    }, 1200)
  }

  const retry = (r: PayoutMock) => {
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: 'processing' } : x)))
    toast.success(`Retrying payout for ${r.employee}`)
    setTimeout(() => {
      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: 'completed' } : x)))
    }, 1200)
  }

  return (
    <div>
      <PageHeader title="Payouts" description="Monthly salary disbursement runs.">
        <Button onClick={runBatch} disabled={running}>
          <Play className="h-4 w-4" /> {running ? 'Running…' : 'Run payouts'}
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Paid this period" value={formatMoney(totals.amount)} />
        <StatCard label="Completed" value={totals.completed} />
        <StatCard label="Processing" value={totals.processing} />
        <StatCard label="Needs attention" value={totals.failed} />
      </div>

      <div className="my-4 flex items-center gap-3">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Pay period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All periods</SelectItem>
            {periods.map((p) => (
              <SelectItem key={p} value={p}>
                {formatDate(p)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Pay period</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.employee}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(r.pay_period)}
                </TableCell>
                <TableCell className="text-right font-medium">{formatMoney(r.amount)}</TableCell>
                <TableCell>
                  <PaymentStatusBadge status={r.status} />
                </TableCell>
                <TableCell className="text-right">
                  {['failed', 'insufficient_funds'].includes(r.status) ? (
                    <Button size="sm" variant="outline" onClick={() => retry(r)}>
                      <RefreshCw className="h-4 w-4" /> Retry
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Banknote className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}
