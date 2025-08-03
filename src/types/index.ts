export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'CLIENT' | 'ACCOUNTANT'
  createdAt: Date
  updatedAt: Date
}

export interface Company {
  id: string
  name: string
  rut: string
  address?: string
  phone?: string
  email?: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface Account {
  id: string
  code: string
  name: string
  type?: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE'
  account_type?: 'asset' | 'liability' | 'equity' | 'income' | 'expense'
  description?: string
  parentId?: string
  parent_id?: string
  companyId?: string
  company_id?: string
  level: number
  isActive?: boolean
  is_active?: boolean
  isDetail?: boolean
  is_detail?: boolean
  children?: Account[]
  createdAt?: Date
  updatedAt?: Date
}

export interface Transaction {
  id: string
  date: Date
  description: string
  reference?: string
  companyId: string
  createdAt: Date
  updatedAt: Date
  entries: TransactionEntry[]
}

export interface TransactionEntry {
  id: string
  transactionId: string
  accountId: string
  debit: number
  credit: number
  description?: string
}

export interface FinancialReport {
  id: string
  type: 'BALANCE_SHEET' | 'INCOME_STATEMENT' | 'CASH_FLOW'
  companyId: string
  startDate: Date
  endDate: Date
  data: any
  createdAt: Date
}