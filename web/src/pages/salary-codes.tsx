import { useState } from 'react'
import { Copy, MoreHorizontal, Plus, Tags } from 'lucide-react'
import { toast } from 'sonner'
import { useDeleteSalaryCode, useSalaryCodes } from '@/lib/hooks'
import { formatMoney } from '@/lib/format'
import type { SalaryCode } from '@/types/api'
import { PageHeader } from '@/components/page-header'
import { EmptyState, ErrorState } from '@/components/data-states'
import { SalaryCodeFormDialog } from '@/features/salary-codes/salary-code-form-dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function SalaryCodesPage() {
  const [level, setLevel] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<SalaryCode | null>(null)
  const [deleting, setDeleting] = useState<SalaryCode | null>(null)

  const filters = level.trim() ? { level: level.trim() } : {}
  const { data, isLoading, isError, error, refetch } = useSalaryCodes(filters)
  const deleteMut = useDeleteSalaryCode()

  const codes = data?.data ?? []

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (s: SalaryCode) => {
    setEditing(s)
    setFormOpen(true)
  }

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success(`Copied ${code}`)
    } catch {
      toast.error('Could not copy')
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    await deleteMut.mutateAsync(deleting.id)
    setDeleting(null)
  }

  return (
    <div>
      <PageHeader title="Salary codes" description="Pay bands used to compute payouts.">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> New code
        </Button>
      </PageHeader>

      <div className="mb-4 max-w-xs">
        <Input
          placeholder="Filter by level…"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
        />
      </div>

      <Card>
        {isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : codes.length === 0 ? (
          <EmptyState
            icon={Tags}
            title="No salary codes yet"
            description="Create a salary code to define a pay band and monthly amount."
            action={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> New code
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Level</TableHead>
                <TableHead className="text-right">Monthly amount</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <button
                      onClick={() => copyCode(s.code)}
                      className="group inline-flex items-center gap-1.5 font-mono text-sm"
                      title="Copy code"
                    >
                      {s.code}
                      <Copy className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{s.level}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(s.amount)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(s)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyCode(s.code)}>
                          Copy code
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleting(s)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <SalaryCodeFormDialog open={formOpen} onOpenChange={setFormOpen} salaryCode={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete salary code?"
        description={`${deleting?.code} will be removed. This is blocked if any employee still references it.`}
        confirmLabel="Delete"
        loading={deleteMut.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
