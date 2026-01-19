import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast, alert } from '@/lib/sweet-alert'
import api from '@/lib/axios'

export default function TwoFactorPage() {
  const navigate = useNavigate()
  const [token, setToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      toast.warning('Please enter the verification code')
      return
    }

    setIsLoading(true)

    // Get and immediately remove the temporary token
    const tempToken = localStorage.getItem('token')
    localStorage.removeItem('token')

    try {
      const response = await api.post('/Auth/verify-2fa', { token }, {
        headers: {
          Authorization: `Bearer ${tempToken}`
        }
      })
      
      // Store tokens from 2FA response
      if (response.data.data?.accessToken) {
        localStorage.setItem('accessToken', response.data.data.accessToken)
      }
      if (response.data.data?.refreshToken) {
        localStorage.setItem('refreshToken', response.data.data.refreshToken)
      }
      // Store user info
      if (response.data.data) {
        localStorage.setItem('user', JSON.stringify({
          email: response.data.data.email,
          businessUnit: response.data.data.businessUnit,
          solid: response.data.data.solid,
          userId: response.data.data.userId,
          role: response.data.data.role,
        }))
      }
      
      toast.success('Verification successful!')
      navigate('/users')
    } catch (error) {
      console.error('2FA verification error:', error)
      await alert.error('Login Failed', 'Verification failed. Please try again.')
      navigate('/')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <img src="/logo.svg" alt="Logo" className="h-16" />
          </div>
          <CardTitle className="text-2xl font-bold">Two-Factor Authentication</CardTitle>
          <CardDescription>
            Enter the verification code from your authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Verification Code</Label>
              <Input
                id="token"
                name="token"
                type="password"
                placeholder="Enter 8-digit code"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="text-center text-2xl tracking-widest"
                maxLength={8}
                disabled={isLoading}
                autoComplete="one-time-code"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => navigate('/')}
              disabled={isLoading}
            >
              Back to Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
