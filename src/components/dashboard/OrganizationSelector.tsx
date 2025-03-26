
import { useState } from 'react';
import { CheckIcon, ChevronDownIcon, PlusCircleIcon, UsersIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Organization } from '@/integrations/supabase/database.types';

interface OrganizationSelectorProps {
  organizations: Organization[];
  currentOrganization: Organization | null;
  onSwitchOrganization: (organizationId: string) => void;
  onCreateOrganization: (name: string) => Promise<boolean> | boolean;
}

export function OrganizationSelector({
  organizations,
  currentOrganization,
  onSwitchOrganization,
  onCreateOrganization
}: OrganizationSelectorProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateOrganization = async () => {
    if (!newOrgName.trim()) return;
    
    setIsCreating(true);
    const success = await Promise.resolve(onCreateOrganization(newOrgName.trim()));
    
    if (success) {
      setNewOrgName('');
      setIsCreateDialogOpen(false);
    }
    
    setIsCreating(false);
  };

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4" />
            <span className="max-w-[150px] truncate">
              {currentOrganization?.name || 'Select Dealership'}
            </span>
            <ChevronDownIcon className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[220px]">
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => onSwitchOrganization(org.id)}
              className="flex items-center justify-between"
            >
              <span className="truncate">{org.name}</span>
              {currentOrganization?.id === org.id && (
                <CheckIcon className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-start mt-2 text-primary"
                size="sm"
              >
                <PlusCircleIcon className="h-4 w-4 mr-2" />
                Create New Dealership
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Dealership</DialogTitle>
                <DialogDescription>
                  Create a new dealership to organize your tracked vehicles.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Dealership Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter dealership name"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateOrganization}
                  disabled={!newOrgName.trim() || isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Dealership'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
