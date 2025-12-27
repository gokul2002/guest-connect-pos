import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hotel, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useRestaurantSettings } from '@/hooks/useRestaurantSettings';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { signIn, user, role } = useAuth();
  const { settings } = useRestaurantSettings();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user && role) {
      if (role === 'chef') {
        navigate('/kitchen');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, role, navigate]);

  const validateForm = () => {
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);
    
    if (error) {
      toast({
        title: 'Login Failed',
        description: error.message === 'Invalid login credentials' 
          ? 'Invalid email or password. Please try again.'
          : error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-60 md:h-80 w-60 md:w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-60 md:h-80 w-60 md:w-80 rounded-full bg-primary/5 blur-3xl" />
      </div>
      
      <Card className="w-full max-w-md relative animate-fade-in glass-card">
        <CardHeader className="text-center pb-2 px-4 md:px-6">
          <div className="flex justify-center mb-3 md:mb-4">
            {settings?.restaurantLogoUrl ? (
              <img
                src={settings.restaurantLogoUrl}
                alt="Restaurant Logo"
                className="h-14 w-14 md:h-16 md:w-16 rounded-xl md:rounded-2xl object-contain"
              />
            ) : (
              <div className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-xl md:rounded-2xl gradient-primary glow-primary">
                <Hotel className="h-7 w-7 md:h-8 md:w-8 text-primary-foreground" />
              </div>
            )}
          </div>
          <CardTitle className="font-display text-xl md:text-2xl">
            {settings?.restaurantName || 'HotelPOS'}
          </CardTitle>
          <CardDescription className="text-sm">Sign in to your account</CardDescription>
        </CardHeader>
        
        <CardContent className="px-4 md:px-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-11 w-11"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full h-11" size="lg" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground border-t pt-4">
            <ShieldAlert className="h-4 w-4" />
            <span>Need an account? Contact your administrator.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
