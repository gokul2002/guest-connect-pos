import { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { usePOS } from '@/contexts/POSContext';
import { categories } from '@/data/mockData';
import { MenuItem } from '@/types/pos';
import { useToast } from '@/hooks/use-toast';

export default function Menu() {
  const { menuItems, setMenuItems } = usePOS();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Main Course',
    description: '',
    available: true,
  });

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.category) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (editingItem) {
      setMenuItems(prev => prev.map(item => 
        item.id === editingItem.id
          ? { ...item, ...formData, price: parseFloat(formData.price) }
          : item
      ));
      toast({
        title: 'Item Updated',
        description: `${formData.name} has been updated.`,
      });
    } else {
      const newItem: MenuItem = {
        id: `item-${Date.now()}`,
        ...formData,
        price: parseFloat(formData.price),
      };
      setMenuItems(prev => [...prev, newItem]);
      toast({
        title: 'Item Added',
        description: `${formData.name} has been added to the menu.`,
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', category: 'Main Course', description: '', available: true });
    setEditingItem(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category,
      description: item.description || '',
      available: item.available,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    setMenuItems(prev => prev.filter(item => item.id !== id));
    toast({
      title: 'Item Removed',
      description: `${name} has been removed from the menu.`,
    });
  };

  const toggleAvailability = (id: string) => {
    setMenuItems(prev => prev.map(item =>
      item.id === id ? { ...item, available: !item.available } : item
    ));
  };

  const categoryStats = categories.slice(1).map(cat => ({
    name: cat,
    count: menuItems.filter(item => item.category === cat).length,
  }));

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Menu Management</h1>
            <p className="text-muted-foreground">Manage your restaurant menu items</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">
                  {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                </DialogTitle>
                <DialogDescription>
                  {editingItem ? 'Update the item details' : 'Enter the details of the new menu item'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter item name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹) *</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.slice(1).map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Brief description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="available">Available</Label>
                  <Switch
                    id="available"
                    checked={formData.available}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, available: checked }))}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingItem ? 'Update Item' : 'Add Item'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Category Stats */}
        <div className="grid grid-cols-6 gap-3">
          {categoryStats.map((cat, index) => (
            <Card 
              key={cat.name} 
              className={`cursor-pointer transition-all ${filterCategory === cat.name ? 'border-primary' : ''}`}
              onClick={() => setFilterCategory(filterCategory === cat.name ? 'All' : cat.name)}
            >
              <CardContent className="p-4 text-center">
                <p className="text-xl font-bold">{cat.count}</p>
                <p className="text-xs text-muted-foreground">{cat.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Menu Items Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item, index) => (
            <Card 
              key={item.id} 
              className={`animate-slide-up ${!item.available ? 'opacity-60' : ''}`}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                  </div>
                  <span className="text-lg font-bold text-primary">₹{item.price}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.available}
                      onCheckedChange={() => toggleAvailability(item.id)}
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(item.id, item.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">
              No menu items found
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
