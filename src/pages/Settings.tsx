import { useState } from 'react';
import { Plus, Minus, Table2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MainLayout } from '@/components/layout/MainLayout';
import { usePOS } from '@/contexts/POSContext';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { tableCount, setTableCount } = usePOS();
  const { toast } = useToast();
  const [localTableCount, setLocalTableCount] = useState(tableCount);

  const handleIncrement = () => {
    if (localTableCount < 50) {
      setLocalTableCount(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (localTableCount > 1) {
      setLocalTableCount(prev => prev - 1);
    }
  };

  const handleSave = () => {
    setTableCount(localTableCount);
    toast({
      title: 'Settings saved',
      description: `Table count updated to ${localTableCount}`,
    });
  };

  const hasChanges = localTableCount !== tableCount;

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your restaurant settings</p>
        </div>

        {/* Table Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table2 className="h-5 w-5" />
              Table Management
            </CardTitle>
            <CardDescription>
              Configure the number of tables in your restaurant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Number of Tables</Label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-xl"
                  onClick={handleDecrement}
                  disabled={localTableCount <= 1}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                
                <div className="flex-1 max-w-[120px]">
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={localTableCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 1 && val <= 50) {
                        setLocalTableCount(val);
                      }
                    }}
                    className="h-12 text-center text-xl font-bold"
                  />
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-xl"
                  onClick={handleIncrement}
                  disabled={localTableCount >= 50}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum: 1 table, Maximum: 50 tables
              </p>
            </div>

            {/* Preview */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Preview</Label>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 p-4 rounded-xl bg-muted/50 max-h-[200px] overflow-y-auto">
                {Array.from({ length: localTableCount }, (_, i) => i + 1).map((num) => (
                  <div
                    key={num}
                    className="aspect-square rounded-lg border-2 border-green-500 bg-green-500/10 flex items-center justify-center text-xs font-bold text-green-600"
                  >
                    {num}
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges}
              className="w-full sm:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>

            {hasChanges && (
              <p className="text-xs text-orange-500">
                You have unsaved changes
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}