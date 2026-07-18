import { useState } from 'react'
import { ArrowDownLeft, Plus, Wallet as WalletIcon } from 'lucide-react'
import { toast } from 'sonner'
import { formatDateTime, formatMoney } from '@/lib/format'
import { mockTopups, mockWallet, newId, type TopupMock } from '@/lib/mock-data'
import { PageHeader } from '@/components/page-header'
import { PaymentStatusBadge } from '@/components/payment-status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function WalletPage() {
  const [balance] = useState(mockWallet.balance)
  const [topups, setTopups] = useState<TopupMock[]>(mockTopups)
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')

  const pendingTotal = topups
    .filter((t) => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0)

  const initiate = () => {
    const naira = Number(amount)
    if (!naira || naira <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    const topup: TopupMock = {
      id: newId('t'),
      amount: Math.round(naira * 100),
      status: 'pending',
      channel: null,
      reference: newId('psref'),
      initiated_by: 'You',
      created_at: new Date().toISOString(),
    }
    setTopups((prev) => [topup, ...prev])
    setOpen(false)
    setAmount('')
    toast.success('Top-up initialized — redirect to Paystack checkout (demo)')
  }

  return (
    <div>
      <PageHeader title="Wallet" description="Company balance and top-up history.">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> Fund wallet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Fund wallet</DialogTitle>
              <DialogDescription>
                Initialize a Paystack checkout to top up the company wallet.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                placeholder="500000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={initiate}>Continue to checkout</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="sm:col-span-2 lg:col-span-1 bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium opacity-90">
              <WalletIcon className="h-4 w-4" /> Available balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{formatMoney(balance)}</div>
            <p className="mt-1 text-xs opacity-80">
              Updated {formatDateTime(mockWallet.updated_at)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending top-ups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(pendingTotal)}</div>
            <p className="mt-1 text-xs text-muted-foreground">Awaiting Paystack confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top-ups this month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topups.filter((t) => t.created_at >= '2026-07-01').length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">July 2026</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowDownLeft className="h-4 w-4" /> Top-up history
          </CardTitle>
          <CardDescription>Funds added to the company wallet.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Initiated by</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topups.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.reference}</TableCell>
                  <TableCell>{t.initiated_by}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">
                    {t.channel?.replace('_', ' ') ?? '—'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(t.amount)}
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={t.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(t.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
