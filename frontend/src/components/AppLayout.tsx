import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button } from './ui/button'
import { MessageSquare, Settings, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUser } from '@/stores/useUser'
import { useEffect } from 'react'

export default function AppLayout() {
  const { logout } = useAuth()
  const { selectedUser } = useUser()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    console.log('AppLayout - selectedUser changed:', selectedUser);
  }, [selectedUser]);

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-20 border-r flex flex-col items-center p-4 gap-4">
        <div className="flex-1 flex flex-col items-center gap-4">
          <Button
            variant={location.pathname === '/chat' ? 'secondary' : 'ghost'}
            size="icon"
            asChild
            className="h-12 w-12 rounded-xl"
          >
            <Link to="/chat">
              <MessageSquare className="h-6 w-6" />
            </Link>
          </Button>
          <Button
            variant={location.pathname === '/settings' ? 'secondary' : 'ghost'}
            size="icon"
            asChild
            className="h-12 w-12 rounded-xl"
          >
            <Link to="/settings">
              <Settings 
                className="h-6 w-6" 
              />
            </Link>
          </Button>
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-12 w-12 rounded-xl"
            >
              <Avatar>
                <AvatarImage src={selectedUser?.avatar?.url} />
                <AvatarFallback>
                  {selectedUser?.name.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {void handleLogout()}}
              className="text-red-600 focus:text-red-600"
            >
              <User className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        <Outlet />
      </div>
    </div>
  )
}