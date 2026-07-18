import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { formatDateTime, formatMoney } from '@/lib/format'
import { mockTransactions } from '@/lib/mock-data'
import { PageHeader } from '@/components/page-header'
import { Card } from '@/components/ui/card'
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

export function TransactionsPage() {
  const [type, setType] = useState(ALL)
  const rows = type === ALL ? mockTransactions : mockTransactions.filter((t) => t.type === type)

  return (
    <div>
      <PageHeader title="Transactions" description="Immutable wallet ledger." />

      <div className="mb-4 flex items-center gap-3">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All types</SelectItem>
            <SelectItem value="credit">Credit</SelectItem>
            <SelectItem value="debit">Debit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Summary</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((t) => {
              const credit = t.type === 'credit'
              return (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.summary}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{t.provider}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${
                        credit ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                      }`}
                    >
                      {credit ? (
                        <ArrowDownLeft className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      )}
                      {t.type}
                    </span>
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      credit ? 'text-emerald-600 dark:text-emerald-400' : ''
                    }`}
                  >
                    {credit ? '+' : '−'}
                    {formatMoney(t.amount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(t.created_at)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
