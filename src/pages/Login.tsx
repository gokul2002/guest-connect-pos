import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hotel, User, ChefHat, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePOS } from '@/contexts/POSContext';
import { UserRole } from '@/types/pos';
import { useToast } from '@/hooks/use-toast';

const roleOptions: { role: UserRole; icon: typeof User; label: string; description: string }[] = [
  { role: 'admin', icon: Shield, label: 'Admin', description: 'Full access to all features' },
  { role: 'staff', icon: User, label: 'Staff', description: 'Orders and billing' },
  { role: 'chef', icon: ChefHat, label: 'Chef', description: 'Kitchen display' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const { login } = usePOS();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (login(email, selectedRole)) {
      toast({
        title: 'Welcome!',
        description: 'You have successfully logged in.',
      });
      
      switch (selectedRole) {
        case 'admin':
        case 'staff':
          navigate('/dashboard');
          break;
        case 'chef':
          navigate('/kitchen');
          break;
      }
    } else {
      toast({
        title: 'Login Failed',
        description: 'Invalid credentials. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleQuickLogin = (role: UserRole) => {
    const emails: Record<UserRole, string> = {
      admin: 'admin@hotel.com',
      staff: 'john@hotel.com',
      chef: 'ramesh@hotel.com',
    };
    
    setEmail(emails[role]);
    setSelectedRole(role);
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
            <div className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-xl md:rounded-2xl gradient-primary glow-primary">
              <Hotel className="h-7 w-7 md:h-8 md:w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="font-display text-xl md:text-2xl">HotelPOS</CardTitle>
          <CardDescription className="text-sm">Sign in to access the system</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 md:space-y-6 px-4 md:px-6">
          {/* Role Selection */}
          <div className="space-y-2 md:space-y-3">
            <Label className="text-sm">Select Role</Label>
            <div className="grid grid-cols-3 gap-2">
              {roleOptions.map((option) => (
                <Button
                  key={option.role}
                  type="button"
                  variant={selectedRole === option.role ? 'pos-active' : 'pos'}
                  onClick={() => handleQuickLogin(option.role)}
                  className="h-auto py-2.5 md:py-3"
                >
                  <option.icon className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="text-xs font-medium">{option.label}</span>
                </Button>
              ))}
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-3 md:space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 md:h-11"
              />
            </div>

            <Button type="submit" className="w-full h-10 md:h-11" size="lg">
              Sign In
            </Button>
          </form>

          <div className="text-center text-xs md:text-sm text-muted-foreground">
            <p>Quick login emails:</p>
            <div className="flex flex-wrap justify-center gap-1 mt-1">
              <span className="text-primary text-xs">admin@hotel.com</span>
              <span>•</span>
              <span className="text-primary text-xs">john@hotel.com</span>
              <span>•</span>
              <span className="text-primary text-xs">ramesh@hotel.com</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
