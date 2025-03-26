
import { useState } from 'react';
import { PlusIcon, UserIcon, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrganizationMember } from '@/integrations/supabase/database.types';
import { useToast } from '@/components/ui/use-toast';

interface OrganizationMembersProps {
  members: OrganizationMember[];
  currentUserId: string;
  onAddMember: (email: string, role: string) => Promise<boolean>;
}

export function OrganizationMembers({
  members,
  currentUserId,
  onAddMember
}: OrganizationMembersProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const handleAddMember = async () => {
    if (!memberEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter the new member's email address",
        variant: "destructive"
      });
      return;
    }
    
    setIsAdding(true);
    const success = await onAddMember(memberEmail.trim(), memberRole);
    
    if (success) {
      setMemberEmail('');
      setMemberRole('member');
      setIsAddDialogOpen(false);
    }
    
    setIsAdding(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      case 'member':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage your dealership team
          </CardDescription>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                Invite a new member to your dealership. They'll need to create an account if they don't already have one.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={memberRole} onValueChange={setMemberRole}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                disabled={isAdding}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddMember}
                disabled={!memberEmail.trim() || isAdding}
              >
                {isAdding ? 'Adding...' : 'Add Team Member'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No team members yet
            </div>
          ) : (
            members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <UserIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {member.user_id === currentUserId ? 'You' : member.user_id}
                    </div>
                    <div className={`text-xs px-2 py-0.5 rounded ${getRoleBadgeColor(member.role)}`}>
                      {member.role}
                    </div>
                  </div>
                </div>
                
                {member.user_id !== currentUserId && (
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove member</span>
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
