import { useState } from 'react'
import { Check, FileText, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate, formatMoney } from '@/lib/format'
import {
  mockPaymentRequests,
  newId,
  type PaymentRequestMock,
} from '@/lib/mock-data'
import { PageHeader } from '@/components/page-header'
import { PaymentStatusBadge } from '@/components/payment-status-badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const ALL = 'all'

export function PaymentRequestsPage() {
  const [rows, setRows] = useState<PaymentRequestMock[]>(mockPaymentRequests)
  const [status, setStatus] = useState(ALL)
  const [createOpen, setCreateOpen] = useState(false)
  const [rejecting, setRejecting] = useState<PaymentRequestMock | null>(null)
  const [reason, setReason] = useState('')

  // create form
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [bankCode, setBankCode] = useState('')

  const filtered = status === ALL ? rows : rows.filter((r) => r.status === status)
  const pendingCount = rows.filter((r) => r.status === 'pending').length

  const submitCreate = () => {
    const naira = Number(amount)
    if (!naira || naira <= 0) return toast.error('Enter a valid amount')
    if (!description.trim()) return toast.error('Description is required')
    const row: PaymentRequestMock = {
      id: newId('pr'),
      requested_by: 'You (Procurement)',
      amount: Math.round(naira * 100),
      status: 'pending',
      description,
      bank_code: bankCode || null,
      account_number: accountNumber || null,
      account_name: accountNumber ? 'Resolved Beneficiary' : null,
      created_at: new Date().toISOString(),
    }
    setRows((prev) => [row, ...prev])
    setCreateOpen(false)
    setAmount('')
    setDescription('')
    setAccountNumber('')
    setBankCode('')
    toast.success('Payment request submitted')
  }

  const approve = (r: PaymentRequestMock) => {
    setRows((prev) =>
      prev.map((x) =>
        x.id === r.id ? { ...x, status: 'approved', reviewed_by: 'You (CEO)' } : x,
      ),
    )
    toast.success(`Approved — ${formatMoney(r.amount)} disbursed`)
  }

  const confirmReject = () => {
    if (!rejecting) return
    if (!reason.trim()) return toast.error('A rejection reason is required')
    setRows((prev) =>
      prev.map((x) =>
        x.id === rejecting.id
          ? { ...x, status: 'rejected', reviewed_by: 'You (CEO)', rejection_reason: reason }
          : x,
      ),
    )
    setRejecting(null)
    setReason('')
    toast.success('Payment request rejected')
  }

  return (
    <div>
      <PageHeader
        title="Payment requests"
        description={`${pendingCount} awaiting review.`}
      >
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New request
        </Button>
      </PageHeader>

      <div className="mb-4 flex items-center gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Requested by</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Beneficiary</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.requested_by}</TableCell>
                <TableCell className="max-w-xs">
                  <span className="line-clamp-1">{r.description}</span>
                  {r.status === 'rejected' && r.rejection_reason && (
                    <span className="line-clamp-1 text-xs text-destructive">
                      Rejected: {r.rejection_reason}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {r.account_name ? (
                    <span className="text-xs">
                      {r.account_name}
                      <br />
                      {r.account_number}
                    </span>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatMoney(r.amount)}
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge status={r.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(r.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  {r.status === 'pending' ? (
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => approve(r)}>
                        <Check className="h-4 w-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => setRejecting(r)}
                      >
                        <X className="h-4 w-4" /> Reject
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {r.reviewed_by ? `by ${r.reviewed_by}` : '—'}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> New payment request
              </span>
            </DialogTitle>
            <DialogDescription>Procurement raises a request for CEO review.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amt">Amount (₦)</Label>
              <Input
                id="amt"
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Input
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this payment for?"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="acct">Account number</Label>
                <Input
                  id="acct"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank">Bank code</Label>
                <Input id="bank" value={bankCode} onChange={(e) => setBankCode(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitCreate}>Submit request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject payment request</DialogTitle>
            <DialogDescription>
              A reason is required and shared with the requester.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Rejection reason</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this being rejected?"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmReject}>
              Reject request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
