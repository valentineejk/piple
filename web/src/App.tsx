import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { LoginPage } from '@/pages/login'
import { DashboardPage } from '@/pages/dashboard'
import { UsersPage } from '@/pages/users'
import { EmployeesPage } from '@/pages/employees'
import { ProfilePage } from '@/pages/profile'
import { ComingSoonPage } from '@/pages/coming-soon'
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
            <Route
              path="payroll"
              element={
                <ComingSoonPage
                  title="Payroll"
                  description="Salary codes, payout runs and history."
                  endpoints={[
                    'GET /salary-codes',
                    'GET /payouts',
                    'POST /payouts/run',
                    'POST /payouts/:id/retry',
                  ]}
                />
              }
            />
          </Route>

          {/* Admin-only */}
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route element={<AppLayout />}>
              <Route path="users" element={<UsersPage />} />
            </Route>
          </Route>

          {/* Admin / CEO only */}
          <Route element={<ProtectedRoute roles={['admin', 'ceo']} />}>
            <Route element={<AppLayout />}>
              <Route
                path="wallet"
                element={
                  <ComingSoonPage
                    title="Wallet"
                    description="Balance, top-ups and the transaction ledger."
                    endpoints={[
                      'GET /wallet',
                      'POST /wallet/topups/initialize',
                      'GET /wallet/topups',
                      'GET /transactions',
                    ]}
                  />
                }
              />
            </Route>
          </Route>
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
