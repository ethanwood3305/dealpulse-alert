
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface SubscriptionCheckoutProps {
  plan: string;
  urlCount?: number;
  includeApiAccess?: boolean;
  billingCycle?: 'monthly' | 'yearly';
  buttonVariant?: "default" | "outline";
  className?: string;
  buttonText?: string;
}

const SubscriptionCheckout = ({ 
  plan, 
  urlCount,
  includeApiAccess = false,
  billingCycle = 'monthly',
  buttonVariant = "default", 
  className = "",
  buttonText
}: SubscriptionCheckoutProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    setIsLoading(true);
    
    try {
      console.log("Starting checkout process...");
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        toast({
          title: "Authentication required",
          description: "Please log in to subscribe to a plan.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      const userId = userData.user.id;
      
      if (!userId) {
        toast({
          title: "Authentication error",
          description: "Unable to identify your account. Please try logging in again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      console.log("Starting checkout for:", { plan, urlCount, includeApiAccess, billingCycle, userId });
      
      // Get the current subscription to check if user already has one
      const { data: currentSub } = await supabase.rpc('get_user_subscription', {
        user_uuid: userId
      });
      
      console.log("Current subscription:", currentSub);
      
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { 
          plan, 
          urlCount, 
          includeApiAccess, 
          billingCycle,
          userId,
          // Include current subscription ID if available for upgrades
          currentSubscriptionId: currentSub && currentSub.length > 0 ? currentSub[0].stripe_subscription_id : null
        },
      });
      
      if (error) {
        console.error("Checkout function error:", error);
        throw error;
      }
      
      if (data?.url) {
        console.log("Checkout success! Redirecting to checkout URL:", data.url);
        
        // Record checkout initiation time in sessionStorage to help with post-checkout checks
        sessionStorage.setItem('checkoutInitiated', Date.now().toString());
        sessionStorage.setItem('expectedUrlCount', urlCount?.toString() || '1');
        sessionStorage.setItem('expectedPlan', plan);
        
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned:", data);
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout failed",
        description: error.message || "There was an error creating your checkout session.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Determine the button text based on the plan
  const getButtonText = () => {
    if (buttonText) {
      return buttonText;
    }
    
    if (plan === 'free') {
      return "Start Free Trial";
    }
    
    return "Subscribe Now";
  };

  return (
    <Button 
      variant={buttonVariant} 
      className={className}
      onClick={handleCheckout}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        getButtonText()
      )}
    </Button>
  );
};

export default SubscriptionCheckout;
