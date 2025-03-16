
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface UserSubscription {
  plan: string;
  urls_limit: number;
}

export const useSubscription = (userId: string | undefined) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [canAddMoreUrls, setCanAddMoreUrls] = useState(false);
  
  const fetchSubscriptionData = async (userId: string) => {
    try {
      const { data: subscriptionData, error: subscriptionError } = await supabase.rpc(
        'get_user_subscription', 
        { user_uuid: userId }
      );
      
      if (subscriptionError) {
        toast({
          title: "Error",
          description: "Failed to load subscription details. Please try again later.",
          variant: "destructive"
        });
      } else if (subscriptionData && subscriptionData.length > 0) {
        setUserSubscription({
          plan: subscriptionData[0].plan,
          urls_limit: subscriptionData[0].urls_limit
        });
      }

      const { data: canAddMoreData, error: canAddMoreError } = await supabase.rpc(
        'can_add_more_urls',
        { user_uuid: userId }
      );
      
      if (!canAddMoreError) {
        setCanAddMoreUrls(canAddMoreData);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching subscription data:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchSubscriptionData(userId);
    }
  }, [userId]);

  return {
    isLoading,
    userSubscription,
    canAddMoreUrls,
    refreshSubscription: () => userId && fetchSubscriptionData(userId)
  };
};
