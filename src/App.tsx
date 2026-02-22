import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import TwoFactorPage from '@/pages/TwoFactorPage'
import DashboardPage from '@/pages/DashboardPage'
import UsersPage from '@/pages/UsersPage'
import BulkUploadPage from '@/pages/BulkUploadPage'
import AuditLogsPage from '@/pages/AuditLogsPage'
import DeletedUsersPage from '@/pages/DeletedUsersPage'
import MyTellersPage from '@/pages/MyTellersPage'
import SupervisorDashboardPage from '@/pages/SupervisorDashboardPage'
import TellerSummaryPage from '@/pages/TellerSummaryPage'
import TellerTransactionsPage from '@/pages/TellerTransactionsPage'
import DownloadAuditReportPage from '@/pages/DownloadAuditReportPage'
import { AuthLayout } from '@/components/layout'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/2fa" element={<TwoFactorPage />} />
        
        {/* Protected routes with sidebar */}
        <Route element={<AuthLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/supervisor-dashboard" element={<SupervisorDashboardPage />} />
          <Route path="/teller-summary" element={<TellerSummaryPage />} />
          <Route path="/teller-transactions/:tellerId" element={<TellerTransactionsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/my-tellers" element={<MyTellersPage />} />
          <Route path="/bulk-upload" element={<BulkUploadPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
          <Route path="/download-audit-report" element={<DownloadAuditReportPage />} />
          <Route path="/deleted-users" element={<DeletedUsersPage />} />
          <Route path="/settings" element={<div className="text-2xl font-bold">Settings Page</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
