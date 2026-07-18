import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { LoginPage } from '@/pages/login'
import { DashboardPage } from '@/pages/dashboard'
import { UsersPage } from '@/pages/users'
import { EmployeesPage } from '@/pages/employees'
import { SalaryCodesPage } from '@/pages/salary-codes'
import { WalletPage } from '@/pages/wallet'
import { PaymentRequestsPage } from '@/pages/payment-requests'
import { PayoutsPage } from '@/pages/payouts'
import { TransactionsPage } from '@/pages/transactions'
import { ProfilePage } from '@/pages/profile'
import { NotFoundPage } from '@/pages/not-found'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Authenticated shell */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Admin-only */}
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route element={<AppLayout />}>
              <Route path="users" element={<UsersPage />} />
              <Route path="salary-codes" element={<SalaryCodesPage />} />
            </Route>
          </Route>

          {/* Admin / CEO */}
          <Route element={<ProtectedRoute roles={['admin', 'ceo']} />}>
            <Route element={<AppLayout />}>
              <Route path="wallet" element={<WalletPage />} />
              <Route path="payouts" element={<PayoutsPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
            </Route>
          </Route>

          {/* Admin / CEO / Procurement */}
          <Route element={<ProtectedRoute roles={['admin', 'ceo', 'procurement']} />}>
            <Route element={<AppLayout />}>
              <Route path="payment-requests" element={<PaymentRequestsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
