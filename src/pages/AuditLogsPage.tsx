import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { FiClock, FiUser, FiMonitor, FiFileText, FiFilter, FiX, FiEye } from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import api from '@/lib/axios'
import { toast } from '@/lib/sweet-alert'

interface AuditLog {
  id: number
  userEmail: string
  actionPerformed: string
  entityType: string
  entityId: string
  description: string
  timestamp: string
  ipAddress: string
  additionalData: string | null
}

interface AuditLogResponse {
  success: boolean
  data: AuditLog[]
  meta: {
    fromDate: string
    toDate: string
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export default function AuditLogsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  
  // Filter states
  const [userEmail, setUserEmail] = useState('')
  const [actionPerformed, setActionPerformed] = useState('')
  const [entityType, setEntityType] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  
  // Modal state
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Check user role on mount
  useEffect(() => {
    const checkAccess = () => {
      try {
        const userStr = localStorage.getItem('user')
        if (!userStr) {
          toast.error('Unauthorized access')
          navigate('/users')
          return
        }

        const user = JSON.parse(userStr)
        const allowedRoles = ['ADMIN', 'AUDIT']
        
        if (!user.role || !allowedRoles.includes(user.role.toUpperCase())) {
          toast.error('You do not have permission to access audit logs')
          navigate('/users')
          return
        }
      } catch (error) {
        console.error('Error checking user access:', error)
        toast.error('Unauthorized access')
        navigate('/users')
      }
    }

    checkAccess()
  }, [navigate])

  const handleViewLog = (log: AuditLog) => {
    setSelectedLog(log)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedLog(null), 200)
  }

  const { data, isLoading, error } = useQuery<AuditLogResponse>({
    queryKey: ['auditLogs', page, pageSize, userEmail, actionPerformed, entityType, fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      })
      
      if (userEmail) params.append('userEmail', userEmail)
      if (actionPerformed) params.append('actionPerformed', actionPerformed)
      if (entityType) params.append('entityType', entityType)
      if (fromDate) params.append('fromDate', fromDate)
      if (toDate) params.append('toDate', toDate)
      
      const response = await api.get(`/AuditLogs?${params.toString()}`)
      return response.data
    },
    staleTime: 30000, // 30 seconds
  })

  const clearFilters = () => {
    setUserEmail('')
    setActionPerformed('')
    setEntityType('')
    setFromDate('')
    setToDate('')
    setPage(1)
  }

  const hasActiveFilters = userEmail || actionPerformed || entityType || fromDate || toDate

  // Reset to page 1 when filters change
  const applyFilters = () => {
    setPage(1)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(date)
  }

  const getActionBadge = (action: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      Login: 'default',
      '2FA': 'secondary',
      Logout: 'outline',
      'Create User': 'default',
      'Update User': 'secondary',
      'Delete User': 'destructive',
      'Bulk Upload': 'default',
      'Export Users': 'outline',
    }
    
    return (
      <Badge variant={variants[action] || 'default'} className="whitespace-nowrap">
        {action}
      </Badge>
    )
  }

  if (error) {
    toast.error('Failed to load audit logs')
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">
          Track all user activities and system events
        </p>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FiFilter className="w-5 h-5" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
              <FiX className="w-4 h-4" />
              Clear Filters
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* User Email Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">User Email</label>
              <Input
                placeholder="e.g., user@ubagroup.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                onBlur={applyFilters}
              />
            </div>

            {/* Action Performed Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <Select value={actionPerformed || 'all'} onValueChange={(value) => {
                setActionPerformed(value === 'all' ? '' : value)
                setPage(1)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  <SelectItem value="Login">Login</SelectItem>
                  <SelectItem value="2FA">2FA</SelectItem>
                  <SelectItem value="Logout">Logout</SelectItem>
                  <SelectItem value="Create User">Create User</SelectItem>
                  <SelectItem value="Update User">Update User</SelectItem>
                  <SelectItem value="Delete User">Delete User</SelectItem>
                  <SelectItem value="Bulk Upload">Bulk Upload</SelectItem>
                  <SelectItem value="Export Users">Export Users</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Entity Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Entity Type</label>
              <Select value={entityType || 'all'} onValueChange={(value) => {
                setEntityType(value === 'all' ? '' : value)
                setPage(1)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All entities</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="System">System</SelectItem>
                  <SelectItem value="Report">Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* From Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                onBlur={applyFilters}
              />
            </div>

            {/* To Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                onBlur={applyFilters}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : data?.data && data.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-sm">Timestamp</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">User</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Action Performed</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-2">
                          <FiClock className="w-4 h-4 text-muted-foreground" />
                          <span className="whitespace-nowrap">{formatDate(log.timestamp)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-2">
                          <FiUser className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{log.userEmail}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{getActionBadge(log.actionPerformed)}</td>
                      <td className="py-3 px-4 text-sm">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewLog(log)}
                          className="gap-2"
                        >
                          <FiEye className="w-4 h-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FiFileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No audit logs found</p>
            </div>
          )}

          {/* Pagination */}
          {data && data.meta.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Showing page {data.meta.page} of {data.meta.totalPages} ({data.meta.totalCount}{' '}
                total events)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(1)}
                  disabled={!data.meta.hasPreviousPage}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!data.meta.hasPreviousPage}
                >
                  Previous
                </Button>
                
                {/* Page Numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, data.meta.totalPages) }, (_, i) => {
                    let pageNum: number
                    if (data.meta.totalPages <= 5) {
                      pageNum = i + 1
                    } else if (data.meta.page <= 3) {
                      pageNum = i + 1
                    } else if (data.meta.page >= data.meta.totalPages - 2) {
                      pageNum = data.meta.totalPages - 4 + i
                    } else {
                      pageNum = data.meta.page - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={data.meta.page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className="w-9"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!data.meta.hasNextPage}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(data.meta.totalPages)}
                  disabled={!data.meta.hasNextPage}
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Log Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FiFileText className="w-5 h-5" />
              Audit Log Details
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">Log ID</label>
                  <p className="text-sm">{selectedLog.id}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">Timestamp</label>
                  <div className="flex items-center gap-2">
                    <FiClock className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm">{formatDate(selectedLog.timestamp)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">User Email</label>
                  <div className="flex items-center gap-2">
                    <FiUser className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{selectedLog.userEmail}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">Action Performed</label>
                  <div>{getActionBadge(selectedLog.actionPerformed)}</div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">Entity Type</label>
                  <p className="text-sm">{selectedLog.entityType}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">Entity ID</label>
                  <p className="text-sm font-mono text-xs break-all">{selectedLog.entityId}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">IP Address</label>
                  <div className="flex items-center gap-2">
                    <FiMonitor className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-mono">{selectedLog.ipAddress}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">Description</label>
                <p className="text-sm bg-muted p-3 rounded-md">{selectedLog.description}</p>
              </div>

              {selectedLog.additionalData && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">Additional Data</label>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                    {JSON.stringify(JSON.parse(selectedLog.additionalData), null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button onClick={closeModal}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
