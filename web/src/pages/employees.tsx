import { useState } from 'react'
import { Info, MoreHorizontal, Plus, UserSquare } from 'lucide-react'
import { useDeleteEmployee } from '@/lib/hooks'
import { uuidToString } from '@/lib/format'
import type { Employee } from '@/types/api'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/data-states'
import { StatusBadge } from '@/components/role-badge'
import { EmployeeFormDialog } from '@/features/employees/employee-form-dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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

export function EmployeesPage() {
  // The backend exposes create/update/delete for employees but no list endpoint,
  // so we surface the records created or edited during this session.
  const [records, setRecords] = useState<Employee[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [deleting, setDeleting] = useState<Employee | null>(null)
  const deleteMut = useDeleteEmployee()

  const upsert = (emp: Employee) => {
    setRecords((prev) => {
      const id = uuidToString(emp.id)
      const idx = prev.findIndex((e) => uuidToString(e.id) === id)
      if (idx === -1) return [emp, ...prev]
      const next = [...prev]
      next[idx] = emp
      return next
    })
  }

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (e: Employee) => {
    setEditing(e)
    setFormOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleting) return
    const id = uuidToString(deleting.id)
    await deleteMut.mutateAsync(id)
    setRecords((prev) => prev.filter((e) => uuidToString(e.id) !== id))
    setDeleting(null)
  }

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Payroll profiles linked to user accounts."
      >
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> New employee
        </Button>
      </PageHeader>

      <div className="mb-4 flex items-start gap-2 rounded-lg border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          The API supports creating, updating and deleting employee records, but does not yet
          expose a list endpoint. Records you create or edit here appear below for this session.
        </p>
      </div>

      <Card>
        {records.length === 0 ? (
          <EmptyState
            icon={UserSquare}
            title="No employee records yet"
            description="Create an employee record to link payroll details to a user."
            action={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> New employee
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((e) => (
                <TableRow key={uuidToString(e.id)}>
                  <TableCell className="font-medium">
                    {e.first_name} {e.last_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.dial_code} {e.phone}
                  </TableCell>
                  <TableCell>{e.department || '—'}</TableCell>
                  <TableCell>{e.level || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.bank_name ? `${e.bank_name} · ${e.account_number ?? ''}` : '—'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={e.status} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(e)}>Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleting(e)}
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

      <EmployeeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        employee={editing}
        onSaved={upsert}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete employee record?"
        description={`${deleting?.first_name} ${deleting?.last_name}'s payroll record will be permanently removed.`}
        confirmLabel="Delete"
        loading={deleteMut.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
