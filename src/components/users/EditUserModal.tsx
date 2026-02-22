import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FiEdit, FiAlertCircle } from 'react-icons/fi'
import api from '@/lib/axios'
import { toast } from '@/lib/sweet-alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

interface User {
  userId: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  solid: string
  businessUnit: string
}

interface EditUserFormData {
  email: string
  businessUnit: string
  solId: string
  role: string
  isActive: boolean
}

interface EditUserModalProps {
  user: User
}

const ROLES = ['IMTO', 'USERACCESS', 'AUDIT', 'SUPERVISOR']

const updateUser = async (userId: string, data: EditUserFormData) => {
  const response = await api.put(`/PortalUser/UpdateUser/${userId}`, data)
  return response.data
}

export default function EditUserModal({ user }: EditUserModalProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<EditUserFormData>({
    email: user.email,
    businessUnit: user.businessUnit,
    solId: user.solid,
    role: user.role,
    isActive: user.isActive,
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const queryClient = useQueryClient()

  // Update form data when user prop changes
  useEffect(() => {
    setFormData({
      email: user.email,
      businessUnit: user.businessUnit,
      solId: user.solid,
      role: user.role,
      isActive: user.isActive,
    })
  }, [user])

  const mutation = useMutation({
    mutationFn: (data: EditUserFormData) => updateUser(user.userId, data),
    onSuccess: () => {
      toast.success('User updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setOpen(false)
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string }
      const message = axiosError.response?.data?.message || axiosError.message || 'An error occurred while updating the user.'
      setErrorMessage(message)
    },
  })

  const resetForm = () => {
    setFormData({
      email: user.email,
      businessUnit: user.businessUnit,
      solId: user.solid,
      role: user.role,
      isActive: user.isActive,
    })
    setErrorMessage(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    
    // Validation
    if (!formData.email || !formData.role || !formData.businessUnit || !formData.solId) {
      setErrorMessage('Please fill in all required fields.')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setErrorMessage('Please enter a valid email address.')
      return
    }

    mutation.mutate(formData)
  }

  const handleInputChange = (field: keyof EditUserFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errorMessage) setErrorMessage(null)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) resetForm()
    }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <FiEdit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FiEdit className="w-5 h-5" />
            Edit User
          </DialogTitle>
          <DialogDescription>
            Update user information. Email, role, business unit, and SOL ID are required.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* User Info Display */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-muted-foreground">User ID: {user.userId}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@ubagroup.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={mutation.isPending}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleInputChange('role', value)}
                disabled={mutation.isPending}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessUnit">Business Unit</Label>
              <Input
                id="businessUnit"
                placeholder="Enter business unit (e.g., NG, HQ)"
                value={formData.businessUnit}
                onChange={(e) => handleInputChange('businessUnit', e.target.value)}
                disabled={mutation.isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="solId">SOL ID</Label>
            <Input
              id="solId"
              placeholder="Enter SOL ID (e.g., 0999)"
              value={formData.solId}
              onChange={(e) => handleInputChange('solId', e.target.value)}
              disabled={mutation.isPending}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Active Status</Label>
              <p className="text-xs text-muted-foreground">
                Enable or disable this user account
              </p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked: boolean) => handleInputChange('isActive', checked)}
              disabled={mutation.isPending}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Updating...
                </>
              ) : (
                'Update User'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
