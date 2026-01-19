import { useQuery } from '@tanstack/react-query'
import { FiUsers, FiSearch, FiRefreshCw, FiChevronLeft, FiChevronRight, FiFilter, FiX, FiDownload } from 'react-icons/fi'
import api from '@/lib/axios'
import { toast, alert } from '@/lib/sweet-alert'
import { Button } from '@/components/ui/button'
import AddUserModal from '@/components/users/AddUserModal'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useState, useMemo } from 'react'

const ITEMS_PER_PAGE = 10

interface User {
  userId: string
  email: string
  normalizedEmail?: string
  firstName: string
  lastName: string
  createdById?: string
  role: string
  isActive: boolean
  solid: string
  businessUnit: string
  lastLogin?: string
  delFlag?: string
  createdAt?: string
  lastUpdatedAt?: string
  lastUpdatedById?: string
}

const fetchUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>('/PortalUser/GetUsers')
  return response.data || []
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [businessUnitFilter, setBusinessUnitFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isExporting, setIsExporting] = useState(false)

  const {
    data: users = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })

  // Get unique values for filter dropdowns
  const { roles, businessUnits } = useMemo(() => {
    const rolesSet = new Set<string>()
    const businessUnitsSet = new Set<string>()
    
    users.forEach((user) => {
      if (user.role) rolesSet.add(user.role.trim())
      if (user.businessUnit) businessUnitsSet.add(user.businessUnit.trim())
    })
    
    return {
      roles: Array.from(rolesSet).sort(),
      businessUnits: Array.from(businessUnitsSet).sort(),
    }
  }, [users])

  const filteredUsers = useMemo(() => {
    const search = searchTerm.toLowerCase()
    return users.filter((user) => {
      // Text search
      const matchesSearch = 
        user.email?.toLowerCase().includes(search) ||
        user.firstName?.toLowerCase().includes(search) ||
        user.lastName?.toLowerCase().includes(search) ||
        user.role?.toLowerCase().includes(search) ||
        user.businessUnit?.toLowerCase().includes(search) ||
        user.solid?.toLowerCase().includes(search)
      
      // Role filter
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      
      // Business Unit filter
      const matchesBusinessUnit = businessUnitFilter === 'all' || user.businessUnit === businessUnitFilter
      
      // Status filter
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive)
      
      return matchesSearch && matchesRole && matchesBusinessUnit && matchesStatus
    })
  }, [users, searchTerm, roleFilter, businessUnitFilter, statusFilter])

  // Check if any filters are active
  const hasActiveFilters = roleFilter !== 'all' || businessUnitFilter !== 'all' || statusFilter !== 'all' || searchTerm !== ''

  // Reset all filters
  const clearFilters = () => {
    setSearchTerm('')
    setRoleFilter('all')
    setBusinessUnitFilter('all')
    setStatusFilter('all')
    setCurrentPage(1)
  }

  // Reset to page 1 when filters change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  const handleRoleChange = (value: string) => {
    setRoleFilter(value)
    setCurrentPage(1)
  }

  const handleBusinessUnitChange = (value: string) => {
    setBusinessUnitFilter(value)
    setCurrentPage(1)
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Users ({filteredUsers.length})</CardTitle>
            <div className="relative w-72">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by name, email, role..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FiFilter className="w-4 h-4" />
              <span>Filters:</span>
            </div>

            <Select value={roleFilter} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={businessUnitFilter} onValueChange={handleBusinessUnitChange}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Business Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Business Units</SelectItem>
                {businessUnits.map((bu) => (
                  <SelectItem key={bu} value={bu}>
                    {bu}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
                <FiX className="w-4 h-4 mr-1" />
                Clear filters
              </Button>
            )}
          </div>
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
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>{hasActiveFilters ? 'No users found matching your filters.' : 'No users found.'}</p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} className="mt-4">
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Business Unit</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow key={user.userId}>
                        <TableCell className="font-medium">{user.email?.trim()}</TableCell>
                        <TableCell className="capitalize">
                          {`${user.firstName?.trim() || ''} ${user.lastName?.trim() || ''}`.trim() || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role || '-'}</Badge>
                        </TableCell>
                        <TableCell>{user.businessUnit || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={user.isActive ? 'default' : 'secondary'}
                            className={user.isActive ? 'bg-green-500' : ''}
                          >
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <FiChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => goToPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <FiChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
