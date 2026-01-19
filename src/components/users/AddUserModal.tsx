import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FiUserPlus, FiAlertCircle } from 'react-icons/fi'
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

interface AddUserFormData {
  email: string
  name: string
  role: string
  businessUnit: string
  solid: string
}

const ROLES = ['IMTO', 'USERACCESS']

const BUSINESS_UNITS = [
  'NG', 'CI', 'BJ', 'ML', 'SN', 'BF', 'GN', 'CM', 'LR', 'SL', 'GH', 'KE', 'TZ', 'UG', 'ZM', 'MZ', 'CD', 'CG', 'GA', 'TD', 'TG', 'NE'
]

const addUser = async (data: AddUserFormData) => {
  const response = await api.post('/PortalUser/AddUser', data)
  return response.data
}

export default function AddUserModal() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<AddUserFormData>({
    email: '',
    name: '',
    role: '',
    businessUnit: '',
    solid: '',
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: addUser,
    onSuccess: () => {
      toast.success('User added successfully!')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setOpen(false)
      resetForm()
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string }
      const message = axiosError.response?.data?.message || axiosError.message || 'An error occurred while adding the user.'
      setErrorMessage(message)
    },
  })

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      role: '',
      businessUnit: '',
      solid: '',
    })
    setErrorMessage(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    
    // Validation
    if (!formData.email || !formData.name || !formData.role || !formData.businessUnit || !formData.solid) {
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

  const handleInputChange = (field: keyof AddUserFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errorMessage) setErrorMessage(null)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) resetForm()
    }}>
      <DialogTrigger asChild>
        <Button>
          <FiUserPlus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FiUserPlus className="w-5 h-5" />
            Add New User
          </DialogTitle>
          <DialogDescription>
            Create a new portal user. All fields are required.
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

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={mutation.isPending}
            />
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
              <Select
                value={formData.businessUnit}
                onValueChange={(value) => handleInputChange('businessUnit', value)}
                disabled={mutation.isPending}
              >
                <SelectTrigger id="businessUnit">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_UNITS.map((bu) => (
                    <SelectItem key={bu} value={bu}>
                      {bu}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="solid">SOLID</Label>
            <Input
              id="solid"
              placeholder="Enter SOLID code (e.g., 0999)"
              value={formData.solid}
              onChange={(e) => handleInputChange('solid', e.target.value)}
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
                  Adding...
                </>
              ) : (
                'Add User'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
