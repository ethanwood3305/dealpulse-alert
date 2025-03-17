import { useEffect, useState, useCallback } from 'react';
import { toast } from "@/components/ui/use-toast";
import { 
  fetchSubscriptionData, 
  checkCanAddMoreUrls,
  generateApiKeyForUser,
  cancelUserSubscription
} from "@/utils/subscription-utils";
import { UserSubscription } from "@/types/subscription-types";

export { UserSubscription };

export const useSubscription = (userId: string | undefined) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [canAddMoreUrls, setCanAddMoreUrls] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [refreshAttempts, setRefreshAttempts] = useState(0);
  
  const fetchData = useCallback(async (userId: string) => {
    try {
      console.log(`[useSubscription] Fetching subscription data for user: ${userId}`);
      setIsLoading(true);
      
      const { success, data } = await fetchSubscriptionData(userId);
      
      if (success && data) {
        // Compare with current subscription to see if there's a change
        const hasChanged = JSON.stringify(data) !== JSON.stringify(userSubscription);
        
        if (hasChanged) {
          console.log("[useSubscription] Subscription has changed, updating state");
          
          // If this was a refresh after checkout and we got updated data, show a success message
          const checkoutTime = sessionStorage.getItem('checkoutInitiated');
          const expectedPlan = sessionStorage.getItem('expectedPlan');
          
          if (checkoutTime && expectedPlan && expectedPlan === data.plan) {
            toast({
              title: "Subscription Updated!",
              description: `Your subscription has been successfully updated to the ${data.plan} plan.`,
            });
            // Clear checkout data from session storage
            sessionStorage.removeItem('checkoutInitiated');
            sessionStorage.removeItem('expectedPlan');
            sessionStorage.removeItem('expectedUrlCount');
          }
        }
        
        setUserSubscription(data);
      }

      const canAddMore = await checkCanAddMoreUrls(userId);
      setCanAddMoreUrls(canAddMore);
      
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

    const apiKey = await generateApiKeyForUser(userId);
    if (apiKey) {
      setUserSubscription(prev => prev ? {...prev, api_key: apiKey} : null);
      return true;
    }
    return false;
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

    const success = await cancelUserSubscription(userSubscription.stripe_subscription_id);
    if (success) {
      // Local state will be updated on next refresh
      return true;
    }
    
    return false;
  };

  const refreshSubscription = useCallback(async (maxRetries = 5) => {
    if (!userId) return false;
    
    // Increment refresh attempts counter
    setRefreshAttempts(prev => prev + 1);
    
    console.log(`[useSubscription] Manually refreshing subscription data with ${maxRetries} retries (attempt #${refreshAttempts + 1})`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`[useSubscription] Refresh attempt ${attempt} of ${maxRetries}`);
      
      const success = await fetchData(userId);
      
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
  }, [userId, fetchData, refreshAttempts]);

  useEffect(() => {
    if (userId) {
      fetchData(userId);
    }
  }, [userId, fetchData]);

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
