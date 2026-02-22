import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import {
  FiActivity,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiUnlock,
  FiUsers,
  FiRefreshCw,
  FiBarChart,
} from 'react-icons/fi'
import api from '@/lib/axios'
import { toast } from '@/lib/sweet-alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DashboardData {
  solId: string
  numberOfTransactionsScreenedToday: number
  numberPending: number
  numberCompleted: number
  numberBlocked: number
  numberReleased: number
  totalTellers: number
}

interface DashboardResponse {
  success: boolean
  message?: string
  data: DashboardData | null
}

export default function SupervisorDashboardPage() {
  const navigate = useNavigate()

  // Check if user has SUPERVISOR role
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        if (user.role !== 'SUPERVISOR') {
          toast.error('Access denied. This page is only for supervisors.')
          navigate('/users')
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error)
    }
  }, [navigate])

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<DashboardResponse>({
    queryKey: ['supervisorDashboard'],
    queryFn: async () => {
      const response = await api.get('/Supervisor/dashboard-summary')
      return response.data
    },
    staleTime: 60000, // 1 minute
    retry: 1,
  })

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    subtitle,
  }: {
    title: string
    value: number
    icon: React.ElementType
    color: string
    subtitle?: string
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value.toLocaleString()}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  )

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (isError || !data?.success) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <FiXCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to Load Dashboard</h3>
              <p className="text-muted-foreground mb-4">
                {data?.message || (error as Error)?.message || 'An error occurred while loading the dashboard data.'}
              </p>
              <Button onClick={() => refetch()} disabled={isFetching}>
                <FiRefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const dashboardData = data.data

  if (!dashboardData) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10 text-muted-foreground">
              <p>No dashboard data available.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FiBarChart className="w-8 h-8" />
            Supervisor Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Overview for SOL ID: <span className="font-mono font-semibold">{dashboardData.solId}</span>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <FiRefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Transactions Screened Today"
          value={dashboardData.numberOfTransactionsScreenedToday}
          icon={FiActivity}
          color="text-blue-600"
          subtitle="Total processed today"
        />
        <StatCard
          title="Pending Review"
          value={dashboardData.numberPending}
          icon={FiClock}
          color="text-orange-600"
          subtitle="Awaiting action"
        />
        <StatCard
          title="Completed"
          value={dashboardData.numberCompleted}
          icon={FiCheckCircle}
          color="text-green-600"
          subtitle="Successfully processed"
        />
        <StatCard
          title="Blocked"
          value={dashboardData.numberBlocked}
          icon={FiXCircle}
          color="text-red-600"
          subtitle="Flagged transactions"
        />
        <StatCard
          title="Released"
          value={dashboardData.numberReleased}
          icon={FiUnlock}
          color="text-emerald-600"
          subtitle="Cleared for processing"
        />
        <StatCard
          title="Total Tellers"
          value={dashboardData.totalTellers}
          icon={FiUsers}
          color="text-purple-600"
          subtitle="Under your supervision"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Transaction Status Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transaction Status Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completion Rate</span>
                <span className="text-sm font-semibold">
                  {dashboardData.numberOfTransactionsScreenedToday > 0
                    ? Math.round(
                        (dashboardData.numberCompleted / dashboardData.numberOfTransactionsScreenedToday) * 100
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${
                      dashboardData.numberOfTransactionsScreenedToday > 0
                        ? (dashboardData.numberCompleted / dashboardData.numberOfTransactionsScreenedToday) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending Rate</span>
                <span className="text-sm font-semibold">
                  {dashboardData.numberOfTransactionsScreenedToday > 0
                    ? Math.round((dashboardData.numberPending / dashboardData.numberOfTransactionsScreenedToday) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${
                      dashboardData.numberOfTransactionsScreenedToday > 0
                        ? (dashboardData.numberPending / dashboardData.numberOfTransactionsScreenedToday) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Block Rate</span>
                <span className="text-sm font-semibold">
                  {dashboardData.numberOfTransactionsScreenedToday > 0
                    ? Math.round((dashboardData.numberBlocked / dashboardData.numberOfTransactionsScreenedToday) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${
                      dashboardData.numberOfTransactionsScreenedToday > 0
                        ? (dashboardData.numberBlocked / dashboardData.numberOfTransactionsScreenedToday) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <span className="text-sm font-medium">Total Processed</span>
              <span className="text-lg font-bold">
                {dashboardData.numberCompleted + dashboardData.numberBlocked + dashboardData.numberReleased}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <span className="text-sm font-medium">Action Items</span>
              <span className="text-lg font-bold text-orange-600">{dashboardData.numberPending}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <span className="text-sm font-medium">Team Size</span>
              <span className="text-lg font-bold text-purple-600">{dashboardData.totalTellers}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
