import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from '@/hooks/useAuth'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { loginWithToken } = useAuth()
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = React.useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token')
        const error = searchParams.get('error')

        if (error) {
          setStatus('error')
          setMessage(`Login failed: ${error}`)
          navigate('/login');
          // setTimeout(() => navigate('/login'), 3000)
          return
        }

        if (token) {
            console.log('Received token:', token);
            await loginWithToken(token);
            setStatus('success');
            setMessage('Login successful! Redirecting to chat...');
            navigate('/chat');
            // setTimeout(() => navigate('/chat'), 2000);
          } else {
            setStatus('error');
            setMessage('No token received');
            navigate('/login');
            // setTimeout(() => navigate('/login'), 3000);
          }
      } catch (error) {
        console.error('OAuth callback error:', error)
        setStatus('error')
        setMessage('An error occurred during authentication')
        setTimeout(() => navigate('/login'), 3000)
      }
    }

    handleCallback()
  }, [searchParams, navigate, loginWithToken])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            {status === 'loading' && (
              <>
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                <h2 className="text-lg font-semibold">Processing login...</h2>
                <p className="text-sm text-muted-foreground">Please wait a moment</p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle className="w-8 h-8 mx-auto text-green-600" />
                <h2 className="text-lg font-semibold text-green-700">Login successful!</h2>
                <p className="text-sm text-muted-foreground">{message}</p>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="w-8 h-8 mx-auto text-red-600" />
                <h2 className="text-lg font-semibold text-red-700">Login failed</h2>
                <Alert variant="destructive">
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}