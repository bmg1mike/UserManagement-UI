import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  FiActivity,
  FiRefreshCw,
  FiFilter,
  FiX,
  FiArrowLeft,
  FiUser,
  FiMail,
  FiHash,
  FiDownload,
} from 'react-icons/fi'
import api from '@/lib/axios'
import { toast } from '@/lib/sweet-alert'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface TellerDetails {
  tellerId: string
  tellerName: string
  solId: string
  email: string
}

interface Transaction {
  transactionId: string
  requestId: string
  transactionScreeningTime: string
  senderName: string
  beneficiaryName: string
  amount: string
  currency: string
  hitResult: string
  messageRefNumber: string
  transactionType: string
}

interface TransactionsResponse {
  success: boolean
  message?: string
  tellerDetails: TellerDetails
  data: Transaction[]
  meta: {
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export default function TellerTransactionsPage() {
  const navigate = useNavigate()
  const { tellerId } = useParams<{ tellerId: string }>()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [isDownloading, setIsDownloading] = useState(false)

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

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

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<TransactionsResponse>({
    queryKey: ['tellerTransactions', tellerId, page, pageSize, statusFilter, fromDate, toDate],
    queryFn: async () => {
      if (!tellerId) {
        throw new Error('Teller ID is required')
      }

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      })

      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (fromDate) params.append('fromDate', fromDate)
      if (toDate) params.append('toDate', toDate)

      const response = await api.get(`/Supervisor/teller-transactions/${tellerId}?${params.toString()}`)
      return response.data
    },
    enabled: !!tellerId,
    staleTime: 30000, // 30 seconds
    retry: 1,
  })

  const hasActiveFilters = statusFilter !== 'all' || fromDate !== '' || toDate !== ''

  const clearFilters = () => {
    setStatusFilter('all')
    setFromDate('')
    setToDate('')
    setPage(1)
  }

  const applyFilters = () => {
    setPage(1) // Reset to first page when filters change
  }

  const handleDownloadReport = async () => {
    if (!tellerId) {
      toast.error('Teller ID is required')
      return
    }

    // Validate date range if provided
    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      toast.error('From Date cannot be later than To Date')
      return
    }

    setIsDownloading(true)
    try {
      const params = new URLSearchParams()

      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (fromDate) params.append('fromDate', fromDate)
      if (toDate) params.append('toDate', toDate)

      const response = await api.get(`/Supervisor/download-teller-transactions/${tellerId}?${params.toString()}`, {
        responseType: 'blob',
      })

      // Create a blob from the response
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      // Create a link element and trigger download
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      link.download = `Teller_Transactions_${tellerId}_${timestamp}.xlsx`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Report downloaded successfully!')
    } catch (error) {
      console.error('Error downloading report:', error)
      const axiosError = error as { response?: { data?: Blob }; message?: string }
      
      // Try to parse error message from blob
      if (axiosError.response?.data instanceof Blob) {
        try {
          const text = await axiosError.response.data.text()
          const errorData = JSON.parse(text)
          toast.error(errorData.message || 'Failed to download report')
        } catch {
          toast.error('Failed to download report. Please try again.')
        }
      } else {
        toast.error('Failed to download report. Please try again.')
      }
    } finally {
      setIsDownloading(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return 'N/A'
    }
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  }

  const formatAmount = (amount: string, currency: string) => {
    return `${parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currency}`
  }

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      Pending: 'bg-orange-100 text-orange-700',
      Completed: 'bg-green-100 text-green-700',
      Blocked: 'bg-red-100 text-red-700',
      Released: 'bg-emerald-100 text-emerald-700',
    }

    return (
      <Badge variant="secondary" className={statusColors[status] || 'bg-gray-100 text-gray-700'}>
        {status}
      </Badge>
    )
  }

  if (!tellerId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10 text-muted-foreground">
              <p>Teller ID not found.</p>
              <Button variant="outline" onClick={() => navigate('/teller-summary')} className="mt-4">
                <FiArrowLeft className="w-4 h-4 mr-2" />
                Back to Teller Summary
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading transactions...</p>
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
              <h3 className="text-lg font-semibold mb-2">Failed to Load Transactions</h3>
              <p className="text-muted-foreground mb-4">
                {data?.message || (error as Error)?.message || 'An error occurred while loading the transaction data.'}
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => refetch()} disabled={isFetching}>
                  <FiRefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => navigate('/teller-summary')}>
                  <FiArrowLeft className="w-4 h-4 mr-2" />
                  Back to Summary
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back Button and Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/teller-summary')}>
          <FiArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FiActivity className="w-8 h-8" />
            Teller Transactions
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadReport}
          disabled={isDownloading}
        >
          <FiDownload className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
          <span className="ml-2">{isDownloading ? 'Downloading...' : 'Download'}</span>
        </Button>
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

      {/* Teller Details Card */}
      {data.tellerDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Teller Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <FiUser className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="font-semibold">{data.tellerDetails.tellerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FiMail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-semibold">{data.tellerDetails.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FiHash className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">SOL ID</p>
                  <p className="font-semibold font-mono">{data.tellerDetails.solId}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FiActivity className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Transactions</p>
                  <p className="font-semibold">{data.meta.totalCount}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiFilter className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-medium">Filters</h3>
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  {[statusFilter !== 'all' ? 1 : 0, fromDate ? 1 : 0, toDate ? 1 : 0].reduce(
                    (a, b) => a + b,
                    0
                  )}{' '}
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
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value)
                  applyFilters()
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                  <SelectItem value="Released">Released</SelectItem>
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

          {/* Transactions Table */}
          {data?.data && data.data.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>{hasActiveFilters ? 'No transactions found matching your filters.' : 'No transactions found.'}</p>
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
                      <TableHead>Request ID</TableHead>
                      <TableHead>Screening Time</TableHead>
                      <TableHead>Sender</TableHead>
                      <TableHead>Beneficiary</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Message Ref</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((transaction) => (
                      <TableRow key={transaction.transactionId}>
                        <TableCell className="font-mono text-xs">{transaction.requestId}</TableCell>
                        <TableCell className="text-sm">
                          {formatDateTime(transaction.transactionScreeningTime)}
                        </TableCell>
                        <TableCell className="font-medium">{transaction.senderName}</TableCell>
                        <TableCell className="font-medium">{transaction.beneficiaryName}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatAmount(transaction.amount, transaction.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{transaction.transactionType}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{transaction.messageRefNumber}</TableCell>
                        <TableCell>{getStatusBadge(transaction.hitResult)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data && data.meta.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing page {data.meta.page} of {data.meta.totalPages} ({data.meta.totalCount}{' '}
                    total transactions)
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
