
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import SubscriptionCheckout from './SubscriptionCheckout';
import PricingSlider from './pricing/PricingSlider';
import ApiAccessOption from './pricing/ApiAccessOption';
import PricingSummary from './pricing/PricingSummary';
import PricingFeatures from './pricing/PricingFeatures';
import { calculatePrice, getCheckFrequency, getPriceHistory, getPlanId } from './pricing/PricingUtils';

interface CustomPricingCardProps {
  billingCycle: 'monthly' | 'yearly';
}

const CustomPricingCard = ({ billingCycle }: CustomPricingCardProps) => {
  const [urlCount, setUrlCount] = useState(10);
  const [isVisible, setIsVisible] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [includeApiAccess, setIncludeApiAccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const isApiAccessFree = urlCount > 125;
  const isFreePlan = urlCount <= 1;
  
  const price = calculatePrice(urlCount, includeApiAccess, billingCycle);
  const checkFrequency = getCheckFrequency(urlCount);
  const priceHistory = getPriceHistory(urlCount);
  const planId = getPlanId(urlCount);

  useEffect(() => {
    if (isApiAccessFree) {
      setIncludeApiAccess(true);
    }
  }, [isApiAccessFree]);

  return (
    <Card className={`relative overflow-hidden transition-all duration-700 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
    } ring-2 ring-primary shadow-lg max-w-xl mx-auto`}>
      <CardContent className="p-6">
        <h3 className="text-xl font-bold mb-2">Custom Plan</h3>
        <p className="text-muted-foreground mb-6">
          Choose exactly how many URLs you want to monitor
        </p>
        
        <PricingSlider urlCount={urlCount} setUrlCount={setUrlCount} />
        
        <ApiAccessOption 
          includeApiAccess={includeApiAccess}
          setIncludeApiAccess={setIncludeApiAccess}
          isApiAccessFree={isApiAccessFree}
          isFreePlan={isFreePlan}
          billingCycle={billingCycle}
        />
        
        <PricingSummary 
          price={price}
          urlCount={urlCount}
          checkFrequency={checkFrequency}
          includeApiAccess={includeApiAccess}
          isApiAccessFree={isApiAccessFree}
          isFreePlan={isFreePlan}
          billingCycle={billingCycle}
        />
        
        {isFreePlan ? (
          <Button 
            variant="default" 
            className="w-full rounded-full mb-6"
            onClick={() => navigate('/signup')}
          >
            Start Free Trial
          </Button>
        ) : (
          <SubscriptionCheckout 
            plan={planId}
            urlCount={urlCount}
            includeApiAccess={includeApiAccess || isApiAccessFree}
            billingCycle={billingCycle}
            buttonVariant="default"
            className="w-full rounded-full mb-6"
            buttonText={urlCount > 1 ? "Subscribe Now" : "Start Free Trial"}
          />
        )}
        
        <PricingFeatures 
          urlCount={urlCount}
          includeApiAccess={includeApiAccess}
          isApiAccessFree={isApiAccessFree}
          priceHistory={priceHistory}
        />
      </CardContent>
    </Card>
  );
};

export default CustomPricingCard;
