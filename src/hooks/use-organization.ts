
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Organization, OrganizationMember } from '@/integrations/supabase/database.types';

export const useOrganization = (userId: string | undefined) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizationMembers, setOrganizationMembers] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFixedRLS, setHasFixedRLS] = useState(false);
  const [isFixingRLS, setIsFixingRLS] = useState(false);

  // Function to fix RLS policies using the edge function
  const fixRLSPolicies = useCallback(async () => {
    try {
      setIsFixingRLS(true);
      console.log('[useOrganization] Attempting to fix RLS policies using edge function');
      
      const { data, error } = await supabase.functions.invoke('fix-organization-permissions');
      
      if (error) {
        console.error('[useOrganization] Error invoking fix-organization-permissions:', error);
        toast({
          title: "Error",
          description: "Could not fix permissions. Please try again later.",
          variant: "destructive"
        });
        setIsFixingRLS(false);
        return false;
      }
      
      console.log('[useOrganization] RLS fix response:', data);
      setHasFixedRLS(true);
      toast({
        title: "Success",
        description: "Organization permissions fixed successfully."
      });
      
      // Wait a moment before retrying to fetch data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsFixingRLS(false);
      return true;
    } catch (error) {
      console.error('[useOrganization] Error in fixRLSPolicies:', error);
      setIsFixingRLS(false);
      return false;
    }
  }, []);

  // Fetch all organizations the user is a member of
  const fetchUserOrganizations = useCallback(async () => {
    if (!userId) {
      console.log('[useOrganization] No userId provided, skipping fetchUserOrganizations');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('[useOrganization] Starting fetchUserOrganizations for user:', userId);
      setIsLoading(true);
      
      // Try with RPC function first (more secure approach)
      console.log('[useOrganization] First approach: Get user orgs through RPC function');
      console.log('[useOrganization] Calling RPC function get_user_organizations with user_uuid:', userId);
      
      const { data: orgIds, error: funcError } = await supabase
        .rpc('get_user_organizations', { user_uuid: userId });
        
      console.log('[useOrganization] RPC response - data:', orgIds);
      console.log('[useOrganization] RPC response - error:', funcError);
      
      if (funcError) {
        console.error('[useOrganization] Error fetching organization IDs from RPC:', funcError);
        
        // Check for infinite recursion error - a known issue with RLS policies
        if (funcError.code === '42P17' && !hasFixedRLS) {
          console.log('[useOrganization] Detected RLS recursion error, attempting to fix');
          await fixRLSPolicies();
          return;
        }
        
        // For other errors, fallback to direct query as a last resort
        console.log('[useOrganization] Fallback approach: Direct query to organization_members');
        const { data: memberData, error: memberError } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', userId);
          
        console.log('[useOrganization] Direct query response - data:', memberData);
        console.log('[useOrganization] Direct query response - error:', memberError);
        
        if (memberError) {
          // If we still have an infinite recursion error, try to fix RLS policies
          if (memberError.code === '42P17' && !hasFixedRLS) {
            console.log('[useOrganization] Detected RLS recursion error in fallback, attempting to fix');
            await fixRLSPolicies();
            return;
          }
          
          console.error('[useOrganization] Both approaches failed to fetch organization IDs:', memberError);
          setIsLoading(false);
          return;
        }
        
        if (memberData && memberData.length > 0) {
          const extractedOrgIds = memberData.map(item => item.organization_id);
          console.log('[useOrganization] Extracted org IDs from direct query:', extractedOrgIds);
          
          await fetchOrganizationsData(extractedOrgIds);
        } else {
          console.log('[useOrganization] No organizations found in direct query');
          setOrganizations([]);
          setIsLoading(false);
        }
      } else if (orgIds && orgIds.length > 0) {
        console.log('[useOrganization] Successfully got org IDs from RPC:', orgIds);
        await fetchOrganizationsData(orgIds);
      } else {
        console.log('[useOrganization] No organizations found for user from RPC');
        setOrganizations([]);
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('[useOrganization] Error in fetchUserOrganizations:', error);
      
      // Check if the error is related to RLS infinite recursion
      if (error.code === '42P17' && !hasFixedRLS) {
        console.log('[useOrganization] Detected infinite recursion error, attempting to fix RLS');
        await fixRLSPolicies();
        return;
      }
      
      setIsLoading(false);
    }
  }, [userId, hasFixedRLS, fixRLSPolicies]);

  // Helper function to fetch organization data by IDs
  const fetchOrganizationsData = async (orgIds: string[]) => {
    try {
      console.log('[useOrganization] Fetching organizations data for IDs:', orgIds);
      
      // Try with direct client first
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .in('id', orgIds)
        .order('created_at', { ascending: false });
        
      console.log('[useOrganization] Organizations query response - data:', orgsData);
      console.log('[useOrganization] Organizations query response - error:', orgsError);
        
      if (orgsError && orgsError.code === '42P17' && !hasFixedRLS) {
        // If we hit the infinite recursion error, try to fix RLS policies
        console.log('[useOrganization] Detected RLS recursion error in orgs fetch, attempting to fix');
        await fixRLSPolicies();
        return;
      }
      
      if (orgsError) {
        console.error('[useOrganization] Error fetching organizations data:', orgsError);
        setIsLoading(false);
        return;
      }
      
      if (orgsData && orgsData.length > 0) {
        console.log('[useOrganization] Setting organizations state with data:', orgsData);
        setOrganizations(orgsData);
        
        // Set the first organization as current if not already set
        if (!currentOrganization) {
          console.log('[useOrganization] Setting current organization to:', orgsData[0]);
          setCurrentOrganization(orgsData[0]);
          
          // Fetch members for this organization
          await fetchOrganizationMembers(orgsData[0].id);
        }
      } else {
        console.log('[useOrganization] No organizations data found despite having IDs');
        setOrganizations([]);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('[useOrganization] Error in fetchOrganizationsData:', error);
      setIsLoading(false);
    }
  };

  // Fetch members of a specific organization
  const fetchOrganizationMembers = async (organizationId: string) => {
    if (!userId) {
      console.log('[useOrganization] No userId provided, skipping fetchOrganizationMembers');
      return;
    }
    
    try {
      console.log('[useOrganization] Fetching members for organization:', organizationId);
      
      // Use a direct query to bypass RLS
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
        
      console.log('[useOrganization] Organization members query response - data:', data);
      console.log('[useOrganization] Organization members query response - error:', error);
        
      if (error && error.code === '42P17' && !hasFixedRLS) {
        // If we hit the infinite recursion error, try to fix RLS policies
        console.log('[useOrganization] Detected RLS recursion error in members fetch, attempting to fix');
        await fixRLSPolicies();
        return;
      }
      
      if (error) {
        console.error('[useOrganization] Error fetching organization members:', error);
        return;
      }
      
      console.log('[useOrganization] Setting organization members state with data:', data || []);
      setOrganizationMembers(data || []);
    } catch (error: any) {
      console.error('[useOrganization] Error in fetchOrganizationMembers:', error);
    }
  };

  // Switch the current organization
  const switchOrganization = useCallback(async (organizationId: string) => {
    if (!userId) {
      console.log('[useOrganization] No userId provided, skipping switchOrganization');
      return false;
    }
    
    try {
      console.log('[useOrganization] Switching to organization:', organizationId);
      const org = organizations.find(o => o.id === organizationId);
      
      if (!org) {
        console.log('[useOrganization] Organization not found in state:', organizationId);
        return false;
      }
      
      console.log('[useOrganization] Found organization in state:', org);
      setCurrentOrganization(org);
      
      // Fetch members for this organization
      await fetchOrganizationMembers(organizationId);
      
      return true;
    } catch (error: any) {
      console.error('[useOrganization] Error in switchOrganization:', error);
      return false;
    }
  }, [userId, organizations]);

  // Create a new organization
  const createOrganization = useCallback(async (name: string) => {
    if (!userId) {
      console.log('[useOrganization] No userId provided, skipping createOrganization');
      return false;
    }
    
    try {
      console.log('[useOrganization] Creating organization with name:', name);
      
      // Insert the new organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({ name })
        .select()
        .single();
        
      console.log('[useOrganization] Organization creation response - data:', orgData);
      console.log('[useOrganization] Organization creation response - error:', orgError);
      
      if (orgError) {
        console.error('[useOrganization] Error creating organization:', orgError);
        throw orgError;
      }
      
      if (!orgData) {
        console.error('[useOrganization] No data returned when creating organization');
        throw new Error("Failed to create organization");
      }
      
      // Add the current user as an admin member
      console.log('[useOrganization] Adding user as admin to new organization');
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          user_id: userId,
          organization_id: orgData.id,
          role: 'admin'
        });
        
      console.log('[useOrganization] Member addition response - error:', memberError);
        
      if (memberError) {
        console.error('[useOrganization] Error adding user as admin to organization:', memberError);
        throw memberError;
      }
      
      // Refresh the organizations list
      console.log('[useOrganization] Refreshing organizations list after creation');
      await fetchUserOrganizations();
      
      // Switch to the newly created organization
      console.log('[useOrganization] Switching to newly created organization');
      await switchOrganization(orgData.id);
      
      toast({
        title: "Organization Created",
        description: `You've successfully created the ${name} organization.`
      });
      
      return true;
    } catch (error: any) {
      console.error('[useOrganization] Error in createOrganization:', error);
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
    if (!userId || !currentOrganization) {
      console.log('[useOrganization] No userId or currentOrganization provided, skipping addOrganizationMember');
      return false;
    }
    
    try {
      console.log('[useOrganization] Adding member to organization:', { email, role, organizationId: currentOrganization.id });
      
      // Use the edge function to find the user by email
      console.log('[useOrganization] Invoking get-user-by-email edge function');
      const response = await supabase.functions.invoke('get-user-by-email', {
        body: { email }
      });
      
      console.log('[useOrganization] Edge function response:', response);
      
      if (response.error) {
        console.error('[useOrganization] Error from get-user-by-email function:', response.error);
        throw new Error(response.error.message || "Failed to find user");
      }
      
      const userData = response.data;
      
      if (!userData || !userData.id) {
        console.error('[useOrganization] No user data returned from edge function');
        throw new Error(`No user found with email ${email}`);
      }
      
      console.log('[useOrganization] Found user:', userData);
      
      // Add the user to the organization
      console.log('[useOrganization] Adding user to organization');
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          user_id: userData.id,
          organization_id: currentOrganization.id,
          role
        });
        
      console.log('[useOrganization] Member insertion response - error:', memberError);
        
      if (memberError) {
        if (memberError.code === '23505') { // Unique violation
          console.error('[useOrganization] User is already a member of this organization');
          throw new Error(`User is already a member of this organization`);
        }
        console.error('[useOrganization] Error adding user to organization:', memberError);
        throw memberError;
      }
      
      // Refresh the members list
      console.log('[useOrganization] Refreshing organization members after adding new member');
      await fetchOrganizationMembers(currentOrganization.id);
      
      toast({
        title: "Member Added",
        description: `${email} has been added to the organization.`
      });
      
      return true;
    } catch (error: any) {
      console.error('[useOrganization] Error in addOrganizationMember:', error);
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
    console.log('[useOrganization] useEffect triggered with userId:', userId);
    if (userId) {
      console.log('[useOrganization] Fetching organizations for user:', userId);
      fetchUserOrganizations();
    } else {
      setIsLoading(false);
    }
  }, [userId, fetchUserOrganizations]);

  return {
    organizations,
    currentOrganization,
    organizationMembers,
    isLoading,
    isFixingRLS,
    switchOrganization,
    createOrganization,
    addOrganizationMember,
    fetchUserOrganizations,
    fixRLSPolicies
  };
};
