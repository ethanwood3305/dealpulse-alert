
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface SubscriptionCheckoutProps {
  plan: string;
  urlCount?: number;
  includeApiAccess?: boolean;
  buttonVariant?: "default" | "outline";
  className?: string;
}

const SubscriptionCheckout = ({ 
  plan, 
  urlCount,
  includeApiAccess = false,
  buttonVariant = "default", 
  className = "" 
}: SubscriptionCheckoutProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    setIsLoading(true);
    
    try {
      const user = await supabase.auth.getUser();
      
      if (!user.data.user) {
        toast({
          title: "Authentication required",
          description: "Please log in to subscribe to a plan.",
          variant: "destructive",
        });
        return;
      }
      
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { plan, urlCount, includeApiAccess },
      });
      
      if (error) {
        throw error;
      }
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
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
        "Start Free Trial"
      )}
    </Button>
  );
};

export default SubscriptionCheckout;
