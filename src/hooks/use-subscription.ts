
import { useEffect, useState, useCallback } from 'react';
import { 
  fetchSubscriptionData, 
  checkCanAddMoreUrls,
  generateApiKeyForUser
} from "@/utils/subscription-utils";
import type { UserSubscription } from "@/types/subscription-types";

export type { UserSubscription };

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
    if (!userId) return false;
    const apiKey = await generateApiKeyForUser(userId);
    if (apiKey) {
      setUserSubscription(prev => prev ? {...prev, api_key: apiKey} : null);
      return true;
    }
    return false;
  };

  const refreshSubscription = useCallback(async (maxRetries = 3) => {
    if (!userId) return false;
    
    setRefreshAttempts(prev => prev + 1);
    
    console.log(`[useSubscription] Manually refreshing subscription data with ${maxRetries} retries (attempt #${refreshAttempts + 1})`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`[useSubscription] Refresh attempt ${attempt} of ${maxRetries}`);
      
      const success = await fetchData(userId);
      
      if (success) {
        console.log("[useSubscription] Subscription refreshed successfully");
        return true;
      }
      
      if (attempt < maxRetries) {
        const delay = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
        console.log(`[useSubscription] Attempt ${attempt} failed, waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    console.log("[useSubscription] All refresh attempts failed");
    return false;
  }, [userId, fetchData, refreshAttempts]);

  useEffect(() => {
    if (userId) {
      fetchData(userId);
    }
  }, [userId, fetchData]);

  return {
    isLoading,
    userSubscription,
    canAddMoreUrls,
    generateApiKey,
    refreshSubscription,
    lastRefreshed,
    refreshAttempts
  };
};
