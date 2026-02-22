import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { FiUploadCloud, FiFile, FiX, FiDownload, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'
import * as XLSX from 'xlsx'
import api from '@/lib/axios'
import { toast, alert } from '@/lib/sweet-alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface UploadResponse {
  success: boolean
  message: string
  data?: {
    totalRecords?: number
    successCount?: number
    failedCount?: number
    errors?: string[]
  }
}

const bulkUploadUsers = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData()
  formData.append('excelFile', file)

  const response = await api.post('/PortalUser/BulkAddUsers', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export default function BulkUploadPage() {
  const navigate = useNavigate()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const mutation = useMutation({
    mutationFn: bulkUploadUsers,
    onSuccess: (data) => {
      alert.success('Upload Successful', data.message || 'Users uploaded successfully!')
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    onError: (error: unknown) => {
      // Extract message from API response if available
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string }
      const errorMessage = axiosError.response?.data?.message || axiosError.message || 'An error occurred while uploading the file.'
      alert.error('Upload Failed', errorMessage)
    },
  })

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]
    const validExtensions = ['.xlsx']
    
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      toast.error('Please upload an Excel file (.xlsx)')
      return
    }

    setSelectedFile(file)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUpload = () => {
    if (!selectedFile) {
      toast.warning('Please select a file first')
      return
    }
    mutation.mutate(selectedFile)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const downloadTemplate = () => {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const wsData = [
      ['BusinessUnit', 'Name', 'Email Address', 'SOL ID', 'Role'],
      ['NG', 'John Doe', 'user@ubagroup.com', '0999', 'IMTO'],
    ]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    
    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, // BusinessUnit
      { wch: 20 }, // Name
      { wch: 25 }, // Email Address
      { wch: 10 }, // SOL ID
      { wch: 12 }, // Role
    ]
    
    XLSX.utils.book_append_sheet(wb, ws, 'Users')
    
    // Generate and download file
    XLSX.writeFile(wb, 'bulk_users_template.xlsx')
    toast.success('Template downloaded!')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FiUploadCloud className="w-8 h-8" />
          Bulk User Upload
        </h1>
        <p className="text-muted-foreground mt-1">
          Upload an Excel file (.xlsx) to add multiple users at once
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
            <CardDescription>
              Drag and drop or click to select a file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drop Zone */}
            <div
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
                ${mutation.isPending ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                onChange={handleFileSelect}
                className="hidden"
                disabled={mutation.isPending}
              />
              
              <FiUploadCloud className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">
                {dragActive ? 'Drop file here' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Excel files (.xlsx) only
              </p>
            </div>

            {/* Selected File */}
            {selectedFile && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <FiFile className="w-8 h-8 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveFile()
                  }}
                  disabled={mutation.isPending}
                >
                  <FiX className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Upload Button */}
            <Button
              className="w-full"
              onClick={handleUpload}
              disabled={!selectedFile || mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <FiUploadCloud className="w-4 h-4 mr-2" />
                  Upload Users
                </>
              )}
            </Button>

            {/* Upload Result */}
            {mutation.isSuccess && mutation.data?.data && (
              <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-medium mb-2">
                  <FiCheckCircle className="w-5 h-5" />
                  Upload Completed
                </div>
                <div className="text-sm text-green-600 dark:text-green-400 space-y-1">
                  {mutation.data.data.totalRecords !== undefined && (
                    <p>Total Records: {mutation.data.data.totalRecords}</p>
                  )}
                  {mutation.data.data.successCount !== undefined && (
                    <p>Successfully Added: {mutation.data.data.successCount}</p>
                  )}
                  {mutation.data.data.failedCount !== undefined && mutation.data.data.failedCount > 0 && (
                    <p className="text-amber-600 dark:text-amber-400">
                      Failed: {mutation.data.data.failedCount}
                    </p>
                  )}
                </div>
              </div>
            )}

            {mutation.isError && (
              <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-medium">
                  <FiAlertCircle className="w-5 h-5" />
                  Upload Failed
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
            <CardDescription>
              How to prepare your file for bulk upload
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">
                  1
                </span>
                <p className="text-sm">
                  Download the template file to see the required format
                </p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">
                  2
                </span>
                <p className="text-sm">
                  Fill in the user data with the following columns:
                  <span className="block mt-1 text-muted-foreground">
                    BusinessUnit, Name, Email Address, SOL ID, Role
                  </span>
                </p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">
                  3
                </span>
                <p className="text-sm">
                  Save the file as Excel format (.xlsx)
                </p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">
                  4
                </span>
                <p className="text-sm">
                  Upload the file using the form on the left
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Required Columns</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-muted rounded">
                  <span className="font-mono">BusinessUnit</span>
                  <span className="block text-muted-foreground text-xs">e.g., NG, CI, BJ</span>
                </div>
                <div className="p-2 bg-muted rounded">
                  <span className="font-mono">Name</span>
                  <span className="block text-muted-foreground text-xs">Full name</span>
                </div>
                <div className="p-2 bg-muted rounded">
                  <span className="font-mono">Email Address</span>
                  <span className="block text-muted-foreground text-xs">User's email address</span>
                </div>
                <div className="p-2 bg-muted rounded">
                  <span className="font-mono">SOL ID</span>
                  <span className="block text-muted-foreground text-xs">SOLID code e.g., 0999</span>
                </div>
                <div className="p-2 bg-muted rounded col-span-2">
                  <span className="font-mono">Role</span>
                  <span className="block text-muted-foreground text-xs">IMTO or USERACCESS</span>
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={downloadTemplate}>
              <FiDownload className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
