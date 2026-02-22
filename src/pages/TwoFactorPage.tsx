import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast, alert } from '@/lib/sweet-alert'
import api from '@/lib/axios'
import { encrypt, decrypt } from '@/lib/encryption'
import { mapRoleToString } from '@/lib/roleUtils'

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
      console.log('2FA - OTP token:', token)
      console.log('2FA - Temp token from login:', tempToken)
      
      // Create the request body with PascalCase Token property
      const requestBody = {
        Token: token
      }
      const requestJson = JSON.stringify(requestBody)
      console.log('2FA - Request JSON:', requestJson)
      
      // Encrypt the request body before sending
      const encryptedToken = await encrypt(requestJson)
      console.log('2FA - Encrypted token:', encryptedToken)
      
      const response = await api.post('/Auth/EncryptedVerify2FA', encryptedToken, {
        headers: {
          Authorization: `Bearer ${tempToken}`,
          'Content-Type': 'application/json',
        }
      })
      
      console.log('2FA - Raw response:', response.data)
      
      // Decrypt the response
      const decryptedResponse = await decrypt(response.data)
      console.log('2FA - Decrypted response:', decryptedResponse)
      
      const data = JSON.parse(decryptedResponse)
      console.log('2FA - Parsed response data:', data)
      
      // Store tokens from 2FA response (API returns PascalCase properties)
      if (data.Data?.AccessToken) {
        console.log('2FA - Storing access token:', data.Data.AccessToken)
        localStorage.setItem('accessToken', data.Data.AccessToken)
      } else {
        console.error('2FA - No access token found')
      }
      
      if (data.Data?.RefreshToken) {
        console.log('2FA - Storing refresh token')
        localStorage.setItem('refreshToken', data.Data.RefreshToken)
      }
      
      // Store user info
      if (data.Data) {
        console.log('2FA - Full Data object:', JSON.stringify(data.Data, null, 2))
        console.log('2FA - Available fields:', Object.keys(data.Data))
        
        const roleValue = data.Data.Role ?? data.Data.role ?? data.Data.UserRole ?? data.Data.userRole
        const role = mapRoleToString(roleValue)
        const userId = data.Data.UserId || data.Data.userId || data.Data.Id || data.Data.id || ''
        
        console.log('2FA - Raw role value:', roleValue)
        console.log('2FA - Mapped role:', role)
        console.log('2FA - Extracted userId:', userId)
        
        const userInfo = {
          email: data.Data.Email || data.Data.email,
          businessUnit: data.Data.BusinessUnit || data.Data.businessUnit,
          solid: data.Data.SOLID || data.Data.solid || data.Data.SolId || data.Data.solId,
          userId: userId,
          role: role,
        }
        
        console.log('2FA - Storing user info:', userInfo)
        localStorage.setItem('user', JSON.stringify(userInfo))
        
        // Redirect based on role
        if (role === 'AUDIT') {
          console.log('2FA - Redirecting AUDIT user to audit-logs')
          toast.success('Verification successful!')
          navigate('/audit-logs')
          return
        }
        
        if (role === 'SUPERVISOR') {
          console.log('2FA - Redirecting SUPERVISOR user to supervisor-dashboard')
          toast.success('Verification successful!')
          navigate('/supervisor-dashboard')
          return
        }
      } else {
        console.error('2FA - No user data found')
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
