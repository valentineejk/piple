// Dummy data for the payment/wallet UI. These screens are UI-only for now —
// the shapes mirror the backend-complete API so they can be wired to real
// endpoints later with minimal change.

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'approved'
  | 'completed'
  | 'success'
  | 'rejected'
  | 'failed'
  | 'insufficient_funds'

export interface WalletMock {
  currency: string
  balance: number // kobo
  updated_at: string
}

export interface TopupMock {
  id: string
  amount: number
  status: 'pending' | 'success' | 'failed'
  channel: string | null
  reference: string
  initiated_by: string
  created_at: string
}

export interface PaymentRequestMock {
  id: string
  requested_by: string
  reviewed_by?: string | null
  amount: number
  status: 'pending' | 'approved' | 'rejected'
  description?: string | null
  rejection_reason?: string | null
  bank_code?: string | null
  account_number?: string | null
  account_name?: string | null
  created_at: string
}

export interface PayoutMock {
  id: string
  employee: string
  amount: number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'insufficient_funds'
  pay_period: string
  created_at: string
}

export interface TransactionMock {
  id: string
  type: 'credit' | 'debit'
  amount: number
  summary: string
  provider: string
  created_at: string
}

export const mockWallet: WalletMock = {
  currency: 'NGN',
  balance: 4_285_000_00, // ₦4,285,000.00 in kobo
  updated_at: '2026-07-18T09:12:00Z',
}

export const mockTopups: TopupMock[] = [
  {
    id: 't1',
    amount: 5_000_000_00,
    status: 'success',
    channel: 'card',
    reference: 'psref_9f2a71',
    initiated_by: 'Chidi Okafor (CEO)',
    created_at: '2026-07-15T10:04:00Z',
  },
  {
    id: 't2',
    amount: 1_500_000_00,
    status: 'success',
    channel: 'bank_transfer',
    reference: 'psref_5b8c02',
    initiated_by: 'Chidi Okafor (CEO)',
    created_at: '2026-07-02T14:38:00Z',
  },
  {
    id: 't3',
    amount: 800_000_00,
    status: 'pending',
    channel: null,
    reference: 'psref_1d7e44',
    initiated_by: 'Ada Admin',
    created_at: '2026-07-18T08:55:00Z',
  },
  {
    id: 't4',
    amount: 250_000_00,
    status: 'failed',
    channel: 'card',
    reference: 'psref_77aa19',
    initiated_by: 'Ada Admin',
    created_at: '2026-06-28T16:20:00Z',
  },
]

export const mockPaymentRequests: PaymentRequestMock[] = [
  {
    id: 'pr1',
    requested_by: 'Ngozi Eze (Procurement)',
    amount: 450_000_00,
    status: 'pending',
    description: 'Q3 office equipment — standing desks',
    bank_code: '058',
    account_number: '0123456789',
    account_name: 'Furniture Depot Ltd',
    created_at: '2026-07-17T11:30:00Z',
  },
  {
    id: 'pr2',
    requested_by: 'Ngozi Eze (Procurement)',
    amount: 120_000_00,
    status: 'pending',
    description: 'Monthly cleaning service',
    bank_code: '011',
    account_number: '3011224455',
    account_name: 'SparkleClean Services',
    created_at: '2026-07-16T09:05:00Z',
  },
  {
    id: 'pr3',
    requested_by: 'Tunde Bello (Procurement)',
    amount: 2_300_000_00,
    status: 'approved',
    reviewed_by: 'Chidi Okafor (CEO)',
    description: 'Annual software licenses',
    bank_code: '033',
    account_number: '0044556677',
    account_name: 'DevTools Africa',
    created_at: '2026-07-12T13:15:00Z',
  },
  {
    id: 'pr4',
    requested_by: 'Ngozi Eze (Procurement)',
    amount: 75_000_00,
    status: 'rejected',
    reviewed_by: 'Chidi Okafor (CEO)',
    description: 'Team lunch — off-site',
    rejection_reason: 'Outside the approved entertainment budget for July.',
    created_at: '2026-07-10T15:40:00Z',
  },
]

export const mockPayouts: PayoutMock[] = [
  {
    id: 'po1',
    employee: 'Emeka Nwosu',
    amount: 850_000_00,
    status: 'completed',
    pay_period: '2026-06-01',
    created_at: '2026-06-28T02:00:00Z',
  },
  {
    id: 'po2',
    employee: 'Fatima Sani',
    amount: 620_000_00,
    status: 'completed',
    pay_period: '2026-06-01',
    created_at: '2026-06-28T02:00:00Z',
  },
  {
    id: 'po3',
    employee: 'Bola Adeyemi',
    amount: 1_100_000_00,
    status: 'processing',
    pay_period: '2026-07-01',
    created_at: '2026-07-18T02:00:00Z',
  },
  {
    id: 'po4',
    employee: 'Kelvin Obi',
    amount: 540_000_00,
    status: 'failed',
    pay_period: '2026-07-01',
    created_at: '2026-07-18T02:00:00Z',
  },
  {
    id: 'po5',
    employee: 'Amara Okeke',
    amount: 780_000_00,
    status: 'insufficient_funds',
    pay_period: '2026-07-01',
    created_at: '2026-07-18T02:00:00Z',
  },
]

export const mockTransactions: TransactionMock[] = [
  {
    id: 'tx1',
    type: 'credit',
    amount: 5_000_000_00,
    summary: 'Wallet top-up',
    provider: 'paystack',
    created_at: '2026-07-15T10:04:12Z',
  },
  {
    id: 'tx2',
    type: 'debit',
    amount: 2_300_000_00,
    summary: 'Payment request approved — DevTools Africa',
    provider: 'paystack',
    created_at: '2026-07-12T13:16:03Z',
  },
  {
    id: 'tx3',
    type: 'debit',
    amount: 850_000_00,
    summary: 'Salary payout — Emeka Nwosu',
    provider: 'paystack',
    created_at: '2026-06-28T02:00:30Z',
  },
  {
    id: 'tx4',
    type: 'debit',
    amount: 620_000_00,
    summary: 'Salary payout — Fatima Sani',
    provider: 'paystack',
    created_at: '2026-06-28T02:00:31Z',
  },
  {
    id: 'tx5',
    type: 'credit',
    amount: 1_500_000_00,
    summary: 'Wallet top-up',
    provider: 'paystack',
    created_at: '2026-07-02T14:38:20Z',
  },
]

export function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`
}
