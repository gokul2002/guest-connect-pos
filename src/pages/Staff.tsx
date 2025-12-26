import { useState, useEffect } from 'react';
import { Plus, Trash2, User, ChefHat, Shield, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/pos';
import { useToast } from '@/hooks/use-toast';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

const roleIcons = {
  admin: Shield,
  staff: User,
  chef: ChefHat,
};

const roleColors = {
  admin: 'bg-destructive/10 text-destructive',
  staff: 'bg-primary/10 text-primary',
  chef: 'bg-green-500/10 text-green-600',
};

export default function Staff() {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff' as UserRole,
  });

  const fetchStaff = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: roles } = await supabase.from('user_roles').select('*');
    
    if (profiles && roles) {
      const staffWithRoles = profiles.map(profile => {
        const userRole = roles.find(r => r.user_id === profile.id);
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: (userRole?.role as UserRole) || 'staff',
        };
      });
      setStaffList(staffWithRoles);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const filteredStaff = staffList.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      toast({ title: 'Missing Information', description: 'Please fill in all fields.', variant: 'destructive' });
      return;
    }

    setIsAdding(true);
    const { error } = await signUp(formData.email, formData.password, formData.name, formData.role);
    setIsAdding(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Staff Added', description: `${formData.name} has been added.` });
      setFormData({ name: '', email: '', password: '', role: 'staff' });
      setIsDialogOpen(false);
      fetchStaff();
    }
  };

  const stats = {
    total: staffList.length,
    admins: staffList.filter(u => u.role === 'admin').length,
    staff: staffList.filter(u => u.role === 'staff').length,
    chefs: staffList.filter(u => u.role === 'chef').length,
  };

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Staff</h1>
            <p className="text-sm text-muted-foreground">Manage team members</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" />Add Staff</Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] sm:max-w-md">
              <DialogHeader><DialogTitle className="font-display">Add Staff</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input placeholder="Full name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" placeholder="email@hotel.com" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Password *</Label>
                  <Input type="password" placeholder="Min 6 characters" value={formData.password} onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Select value={formData.role} onValueChange={(value: UserRole) => setFormData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="chef">Chef</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1" disabled={isAdding}>{isAdding ? 'Adding...' : 'Add'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 md:gap-4">
          <Card><CardContent className="p-3 md:p-4 text-center"><p className="text-lg md:text-2xl font-bold">{stats.total}</p><p className="text-[10px] md:text-sm text-muted-foreground">Total</p></CardContent></Card>
          <Card><CardContent className="p-3 md:p-4 text-center"><p className="text-lg md:text-2xl font-bold">{stats.admins}</p><p className="text-[10px] md:text-sm text-muted-foreground">Admin</p></CardContent></Card>
          <Card><CardContent className="p-3 md:p-4 text-center"><p className="text-lg md:text-2xl font-bold">{stats.staff}</p><p className="text-[10px] md:text-sm text-muted-foreground">Staff</p></CardContent></Card>
          <Card><CardContent className="p-3 md:p-4 text-center"><p className="text-lg md:text-2xl font-bold">{stats.chefs}</p><p className="text-[10px] md:text-sm text-muted-foreground">Chef</p></CardContent></Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-10 h-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        {/* Staff List */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredStaff.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No staff found</p>
          ) : (
            filteredStaff.map((user) => {
              const RoleIcon = roleIcons[user.role];
              return (
                <Card key={user.id}>
                  <CardContent className="p-3 md:p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">{user.name.charAt(0)}</div>
                      <div>
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${roleColors[user.role]}`}>
                      <RoleIcon className="h-3 w-3" />{user.role}
                    </span>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </MainLayout>
  );
}
