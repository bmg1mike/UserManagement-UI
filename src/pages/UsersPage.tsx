import { useQuery } from '@tanstack/react-query'
import { FiUsers, FiRefreshCw, FiFilter, FiX, FiDownload } from 'react-icons/fi'
import api from '@/lib/axios'
import { toast, alert } from '@/lib/sweet-alert'
import { Button } from '@/components/ui/button'
import AddUserModal from '@/components/users/AddUserModal'
import EditUserModal from '@/components/users/EditUserModal'
import { Input } from '@/components/ui/input'
import { mapRoleToString } from '@/lib/roleUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface User {
  userId: string
  email: string
  normalizedEmail: string
  firstName: string
  lastName: string
  createdById: string
  role: string
  isActive: boolean
  solid: string
  businessUnit: string
  lastLogin?: string
  delFlag: string
  createdAt: string
}

interface UsersResponse {
  success: boolean
  data: User[]
  meta: {
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export default function UsersPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  const [isExporting, setIsExporting] = useState(false)

  // Filter states
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all')
  const [emailFilter, setEmailFilter] = useState('')
  const [solIdFilter, setSolIdFilter] = useState('')
  const [businessUnitFilter, setBusinessUnitFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [firstNameFilter, setFirstNameFilter] = useState('')
  const [lastNameFilter, setLastNameFilter] = useState('')

  // Check if AUDIT or SUPERVISOR role user trying to access this page
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        if (user.role === 'AUDIT') {
          toast.error('Access denied')
          navigate('/audit-logs')
        } else if (user.role === 'SUPERVISOR') {
          toast.error('Access denied. Supervisors cannot access this page.')
          navigate('/supervisor-dashboard')
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error)
    }
  }, [navigate])

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<UsersResponse>({
    queryKey: ['users', page, pageSize, isActiveFilter, emailFilter, solIdFilter, businessUnitFilter, roleFilter, firstNameFilter, lastNameFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      })

      if (isActiveFilter !== 'all') {
        params.append('isActive', isActiveFilter === 'active' ? 'true' : 'false')
      }
      if (emailFilter) params.append('email', emailFilter)
      if (solIdFilter) params.append('solId', solIdFilter)
      if (businessUnitFilter) params.append('businessUnit', businessUnitFilter)
      if (roleFilter) params.append('role', roleFilter)
      if (firstNameFilter) params.append('firstName', firstNameFilter)
      if (lastNameFilter) params.append('lastName', lastNameFilter)

      const response = await api.get(`/PortalUser/GetUsers?${params.toString()}`)
      
      // Map numeric role values to string names
      if (response.data?.data && Array.isArray(response.data.data)) {
        response.data.data = response.data.data.map((user: User) => ({
          ...user,
          role: mapRoleToString(user.role as any)
        }))
      }
      
      return response.data
    },
    staleTime: 30000, // 30 seconds
  })

  // Check if any filters are active
  const hasActiveFilters = 
    isActiveFilter !== 'all' || 
    emailFilter !== '' || 
    solIdFilter !== '' || 
    businessUnitFilter !== '' || 
    roleFilter !== '' || 
    firstNameFilter !== '' || 
    lastNameFilter !== ''

  // Reset all filters
  const clearFilters = () => {
    setIsActiveFilter('all')
    setEmailFilter('')
    setSolIdFilter('')
    setBusinessUnitFilter('')
    setRoleFilter('')
    setFirstNameFilter('')
    setLastNameFilter('')
    setPage(1)
  }

  // Reset to page 1 when filters change
  const applyFilters = () => {
    setPage(1)
  }

  // Export users function
  const handleExportUsers = async () => {
    setIsExporting(true)
    try {
      const response = await api.get('/PortalUser/ExportUsers', {
        responseType: 'blob',
      })
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success('Users exported successfully!')
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string }
      const errorMessage = axiosError.response?.data?.message || axiosError.message || 'Failed to export users'
      alert.error('Export Failed', errorMessage)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FiUsers className="w-8 h-8" />
            Users
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage portal users and their permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportUsers} disabled={isExporting}>
            {isExporting ? (
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
            ) : (
              <FiDownload className="w-4 h-4 mr-2" />
            )}
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <FiRefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <AddUserModal />
        </div>
      </div>

      {/* Filters Card */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Email Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                placeholder="e.g., john@ubagroup.com"
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                onBlur={applyFilters}
              />
            </div>

            {/* First Name Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">First Name</label>
              <Input
                placeholder="e.g., Michael"
                value={firstNameFilter}
                onChange={(e) => setFirstNameFilter(e.target.value)}
                onBlur={applyFilters}
              />
            </div>

            {/* Last Name Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Last Name</label>
              <Input
                placeholder="e.g., Smith"
                value={lastNameFilter}
                onChange={(e) => setLastNameFilter(e.target.value)}
                onBlur={applyFilters}
              />
            </div>

            {/* Role Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Input
                placeholder="e.g., ADMIN"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                onBlur={applyFilters}
              />
            </div>

            {/* Business Unit Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Business Unit</label>
              <Input
                placeholder="e.g., HQ"
                value={businessUnitFilter}
                onChange={(e) => setBusinessUnitFilter(e.target.value)}
                onBlur={applyFilters}
              />
            </div>

            {/* SOLID Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">SOL ID</label>
              <Input
                placeholder="e.g., 001"
                value={solIdFilter}
                onChange={(e) => setSolIdFilter(e.target.value)}
                onBlur={applyFilters}
              />
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={isActiveFilter} onValueChange={(value) => {
                setIsActiveFilter(value)
                setPage(1)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Users {data && `(${data.meta.totalCount})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : isError ? (
            <div className="text-center py-10 text-destructive">
              <p>Error loading users: {(error as Error)?.message || 'Unknown error'}</p>
              <Button variant="outline" onClick={() => refetch()} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : data?.data && data.data.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>{hasActiveFilters ? 'No users found matching your filters.' : 'No users found.'}</p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} className="mt-4">
                  Clear all filters
                </Button>
              )}
            </div>
          ) : data?.data ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Business Unit</TableHead>
                      <TableHead>SOL ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((user) => (
                      <TableRow key={user.userId}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell className="capitalize">
                          {`${user.firstName} ${user.lastName}`.trim()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>{user.businessUnit}</TableCell>
                        <TableCell>
                          <span className="font-mono text-xs">{user.solid}</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.isActive ? 'default' : 'secondary'}
                            className={user.isActive ? 'bg-green-500' : ''}
                          >
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <EditUserModal user={user} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data && data.meta.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing page {data.meta.page} of {data.meta.totalPages} ({data.meta.totalCount}{' '}
                    total users)
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
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
