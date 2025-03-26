
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Organization, OrganizationMember } from '@/integrations/supabase/database.types';

export const useOrganization = (userId: string | undefined) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizationMembers, setOrganizationMembers] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all organizations the user is a member of
  const fetchUserOrganizations = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      
      // Use the new database function to get organization IDs without recursion
      const { data: orgIds, error: funcError } = await supabase
        .rpc('get_user_organizations', { user_uuid: userId });
        
      if (funcError) {
        console.error('Error fetching organization IDs:', funcError);
        throw funcError;
      }
      
      if (orgIds && orgIds.length > 0) {
        // Fetch organization details for these IDs
        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select('*')
          .in('id', orgIds)
          .order('created_at', { ascending: false });
          
        if (orgsError) throw orgsError;
        
        setOrganizations(orgsData || []);
        
        // Set the first organization as current if not already set
        if (orgsData && orgsData.length > 0 && !currentOrganization) {
          setCurrentOrganization(orgsData[0]);
          
          // Fetch members for this organization
          fetchOrganizationMembers(orgsData[0].id);
        }
      } else {
        setOrganizations([]);
      }
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
      toast({
        title: "Error",
        description: "Failed to load your organizations. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentOrganization]);

  // Fetch members of a specific organization
  const fetchOrganizationMembers = async (organizationId: string) => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          user_id,
          organization_id,
          role,
          created_at,
          updated_at
        `)
        .eq('organization_id', organizationId);
        
      if (error) throw error;
      
      setOrganizationMembers(data || []);
    } catch (error: any) {
      console.error('Error fetching organization members:', error);
    }
  };

  // Switch the current organization
  const switchOrganization = useCallback(async (organizationId: string) => {
    if (!userId) return false;
    
    try {
      const org = organizations.find(o => o.id === organizationId);
      if (!org) return false;
      
      setCurrentOrganization(org);
      
      // Fetch members for this organization
      await fetchOrganizationMembers(organizationId);
      
      return true;
    } catch (error: any) {
      console.error('Error switching organization:', error);
      return false;
    }
  }, [userId, organizations]);

  // Create a new organization
  const createOrganization = useCallback(async (name: string) => {
    if (!userId) return false;
    
    try {
      // Insert the new organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({ name })
        .select()
        .single();
        
      if (orgError) throw orgError;
      
      if (!orgData) throw new Error("Failed to create organization");
      
      // Add the current user as an admin member
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          user_id: userId,
          organization_id: orgData.id,
          role: 'admin'
        });
        
      if (memberError) throw memberError;
      
      // Refresh the organizations list
      await fetchUserOrganizations();
      
      // Switch to the newly created organization
      await switchOrganization(orgData.id);
      
      toast({
        title: "Organization Created",
        description: `You've successfully created the ${name} organization.`
      });
      
      return true;
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create organization. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  }, [userId, fetchUserOrganizations, switchOrganization]);

  // Add a member to the current organization
  const addOrganizationMember = useCallback(async (email: string, role: string = 'member') => {
    if (!userId || !currentOrganization) return false;
    
    try {
      // We need to find the user by email using a different approach
      // First, make an RPC call to a function that can find the user by email
      // or use a different method to find the user ID
      
      // For now, we'll use auth.user function call through edge function
      const { data: userData, error: functionError } = await supabase.functions.invoke('get-user-by-email', {
        body: { email }
      });
      
      if (functionError) {
        throw new Error(functionError.message || "Failed to find user");
      }
      
      if (!userData || !userData.id) {
        throw new Error(`No user found with email ${email}`);
      }
      
      // Add the user to the organization
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          user_id: userData.id,
          organization_id: currentOrganization.id,
          role
        });
        
      if (memberError) {
        if (memberError.code === '23505') { // Unique violation
          throw new Error(`User is already a member of this organization`);
        }
        throw memberError;
      }
      
      // Refresh the members list
      await fetchOrganizationMembers(currentOrganization.id);
      
      toast({
        title: "Member Added",
        description: `${email} has been added to the organization.`
      });
      
      return true;
    } catch (error: any) {
      console.error('Error adding organization member:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add member. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  }, [userId, currentOrganization]);

  // Initial data fetch
  useEffect(() => {
    if (userId) {
      fetchUserOrganizations();
    }
  }, [userId, fetchUserOrganizations]);

  return {
    organizations,
    currentOrganization,
    organizationMembers,
    isLoading,
    switchOrganization,
    createOrganization,
    addOrganizationMember,
    fetchUserOrganizations
  };
};
