import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import TwoFactorPage from '@/pages/TwoFactorPage'
import DashboardPage from '@/pages/DashboardPage'
import UsersPage from '@/pages/UsersPage'
import BulkUploadPage from '@/pages/BulkUploadPage'
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
          <Route path="/users" element={<UsersPage />} />
          <Route path="/bulk-upload" element={<BulkUploadPage />} />
          <Route path="/settings" element={<div className="text-2xl font-bold">Settings Page</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
