
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
      
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { 
          plan, 
          urlCount, 
          includeApiAccess, 
          billingCycle,
          userId 
        },
      });
      
      if (error) {
        console.error("Checkout function error:", error);
        throw error;
      }
      
      if (data?.url) {
        console.log("Redirecting to checkout URL:", data.url);
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
