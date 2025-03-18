import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { UserSubscription } from "@/types/subscription-types";

export async function fetchSubscriptionData(userId: string) {
  try {
    console.log(`[subscription-utils] Fetching subscription data for user: ${userId}`);
    
    const { data: subscriptionData, error: subscriptionError } = await supabase.rpc(
      'get_user_subscription', 
      { user_uuid: userId }
    );
    
    if (subscriptionError) {
      console.error("[subscription-utils] Error fetching subscription:", subscriptionError);
      toast({
        title: "Error",
        description: "Failed to load subscription details. Please try again later.",
        variant: "destructive"
      });
      return { success: false, data: null };
    } else if (subscriptionData && subscriptionData.length > 0) {
      console.log("[subscription-utils] Subscription data received:", subscriptionData[0]);
      
      const subscription: UserSubscription = {
        plan: subscriptionData[0].plan,
        urls_limit: subscriptionData[0].urls_limit,
        has_api_access: subscriptionData[0].has_api_access || false,
        api_key: subscriptionData[0].api_key || null
      };
      
      return { success: true, data: subscription };
    } else {
      console.log("[subscription-utils] No subscription data returned");
      return { success: false, data: null };
    }
  } catch (error) {
    console.error("[subscription-utils] Error in fetchSubscriptionData:", error);
    return { success: false, data: null };
  }
}

export async function checkCanAddMoreUrls(userId: string) {
  try {
    const { data: canAddMoreData, error: canAddMoreError } = await supabase.rpc(
      'can_add_more_urls',
      { user_uuid: userId }
    );
    
    if (canAddMoreError) {
      console.error("[subscription-utils] Error checking if user can add more URLs:", canAddMoreError);
      return false;
    } else {
      console.log("[subscription-utils] Can add more URLs:", canAddMoreData);
      return canAddMoreData;
    }
  } catch (error) {
    console.error("[subscription-utils] Error in checkCanAddMoreUrls:", error);
    return false;
  }
}

export const generateApiKeyForUser = async (userId: string): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const response = await fetch(`${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/generate-api-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate API key');
    }

    const { api_key } = await response.json();
    return api_key;
  } catch (error) {
    console.error('Error generating API key:', error);
    toast({
      title: "API Key Generation Failed",
      description: error instanceof Error ? error.message : "Failed to generate API key. Please try again later.",
      variant: "destructive"
    });
    return null;
  }
};
