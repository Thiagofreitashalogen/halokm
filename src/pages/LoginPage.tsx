import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Database, Lock } from 'lucide-react';
import { toast } from 'sonner';

const ACCESS_KEY = 'halogen_kb_access';
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || '';

export function isAuthenticated(): boolean {
  return sessionStorage.getItem(ACCESS_KEY) === 'true';
}

export function logout(): void {
  sessionStorage.removeItem(ACCESS_KEY);
}

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password === APP_PASSWORD) {
      sessionStorage.setItem(ACCESS_KEY, 'true');
      toast.success('Access granted');
      navigate('/', { replace: true });
    } else {
      toast.error('Incorrect password');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/60">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Database className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-semibold">Knowledge Base</CardTitle>
            <CardDescription className="mt-2">
              Enter the password to access the knowledge base
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-11"
                autoFocus
              />
            </div>
            <Button 
              type="submit"
              className="w-full h-11"
              disabled={isLoading || !password}
            >
              {isLoading ? 'Checking...' : 'Access'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
