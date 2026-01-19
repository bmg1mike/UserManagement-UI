import { FiUsers, FiUserCheck, FiUserX, FiActivity } from 'react-icons/fi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const stats = [
  { label: 'Total Users', value: '1,234', icon: <FiUsers className="w-5 h-5" />, color: 'text-blue-500' },
  { label: 'Active Users', value: '1,180', icon: <FiUserCheck className="w-5 h-5" />, color: 'text-green-500' },
  { label: 'Inactive Users', value: '54', icon: <FiUserX className="w-5 h-5" />, color: 'text-red-500' },
  { label: 'Recent Activity', value: '89', icon: <FiActivity className="w-5 h-5" />, color: 'text-orange-500' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome to the AML User Management Portal</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className={stat.color}>{stat.icon}</div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No recent activity to display.</p>
        </CardContent>
      </Card>
    </div>
  )
}
