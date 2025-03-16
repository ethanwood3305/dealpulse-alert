
import { useEffect, useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface UserSubscription {
  plan: string;
  urls_limit: number;
  stripe_subscription_id: string | null;
  has_api_access: boolean;
  api_key: string | null;
}

export const useSubscription = (userId: string | undefined) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [canAddMoreUrls, setCanAddMoreUrls] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  
  const fetchSubscriptionData = useCallback(async (userId: string) => {
    try {
      console.log("Fetching subscription data for user:", userId);
      setIsLoading(true);
      
      const { data: subscriptionData, error: subscriptionError } = await supabase.rpc(
        'get_user_subscription', 
        { user_uuid: userId }
      );
      
      if (subscriptionError) {
        console.error("Error fetching subscription:", subscriptionError);
        toast({
          title: "Error",
          description: "Failed to load subscription details. Please try again later.",
          variant: "destructive"
        });
        return false;
      } else if (subscriptionData && subscriptionData.length > 0) {
        console.log("Subscription data received:", subscriptionData[0]);
        setUserSubscription({
          plan: subscriptionData[0].plan,
          urls_limit: subscriptionData[0].urls_limit,
          stripe_subscription_id: subscriptionData[0].stripe_subscription_id,
          has_api_access: subscriptionData[0].has_api_access || false,
          api_key: subscriptionData[0].api_key || null
        });
      } else {
        console.log("No subscription data returned");
      }

      const { data: canAddMoreData, error: canAddMoreError } = await supabase.rpc(
        'can_add_more_urls',
        { user_uuid: userId }
      );
      
      if (canAddMoreError) {
        console.error("Error checking if user can add more URLs:", canAddMoreError);
        return false;
      } else {
        console.log("Can add more URLs:", canAddMoreData);
        setCanAddMoreUrls(canAddMoreData);
      }
      
      setIsLoading(false);
      setLastRefreshed(new Date());
      return true;
    } catch (error) {
      console.error("Error fetching subscription data:", error);
      setIsLoading(false);
      return false;
    }
  }, []);

  const generateApiKey = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to generate an API key.",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('generate-api-key', {
        body: { userId }
      });
      
      if (error) {
        throw error;
      }
      
      if (data?.api_key) {
        setUserSubscription(prev => prev ? {...prev, api_key: data.api_key} : null);
        toast({
          title: "API Key Generated",
          description: "Your new API key has been generated successfully."
        });
        return true;
      } else {
        throw new Error('No API key returned');
      }
    } catch (error: any) {
      console.error("Error generating API key:", error);
      toast({
        title: "Error",
        description: "Failed to generate API key. Please try again later.",
        variant: "destructive"
      });
      return false;
    }
  };

  const cancelSubscription = async () => {
    if (!userId || !userSubscription?.stripe_subscription_id) {
      toast({
        title: "Error",
        description: "You don't have an active subscription to cancel.",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await supabase.functions.invoke('cancel-subscription', {
        body: { 
          subscription_id: userSubscription.stripe_subscription_id 
        }
      });

      if (error) {
        throw error;
      }

      return true;
    } catch (error: any) {
      console.error("Error canceling subscription:", error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again later.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Force refresh subscription with exponential backoff retry mechanism
  const refreshSubscription = useCallback(async (maxRetries = 5) => {
    if (!userId) return false;
    
    console.log(`Manually refreshing subscription data with ${maxRetries} retries`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`Refresh attempt ${attempt} of ${maxRetries}`);
      
      const success = await fetchSubscriptionData(userId);
      
      if (success) {
        console.log("Subscription refreshed successfully");
        return true;
      }
      
      // If not the last attempt, wait before retrying with exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.min(2000 * Math.pow(2, attempt - 1), 10000); // Cap at 10 seconds
        console.log(`Attempt ${attempt} failed, waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    console.log("All refresh attempts failed");
    toast({
      title: "Subscription update failed",
      description: "We couldn't update your subscription information. Please refresh the page or try again later.",
      variant: "destructive"
    });
    return false;
  }, [userId, fetchSubscriptionData]);

  // Initial data load
  useEffect(() => {
    if (userId) {
      fetchSubscriptionData(userId);
    }
  }, [userId, fetchSubscriptionData]);

  // Handle subscription refresh after checkout redirect
  useEffect(() => {
    const checkSearchParams = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const checkoutStatus = searchParams.get('checkout');
      
      if (checkoutStatus === 'success' && userId) {
        console.log("Detected successful checkout, refreshing subscription data");
        
        // Immediate refresh
        await refreshSubscription();
        
        // Remove the checkout parameter from URL to prevent repeated refreshes
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        // Additional delayed refreshes with increasing intervals
        setTimeout(async () => {
          console.log("First delayed subscription refresh after checkout");
          await refreshSubscription(3);
          
          // Second delayed refresh
          setTimeout(async () => {
            console.log("Second delayed subscription refresh after checkout");
            await refreshSubscription(2);
          }, 10000);
        }, 5000);
      }
    };
    
    checkSearchParams();
  }, [userId, refreshSubscription]);

  return {
    isLoading,
    userSubscription,
    canAddMoreUrls,
    cancelSubscription,
    generateApiKey,
    refreshSubscription,
    lastRefreshed
  };
};
