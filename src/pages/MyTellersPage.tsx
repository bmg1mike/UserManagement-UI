import { useQuery } from '@tanstack/react-query'
import { FiUsers, FiRefreshCw, FiFilter, FiX } from 'react-icons/fi'
import api from '@/lib/axios'
import { toast } from '@/lib/sweet-alert'
import { Button } from '@/components/ui/button'
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

interface Teller {
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

interface TellersResponse {
  success: boolean
  data: Teller[]
  meta: {
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export default function MyTellersPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  const [userSolId, setUserSolId] = useState<string>('')

  // Filter states
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all')
  const [emailFilter, setEmailFilter] = useState('')
  const [businessUnitFilter, setBusinessUnitFilter] = useState('')
  const [firstNameFilter, setFirstNameFilter] = useState('')
  const [lastNameFilter, setLastNameFilter] = useState('')

  // Check if AUDIT role user trying to access this page and get user's solId
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        if (user.role === 'AUDIT') {
          toast.error('Access denied')
          navigate('/audit-logs')
          return
        }
        // Set the logged-in user's solId
        if (user.solid) {
          setUserSolId(user.solid)
        } else {
          toast.error('User SOL ID not found')
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
  } = useQuery<TellersResponse>({
    queryKey: ['myTellers', page, pageSize, isActiveFilter, emailFilter, businessUnitFilter, firstNameFilter, lastNameFilter, userSolId],
    queryFn: async () => {
      if (!userSolId) {
        throw new Error('SOL ID is required')
      }

      const params = new URLSearchParams({
        solId: userSolId,
        page: page.toString(),
        pageSize: pageSize.toString(),
      })

      if (isActiveFilter !== 'all') {
        params.append('isActive', isActiveFilter === 'active' ? 'true' : 'false')
      }
      if (emailFilter) params.append('email', emailFilter)
      if (businessUnitFilter) params.append('businessUnit', businessUnitFilter)
      if (firstNameFilter) params.append('firstName', firstNameFilter)
      if (lastNameFilter) params.append('lastName', lastNameFilter)

      const response = await api.get(`/PortalUser/GetIMTOUsersBySolId?${params.toString()}`)
      
      // Map numeric role values to string names
      if (response.data?.data && Array.isArray(response.data.data)) {
        response.data.data = response.data.data.map((teller: Teller) => ({
          ...teller,
          role: mapRoleToString(teller.role as any)
        }))
      }
      
      return response.data
    },
    enabled: !!userSolId, // Only run query if we have the user's solId
    staleTime: 30000, // 30 seconds
  })

  // Check if any filters are active
  const hasActiveFilters = 
    isActiveFilter !== 'all' || 
    emailFilter !== '' || 
    businessUnitFilter !== '' || 
    firstNameFilter !== '' || 
    lastNameFilter !== ''

  const clearFilters = () => {
    setIsActiveFilter('all')
    setEmailFilter('')
    setBusinessUnitFilter('')
    setFirstNameFilter('')
    setLastNameFilter('')
    setPage(1)
  }

  const applyFilters = () => {
    setPage(1) // Reset to first page when filters change
  }

  const formatDate = (dateString?: string) => {
    if (!dateString || dateString === '0001-01-01T00:00:00') {
      return 'Never'
    }
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return 'Never'
    }
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  }

  if (!userSolId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10 text-muted-foreground">
              <p>Loading user information...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <FiUsers className="w-6 h-6" />
              My Tellers
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage tellers under your SOL ID: {userSolId}
            </p>
          </div>
          <div className="flex items-center gap-2">
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
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Filters Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiFilter className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-medium">Filters</h3>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">
                    {[
                      isActiveFilter !== 'all' ? 1 : 0,
                      emailFilter ? 1 : 0,
                      businessUnitFilter ? 1 : 0,
                      firstNameFilter ? 1 : 0,
                      lastNameFilter ? 1 : 0,
                    ].reduce((a, b) => a + b, 0)}{' '}
                    active
                  </Badge>
                )}
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <FiX className="w-4 h-4 mr-1" />
                  Clear all
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={isActiveFilter} onValueChange={(value) => {
                  setIsActiveFilter(value)
                  setPage(1)
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                  placeholder="e.g., John"
                  value={firstNameFilter}
                  onChange={(e) => setFirstNameFilter(e.target.value)}
                  onBlur={applyFilters}
                />
              </div>

              {/* Last Name Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input
                  placeholder="e.g., Doe"
                  value={lastNameFilter}
                  onChange={(e) => setLastNameFilter(e.target.value)}
                  onBlur={applyFilters}
                />
              </div>

              {/* Business Unit Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Business Unit</label>
                <Input
                  placeholder="e.g., NG"
                  value={businessUnitFilter}
                  onChange={(e) => setBusinessUnitFilter(e.target.value)}
                  onBlur={applyFilters}
                />
              </div>
            </div>
          </div>

          {/* Results Section */}
          {isLoading ? (
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading tellers...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-10 text-destructive">
              <p>Error loading tellers: {(error as Error)?.message || 'Unknown error'}</p>
              <Button variant="outline" onClick={() => refetch()} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : data?.data && data.data.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>{hasActiveFilters ? 'No tellers found matching your filters.' : 'No tellers found.'}</p>
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
                      <TableHead>Last Login</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((teller) => (
                      <TableRow key={teller.userId}>
                        <TableCell className="font-medium">{teller.email}</TableCell>
                        <TableCell className="capitalize">
                          {`${teller.firstName} ${teller.lastName}`.trim()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{teller.role}</Badge>
                        </TableCell>
                        <TableCell>{teller.businessUnit}</TableCell>
                        <TableCell>
                          <span className="font-mono text-xs">{teller.solid}</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(teller.lastLogin)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={teller.isActive ? 'default' : 'secondary'}
                            className={teller.isActive ? 'bg-green-500' : ''}
                          >
                            {teller.isActive ? 'Active' : 'Inactive'}
                          </Badge>
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
                    total tellers)
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
