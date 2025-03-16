
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface TrackedUrl {
  id: string;
  url: string;
  last_price: number | null;
  last_checked: string | null;
  created_at: string;
  tags: string[];
}

export const useTrackedUrls = (userId: string | undefined) => {
  const [trackedUrls, setTrackedUrls] = useState<TrackedUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrackedUrls = async (userId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('tracked_urls')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      // Initialize empty tags array if it doesn't exist
      const urlsWithTags = data?.map(url => ({
        ...url,
        tags: url.tags || []
      })) || [];
      
      setTrackedUrls(urlsWithTags);
    } catch (error) {
      console.error("Error fetching tracked URLs:", error);
      toast({
        title: "Error",
        description: "Failed to load your tracked URLs. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addUrl = async (url: string) => {
    try {
      if (!userId) return false;
      
      const { data, error } = await supabase
        .from('tracked_urls')
        .insert({
          user_id: userId,
          url: url,
          tags: []
        })
        .select();
        
      if (error) {
        throw error;
      }
      
      await fetchTrackedUrls(userId);
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add URL. Please try again later.",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteUrl = async (id: string) => {
    try {
      if (!userId) return false;
      
      const { error } = await supabase
        .from('tracked_urls')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      await fetchTrackedUrls(userId);
      toast({
        title: "URL removed",
        description: "The URL has been removed from your tracking list."
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove URL. Please try again later.",
        variant: "destructive"
      });
      return false;
    }
  };

  const addTag = async (urlId: string, tag: string) => {
    try {
      if (!userId) return false;
      
      // Find the URL and its current tags
      const urlToUpdate = trackedUrls.find(url => url.id === urlId);
      if (!urlToUpdate) return false;
      
      // Add the new tag if it doesn't already exist
      const updatedTags = [...(urlToUpdate.tags || [])];
      if (!updatedTags.includes(tag)) {
        updatedTags.push(tag);
      }
      
      // Update the URL with the new tags
      const { error } = await supabase
        .from('tracked_urls')
        .update({ tags: updatedTags })
        .eq('id', urlId);
        
      if (error) {
        throw error;
      }
      
      await fetchTrackedUrls(userId);
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add tag. Please try again later.",
        variant: "destructive"
      });
      return false;
    }
  };

  const removeTag = async (urlId: string, tagToRemove: string) => {
    try {
      if (!userId) return false;
      
      // Find the URL and its current tags
      const urlToUpdate = trackedUrls.find(url => url.id === urlId);
      if (!urlToUpdate) return false;
      
      // Filter out the tag to remove
      const updatedTags = (urlToUpdate.tags || []).filter(tag => tag !== tagToRemove);
      
      // Update the URL with the new tags
      const { error } = await supabase
        .from('tracked_urls')
        .update({ tags: updatedTags })
        .eq('id', urlId);
        
      if (error) {
        throw error;
      }
      
      await fetchTrackedUrls(userId);
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove tag. Please try again later.",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    if (userId) {
      fetchTrackedUrls(userId);
    }
  }, [userId]);

  return {
    trackedUrls,
    isLoading,
    addUrl,
    deleteUrl,
    addTag,
    removeTag,
    refreshUrls: () => userId && fetchTrackedUrls(userId)
  };
};
