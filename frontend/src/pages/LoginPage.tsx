import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from '@/hooks/useAuth'
import { Mail, Lock, User } from 'lucide-react'
import { SiGoogle, SiFacebook } from 'react-icons/si'

export const LoginPage: React.FC = () => {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      await login(email, password)
      navigate('/chat')
    } catch (error) {
      console.error("Login failed:", error)
      setError("Login failed. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = (provider: 'google' | 'facebook') => {
    console.log(import.meta.env.VITE_BACKEND_URL)
    // Redirect to OAuth endpoint
    window.location.href = `${import.meta.env.VITE_BACKEND_URL || 'https://localhost:5000'}/auth/${provider}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <p className="text-sm text-muted-foreground">
            Welcome back
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full h-11"
              onClick={() => handleOAuthLogin('google')}
              disabled={loading}
            >
              <SiGoogle className="w-4 h-4 mr-2" />
              Login with Google
            </Button>
            
            <Button
              variant="outline"
              className="w-full h-11"
              onClick={() => handleOAuthLogin('facebook')}
              disabled={loading}
            >
              <SiFacebook className="w-4 h-4 mr-2" />
              Login with Facebook
            </Button>
          </div>

          <div className="relative">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-background px-2 text-xs text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="link"
                className="px-0 text-sm"
                onClick={() => navigate('/forgot-password')}
              >
                Forgot password?
              </Button>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11" 
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Button 
              variant="link" 
              onClick={() => navigate('/register')} 
              className="p-0 text-blue-600 hover:text-blue-700"
            >
              Register now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}