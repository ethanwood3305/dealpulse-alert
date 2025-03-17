import { useEffect, useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface UserSubscription {
  plan: string;
  urls_limit: number;
  stripe_subscription_id: string | null;
  has_api_access: boolean;
  api_key: string | null;
  trial_end: string | null;
}

export const useSubscription = (userId: string | undefined) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [canAddMoreUrls, setCanAddMoreUrls] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [refreshAttempts, setRefreshAttempts] = useState(0);
  
  const fetchSubscriptionData = useCallback(async (userId: string) => {
    try {
      console.log(`[useSubscription] Fetching subscription data for user: ${userId}`);
      setIsLoading(true);
      
      const { data: subscriptionData, error: subscriptionError } = await supabase.rpc(
        'get_user_subscription', 
        { user_uuid: userId }
      );
      
      if (subscriptionError) {
        console.error("[useSubscription] Error fetching subscription:", subscriptionError);
        toast({
          title: "Error",
          description: "Failed to load subscription details. Please try again later.",
          variant: "destructive"
        });
        return false;
      } else if (subscriptionData && subscriptionData.length > 0) {
        console.log("[useSubscription] Subscription data received:", subscriptionData[0]);
        
        // Check if trial has expired
        if (subscriptionData[0].plan === 'trial' && subscriptionData[0].trial_end) {
          const trialEnd = new Date(subscriptionData[0].trial_end);
          const now = new Date();
          
          if (now > trialEnd) {
            console.log("[useSubscription] Trial has expired, reverting to free plan");
            
            // Revert to free plan if trial expired
            const { error: updateError } = await supabase
              .from('subscriptions')
              .update({
                plan: 'free',
                urls_limit: 1,
                trial_end: null,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', userId);
              
            if (updateError) {
              console.error("[useSubscription] Error reverting to free plan:", updateError);
            } else {
              // Update local subscription to free
              subscriptionData[0].plan = 'free';
              subscriptionData[0].urls_limit = 1;
              subscriptionData[0].trial_end = null;
              
              toast({
                title: "Trial Expired",
                description: "Your 48-hour trial has ended. You've been reverted to the free plan.",
              });
            }
          } else {
            // Trial still active
            const hoursLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60));
            console.log(`[useSubscription] Trial active with ${hoursLeft} hours remaining`);
          }
        }
        
        // Compare with current subscription to see if there's a change
        const newSub = {
          plan: subscriptionData[0].plan,
          urls_limit: subscriptionData[0].urls_limit,
          stripe_subscription_id: subscriptionData[0].stripe_subscription_id,
          has_api_access: subscriptionData[0].has_api_access || false,
          api_key: subscriptionData[0].api_key || null,
          trial_end: subscriptionData[0].trial_end || null
        };
        
        // Check if subscription has changed
        const hasChanged = JSON.stringify(newSub) !== JSON.stringify(userSubscription);
        
        if (hasChanged) {
          console.log("[useSubscription] Subscription has changed, updating state");
          
          // If this was a refresh after checkout and we got updated data, show a success message
          const checkoutTime = sessionStorage.getItem('checkoutInitiated');
          const expectedPlan = sessionStorage.getItem('expectedPlan');
          
          if (checkoutTime && expectedPlan && expectedPlan === newSub.plan) {
            toast({
              title: "Subscription Updated!",
              description: `Your subscription has been successfully updated to the ${newSub.plan} plan.`,
            });
            // Clear checkout data from session storage
            sessionStorage.removeItem('checkoutInitiated');
            sessionStorage.removeItem('expectedPlan');
            sessionStorage.removeItem('expectedUrlCount');
          }
        }
        
        setUserSubscription(newSub);
      } else {
        console.log("[useSubscription] No subscription data returned");
      }

      const { data: canAddMoreData, error: canAddMoreError } = await supabase.rpc(
        'can_add_more_urls',
        { user_uuid: userId }
      );
      
      if (canAddMoreError) {
        console.error("[useSubscription] Error checking if user can add more URLs:", canAddMoreError);
        return false;
      } else {
        console.log("[useSubscription] Can add more URLs:", canAddMoreData);
        setCanAddMoreUrls(canAddMoreData);
      }
      
      setIsLoading(false);
      setLastRefreshed(new Date());
      return true;
    } catch (error) {
      console.error("[useSubscription] Error fetching subscription data:", error);
      setIsLoading(false);
      return false;
    }
  }, [userSubscription]);

  const generateApiKey = async (): Promise<boolean> => {
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
      console.error("[useSubscription] Error generating API key:", error);
      toast({
        title: "Error",
        description: "Failed to generate API key. Please try again later.",
        variant: "destructive"
      });
      return false;
    }
  };

  const cancelSubscription = async (): Promise<boolean> => {
    if (!userId || !userSubscription?.stripe_subscription_id) {
      toast({
        title: "Error",
        description: "You don't have an active subscription to cancel.",
        variant: "destructive"
      });
      return false;
    }

    try {
      toast({
        title: "Processing",
        description: "Canceling your subscription, please wait..."
      });
      
      const { error } = await supabase.functions.invoke('cancel-subscription', {
        body: { 
          subscription_id: userSubscription.stripe_subscription_id 
        }
      });

      if (error) {
        throw error;
      }
      
      // Once successful, update the local subscription state
      setUserSubscription(prev => {
        if (!prev) return null;
        return {
          ...prev,
          // Keep the ID but note it's being canceled
          // The stripe-webhook handler will update DB when processing is done
        };
      });

      return true;
    } catch (error: any) {
      console.error("[useSubscription] Error canceling subscription:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription. Please try again later.",
        variant: "destructive"
      });
      return false;
    }
  };

  const refreshSubscription = useCallback(async (maxRetries = 5) => {
    if (!userId) return false;
    
    // Increment refresh attempts counter
    setRefreshAttempts(prev => prev + 1);
    
    console.log(`[useSubscription] Manually refreshing subscription data with ${maxRetries} retries (attempt #${refreshAttempts + 1})`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`[useSubscription] Refresh attempt ${attempt} of ${maxRetries}`);
      
      const success = await fetchSubscriptionData(userId);
      
      if (success) {
        console.log("[useSubscription] Subscription refreshed successfully");
        return true;
      }
      
      // If not the last attempt, wait before retrying with exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.min(2000 * Math.pow(2, attempt - 1), 10000); // Cap at 10 seconds
        console.log(`[useSubscription] Attempt ${attempt} failed, waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    console.log("[useSubscription] All refresh attempts failed");
    toast({
      title: "Subscription update failed",
      description: "We couldn't update your subscription information. Please refresh the page or try again later.",
      variant: "destructive"
    });
    return false;
  }, [userId, fetchSubscriptionData, refreshAttempts]);

  useEffect(() => {
    if (userId) {
      fetchSubscriptionData(userId);
    }
  }, [userId, fetchSubscriptionData]);

  useEffect(() => {
    const checkSearchParams = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const checkoutStatus = searchParams.get('checkout');
      const timestamp = searchParams.get('t');
      const expectedPlan = searchParams.get('plan');
      const expectedUrls = searchParams.get('urls');
      
      if (checkoutStatus === 'success' && userId) {
        console.log("[useSubscription] Detected successful checkout, refreshing subscription data");
        console.log(`[useSubscription] Expected plan: ${expectedPlan}, URLs: ${expectedUrls}`);
        
        // Store the expected values in sessionStorage for validation
        if (expectedPlan) sessionStorage.setItem('expectedPlan', expectedPlan);
        if (expectedUrls) sessionStorage.setItem('expectedUrlCount', expectedUrls);
        sessionStorage.setItem('checkoutInitiated', Date.now().toString());
        
        // Start with a small delay to allow webhook processing
        setTimeout(async () => {
          console.log("[useSubscription] Starting first refresh attempt after checkout");
          await refreshSubscription(3);
          
          // Schedule additional refresh attempts with increasing delays
          const scheduleRefresh = (delayMs: number, attempts: number, index: number) => {
            setTimeout(async () => {
              console.log(`[useSubscription] Running delayed refresh #${index} after checkout (${delayMs}ms delay)`);
              await refreshSubscription(attempts);
            }, delayMs);
          };
          
          // Schedule multiple refresh attempts with increasing delays
          scheduleRefresh(5000, 3, 1);  // 5 second delay
          scheduleRefresh(10000, 3, 2); // 10 second delay
          scheduleRefresh(20000, 2, 3); // 20 second delay
          scheduleRefresh(40000, 2, 4); // 40 second delay
        }, 2000);
        
        // Remove checkout parameters from URL, but keep expected parameters for validation
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
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
    lastRefreshed,
    refreshAttempts
  };
};
