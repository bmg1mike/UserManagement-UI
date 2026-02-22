import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  FiUsers,
  FiUploadCloud,
  FiLogOut,
  FiMenu,
  FiX,
  FiChevronLeft,
  FiActivity,
  FiTrash2,
  FiBarChart,
} from 'react-icons/fi'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { confirm, toast } from '@/lib/sweet-alert'
import api from '@/lib/axios'
import { normalizeRole } from '@/lib/roleUtils'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
  allowedRoles?: string[]
}

const navItems: NavItem[] = [
  { label: 'Supervisor Dashboard', path: '/supervisor-dashboard', icon: <FiBarChart className="w-5 h-5" />, allowedRoles: ['SUPERVISOR'] },
  { label: 'Teller Summary', path: '/teller-summary', icon: <FiActivity className="w-5 h-5" />, allowedRoles: ['SUPERVISOR'] },
  { label: 'Users', path: '/users', icon: <FiUsers className="w-5 h-5" />, allowedRoles: ['ADMIN', 'IMTO', 'COB', 'USERACCESS'] },
  { label: 'Bulk Upload', path: '/bulk-upload', icon: <FiUploadCloud className="w-5 h-5" />, allowedRoles: ['ADMIN', 'IMTO', 'COB', 'USERACCESS'] },
  { label: 'Deleted Users', path: '/deleted-users', icon: <FiTrash2 className="w-5 h-5" />, allowedRoles: ['ADMIN', 'IMTO', 'COB', 'USERACCESS'] },
  { label: 'Audit Logs', path: '/audit-logs', icon: <FiActivity className="w-5 h-5" />, allowedRoles: ['ADMIN', 'AUDIT', 'USERACCESS'] },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Get user info from localStorage
  const getUserInfo = () => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        return JSON.parse(userStr)
      }
    } catch (e) {
      console.error('Error parsing user info:', e)
    }
    return null
  }

  const user = getUserInfo()
  
  // Debug: Log user role
  console.log('Sidebar - Current user:', user)

  // Check if user has access to a nav item
  const hasAccess = (item: NavItem) => {
    if (!item.allowedRoles) return true
    if (!user?.role) {
      console.log('Sidebar - No user role found for item:', item.label)
      return false
    }
    // Normalize roles for comparison
    const normalizedUserRole = normalizeRole(user.role)
    const normalizedAllowedRoles = item.allowedRoles.map(normalizeRole)
    const hasPermission = normalizedAllowedRoles.includes(normalizedUserRole)
    
    console.log('Sidebar Access Check:', {
      item: item.label,
      userRole: user.role,
      normalizedRole: normalizedUserRole,
      allowedRoles: item.allowedRoles,
      normalizedAllowedRoles,
      hasPermission
    })
    
    return hasPermission
  }
  
  // Parse name from email (e.g., "john.doe@ubagroup.com" -> "John Doe")
  const getNameFromEmail = (email: string): string => {
    if (!email) return 'User'
    const namePart = email.split('@')[0]
    return namePart
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ')
  }

  // Get initials from email (e.g., "john.doe@ubagroup.com" -> "JD")
  const getInitialsFromEmail = (email: string): string => {
    if (!email) return 'U'
    const namePart = email.split('@')[0]
    const parts = namePart.split(/[._-]/)
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
    }
    return namePart.substring(0, 2).toUpperCase()
  }

  const displayName = user?.email ? getNameFromEmail(user.email) : 'User'
  const displayEmail = user?.email || 'user@ubagroup.com'
  const initials = user?.email ? getInitialsFromEmail(user.email) : 'U'

  const handleLogout = async () => {
    const confirmed = await confirm('Logout', 'Are you sure you want to logout?', 'Logout', 'Cancel')
    if (confirmed) {
      setIsLoggingOut(true)
      try {
        await api.post('/Auth/logout')
        toast.success('Logged out successfully')
      } catch (error) {
        // Even if the API call fails, we still want to clear local storage and redirect
        console.error('Logout API error:', error)
      } finally {
        // Clear all auth data
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        setIsLoggingOut(false)
        navigate('/')
      }
    }
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-center px-4 py-6">
        <img 
          src="/logo.svg" 
          alt="Logo" 
          className={cn("flex-shrink-0", isCollapsed ? "w-10 h-10" : "h-10")}
        />
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.filter(item => hasAccess(item)).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setIsMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isActive && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
                isCollapsed && 'justify-center'
              )
            }
          >
            {item.icon}
            {!isCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <Separator />

      {/* User section */}
      <div className="p-4">
        <div className={cn('flex items-center gap-3', isCollapsed && 'justify-center')}>
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate capitalize">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          className={cn('w-full mt-3 justify-start gap-3', isCollapsed && 'justify-center')}
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
          ) : (
            <FiLogOut className="w-5 h-5" />
          )}
          {!isCollapsed && <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-64 bg-card border-r transition-transform lg:hidden',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col h-screen bg-card border-r transition-all duration-300',
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
        <SidebarContent />
        
        {/* Collapse button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background shadow-md"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <FiChevronLeft className={cn('w-4 h-4 transition-transform', isCollapsed && 'rotate-180')} />
        </Button>
      </aside>
    </>
  )
}
