
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface TrackedUrl {
  id: string;
  url: string;
  last_price: number | null;
  last_checked: string | null;
  created_at: string;
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
      
      setTrackedUrls(data || []);
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

  const addUrl = async (userId: string, url: string) => {
    try {
      const { data, error } = await supabase
        .from('tracked_urls')
        .insert({
          user_id: userId,
          url: url
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

  const deleteUrl = async (userId: string, id: string) => {
    try {
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

  useEffect(() => {
    if (userId) {
      fetchTrackedUrls(userId);
    }
  }, [userId]);

  return {
    trackedUrls,
    isLoading,
    addUrl: (url: string) => userId ? addUrl(userId, url) : Promise.resolve(false),
    deleteUrl: (id: string) => userId ? deleteUrl(userId, id) : Promise.resolve(false),
    refreshUrls: () => userId && fetchTrackedUrls(userId)
  };
};
