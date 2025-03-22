
import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  fetchSubscriptionData, 
  checkCanAddMoreUrls,
  generateApiKeyForUser,
  updateDealerPostcode
} from "@/utils/subscription-utils";
import type { UserSubscription } from "@/types/subscription-types";

export type { UserSubscription };

export const useSubscription = (userId: string | undefined) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [canAddMoreUrls, setCanAddMoreUrls] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [refreshAttempts, setRefreshAttempts] = useState(0);
  
  // Add a fetchInProgress ref to prevent multiple concurrent fetches
  const fetchInProgress = useRef(false);
  
  const fetchData = useCallback(async (userId: string) => {
    // Skip if a fetch is already in progress
    if (fetchInProgress.current) return false;
    
    try {
      fetchInProgress.current = true;
      setIsLoading(true);
      
      const { success, data } = await fetchSubscriptionData(userId);
      
      if (success && data) {
        // Compare with current subscription to see if there's a change
        const hasChanged = JSON.stringify(data) !== JSON.stringify(userSubscription);
        
        if (hasChanged) {
          setUserSubscription(data);
        }
      }

      const canAddMore = await checkCanAddMoreUrls(userId);
      setCanAddMoreUrls(canAddMore);
      
      setIsLoading(false);
      setLastRefreshed(new Date());
      fetchInProgress.current = false;
      return true;
    } catch (error) {
      console.error("[useSubscription] Error fetching subscription data:", error);
      setIsLoading(false);
      fetchInProgress.current = false;
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

  const setDealerPostcode = async (postcode: string): Promise<boolean> => {
    if (!userId) return false;
    const success = await updateDealerPostcode(userId, postcode);
    if (success) {
      setUserSubscription(prev => prev ? {...prev, dealer_postcode: postcode} : null);
      return true;
    }
    return false;
  };

  const refreshSubscription = useCallback(async (maxRetries = 3) => {
    if (!userId) return false;
    
    setRefreshAttempts(prev => prev + 1);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const success = await fetchData(userId);
      
      if (success) {
        return true;
      }
      
      if (attempt < maxRetries) {
        const delay = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return false;
  }, [userId, fetchData, refreshAttempts]);

  useEffect(() => {
    if (userId && !fetchInProgress.current) {
      fetchData(userId);
    }
    
    // Only fetch data once on mount and userId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return {
    isLoading,
    userSubscription,
    canAddMoreUrls,
    generateApiKey,
    setDealerPostcode,
    refreshSubscription,
    lastRefreshed,
    refreshAttempts
  };
};
