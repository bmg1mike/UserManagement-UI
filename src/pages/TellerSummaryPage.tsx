import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  FiUsers,
  FiRefreshCw,
  FiActivity,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiUnlock,
  FiEye,
} from 'react-icons/fi'
import api from '@/lib/axios'
import { toast } from '@/lib/sweet-alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface TellerSummary {
  tellerId: string
  tellerName: string
  tellerEmail: string
  solId: string
  numberOfScreenedTransactions: number
  numberPending: number
  numberCompleted: number
  numberBlocked: number
  numberReleased: number
}

interface TellerSummaryResponse {
  success: boolean
  message?: string
  data: TellerSummary[]
  meta: {
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export default function TellerSummaryPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

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

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<TellerSummaryResponse>({
    queryKey: ['tellerSummary', page, pageSize],
    queryFn: async () => {
      const response = await api.get(`/Supervisor/teller-summary?page=${page}&pageSize=${pageSize}`)
      return response.data
    },
    staleTime: 30000, // 30 seconds
    retry: 1,
  })

  const getCompletionRate = (completed: number, total: number) => {
    if (total === 0) return 0
    return Math.round((completed / total) * 100)
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading teller summary...</p>
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
              <h3 className="text-lg font-semibold mb-2">Failed to Load Teller Summary</h3>
              <p className="text-muted-foreground mb-4">
                {data?.message || (error as Error)?.message || 'An error occurred while loading the teller data.'}
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <FiUsers className="w-6 h-6" />
              Teller Performance Summary
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Overview of all tellers' transaction performance
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
          {/* Results Section */}
          {data?.data && data.data.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>No teller data found.</p>
            </div>
          ) : data?.data ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teller</TableHead>
                      <TableHead>SOL ID</TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <FiActivity className="w-4 h-4" />
                          Total
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <FiClock className="w-4 h-4 text-orange-600" />
                          Pending
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <FiCheckCircle className="w-4 h-4 text-green-600" />
                          Completed
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <FiXCircle className="w-4 h-4 text-red-600" />
                          Blocked
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <FiUnlock className="w-4 h-4 text-emerald-600" />
                          Released
                        </div>
                      </TableHead>
                      <TableHead className="text-center">Completion Rate</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((teller) => (
                      <TableRow key={teller.tellerId}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{teller.tellerName}</span>
                            <span className="text-xs text-muted-foreground">{teller.tellerEmail}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs">{teller.solId}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-mono">
                            {teller.numberOfScreenedTransactions}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700 font-mono">
                            {teller.numberPending}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-green-100 text-green-700 font-mono">
                            {teller.numberCompleted}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-red-100 text-red-700 font-mono">
                            {teller.numberBlocked}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 font-mono">
                            {teller.numberReleased}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-sm font-semibold">
                              {getCompletionRate(teller.numberCompleted, teller.numberOfScreenedTransactions)}%
                            </span>
                            <div className="w-full bg-secondary rounded-full h-1.5">
                              <div
                                className="bg-green-600 h-1.5 rounded-full transition-all"
                                style={{
                                  width: `${getCompletionRate(
                                    teller.numberCompleted,
                                    teller.numberOfScreenedTransactions
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/teller-transactions/${teller.tellerId}`)}
                          >
                            <FiEye className="w-4 h-4 mr-2" />
                            View Transactions
                          </Button>
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
