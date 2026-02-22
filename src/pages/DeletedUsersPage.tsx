import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FiClock, FiUser, FiTrash2, FiMail } from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/axios'
import { toast } from '@/lib/sweet-alert'

interface DeletedUser {
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
  lastLogin: string
  delFlag: string
  createdAt: string
}

interface DeletedUsersResponse {
  success: boolean
  data: DeletedUser[]
  meta: {
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export default function DeletedUsersPage() {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

  const { data, isLoading, error } = useQuery<DeletedUsersResponse>({
    queryKey: ['deletedUsers', page, pageSize],
    queryFn: async () => {
      const response = await api.get(`/PortalUser/GetDeletedUsers?page=${page}&pageSize=${pageSize}`)
      return response.data
    },
    staleTime: 30000, // 30 seconds
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    // Check for invalid date
    if (isNaN(date.getTime()) || dateString === '0001-01-01T00:00:00') {
      return 'N/A'
    }
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  }

  const getRoleBadge = (role: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      ADMIN: 'default',
      AUDIT: 'secondary',
      USERACCESS: 'outline',
    }

    return (
      <Badge variant={variants[role] || 'outline'} className="whitespace-nowrap">
        {role}
      </Badge>
    )
  }

  if (error) {
    toast.error('Failed to load deleted users')
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deleted Users</h1>
          <p className="text-muted-foreground mt-1">
            View all deleted user accounts
          </p>
        </div>
        {data && (
          <div className="text-sm text-muted-foreground">
            <div className="text-right">
              <div className="font-semibold text-lg text-foreground">
                {data.meta.totalCount.toLocaleString()}
              </div>
              <div>Total Deleted</div>
            </div>
          </div>
        )}
      </div>

      {/* Deleted Users Table */}
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
                    <th className="text-left py-3 px-4 font-medium text-sm">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Business Unit</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">SOLID</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Last Login</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((user) => (
                    <tr key={user.userId} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-2">
                          <FiUser className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-2">
                          <FiMail className="w-4 h-4 text-muted-foreground" />
                          <span>{user.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{getRoleBadge(user.role)}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className="font-medium">{user.businessUnit}</span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className="font-mono text-xs">{user.solid}</span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-2">
                          <FiClock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs">{formatDate(user.lastLogin)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FiTrash2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No deleted users found</p>
            </div>
          )}

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
        </CardContent>
      </Card>
    </div>
  )
}
