
import { useEffect, useState } from 'react';
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
  
  const fetchSubscriptionData = async (userId: string) => {
    try {
      console.log("Fetching subscription data for user:", userId);
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
      } else if (subscriptionData && subscriptionData.length > 0) {
        console.log("Subscription data received:", subscriptionData[0]);
        setUserSubscription({
          plan: subscriptionData[0].plan,
          urls_limit: subscriptionData[0].urls_limit,
          stripe_subscription_id: subscriptionData[0].stripe_subscription_id,
          has_api_access: subscriptionData[0].has_api_access || false,
          api_key: subscriptionData[0].api_key || null
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

  useEffect(() => {
    if (userId) {
      fetchSubscriptionData(userId);
    }
  }, [userId]);

  return {
    isLoading,
    userSubscription,
    canAddMoreUrls,
    cancelSubscription,
    generateApiKey,
    refreshSubscription: () => userId && fetchSubscriptionData(userId)
  };
};
