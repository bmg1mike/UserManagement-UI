import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiDownload, FiFilter, FiX, FiFileText } from 'react-icons/fi'
import api from '@/lib/axios'
import { toast } from '@/lib/sweet-alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { normalizeRole } from '@/lib/roleUtils'

export default function DownloadAuditReportPage() {
  const navigate = useNavigate()
  const [isDownloading, setIsDownloading] = useState(false)

  // Filter states
  const [userEmail, setUserEmail] = useState('')
  const [actionPerformed, setActionPerformed] = useState<string>('all')
  const [entityType, setEntityType] = useState<string>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // Check if user has access (ADMIN, AUDIT, USERACCESS only)
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        const role = normalizeRole(user.role)
        const allowedRoles = ['ADMIN', 'AUDIT', 'USERACCESS']
        
        if (!allowedRoles.includes(role)) {
          toast.error('Access denied. You do not have permission to access this page.')
          navigate('/users')
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error)
    }
  }, [navigate])

  const hasActiveFilters = userEmail !== '' || actionPerformed !== 'all' || entityType !== 'all' || fromDate !== '' || toDate !== ''

  const clearFilters = () => {
    setUserEmail('')
    setActionPerformed('all')
    setEntityType('all')
    setFromDate('')
    setToDate('')
  }

  const handleDownloadReport = async () => {
    // Validate date range if provided
    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      toast.error('From Date cannot be later than To Date')
      return
    }

    setIsDownloading(true)
    try {
      const params = new URLSearchParams()

      if (userEmail) params.append('userEmail', userEmail)
      if (actionPerformed !== 'all') params.append('actionPerformed', actionPerformed)
      if (entityType !== 'all') params.append('entityType', entityType)
      if (fromDate) params.append('fromDate', fromDate)
      if (toDate) params.append('toDate', toDate)

      const response = await api.get(`/AuditLogs/DownloadReport?${params.toString()}`, {
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
      link.download = `Audit_Report_${timestamp}.xlsx`

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FiFileText className="w-8 h-8" />
            Download Audit Report
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate and download audit logs report in Excel format
          </p>
        </div>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FiFilter className="w-5 h-5" />
                Report Filters
              </CardTitle>
              <CardDescription>
                Select filters to customize your audit report. Leave filters empty to download all records.
              </CardDescription>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <FiX className="w-4 h-4 mr-1" />
                Clear all
              </Button>
            )}
          </div>
          {hasActiveFilters && (
            <div className="mt-2">
              <Badge variant="secondary">
                {[
                  userEmail ? 1 : 0,
                  actionPerformed !== 'all' ? 1 : 0,
                  entityType !== 'all' ? 1 : 0,
                  fromDate ? 1 : 0,
                  toDate ? 1 : 0,
                ].reduce((a, b) => a + b, 0)}{' '}
                filter(s) active
              </Badge>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* User Email Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">User Email</label>
              <Input
                type="email"
                placeholder="Enter user email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Filter logs by specific user email
              </p>
            </div>

            {/* Action Performed Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Action Performed</label>
              <Select value={actionPerformed} onValueChange={setActionPerformed}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="Create">Create</SelectItem>
                  <SelectItem value="Read">Read</SelectItem>
                  <SelectItem value="Update">Update</SelectItem>
                  <SelectItem value="Delete">Delete</SelectItem>
                  <SelectItem value="Login">Login</SelectItem>
                  <SelectItem value="Logout">Logout</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Filter by type of action
              </p>
            </div>

            {/* Entity Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Entity Type</label>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select entity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Teller">Teller</SelectItem>
                  <SelectItem value="Transaction">Transaction</SelectItem>
                  <SelectItem value="BulkUpload">Bulk Upload</SelectItem>
                  <SelectItem value="AuditLog">Audit Log</SelectItem>
                  <SelectItem value="System">System</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Filter by entity type
              </p>
            </div>

            {/* From Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                max={toDate || undefined}
              />
              <p className="text-xs text-muted-foreground">
                Start date for the report
              </p>
            </div>

            {/* To Date Filter */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">To Date</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                min={fromDate || undefined}
              />
              <p className="text-xs text-muted-foreground">
                End date for the report
              </p>
            </div>
          </div>

          {/* Download Section */}
          <div className="border-t pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg mb-1">Ready to Download?</h3>
                <p className="text-sm text-muted-foreground">
                  {hasActiveFilters
                    ? 'The report will include only records matching your selected filters.'
                    : 'The report will include all audit log records.'}
                </p>
              </div>
              <Button
                onClick={handleDownloadReport}
                disabled={isDownloading}
                size="lg"
                className="w-full sm:w-auto"
              >
                <FiDownload className={`w-5 h-5 mr-2 ${isDownloading ? 'animate-bounce' : ''}`} />
                {isDownloading ? 'Downloading...' : 'Download Report'}
              </Button>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <FiFileText className="w-4 h-4" />
              Report Information
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
              <li>The report will be downloaded as an Excel (.xlsx) file</li>
              <li>File name format: Audit_Report_YYYY-MM-DD-HHMMSS.xlsx</li>
              <li>The report includes: Timestamp, User Email, Action, Entity Type, Entity ID, and Details</li>
              <li>Large reports may take a few moments to generate</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
