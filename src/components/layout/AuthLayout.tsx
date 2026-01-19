import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AuthLayout() {
  return (
    <div className="flex h-screen bg-muted/30">
      <Sidebar />
      <main className="flex-1 lg:pl-0 pt-16 lg:pt-0 overflow-y-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
