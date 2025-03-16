
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Check } from 'lucide-react';
import SubscriptionCheckout from './SubscriptionCheckout';
import { Checkbox } from "@/components/ui/checkbox";

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

  // Calculate price based on number of URLs
  const calculatePrice = (urls: number): number => {
    if (urls <= 1) return 0; // Free for 1 URL
    
    let basePrice;
    
    // Progressive pricing tiers
    if (urls <= 5) {
      basePrice = 5 + (urls - 2) * 1.25; // $5 for 2 URLs, then +$1.25 per URL
    } else if (urls <= 20) {
      basePrice = 8.75 + (urls - 5) * 0.9; // After 5 URLs, slower increase per URL
    } else if (urls <= 50) {
      basePrice = 22.25 + (urls - 20) * 0.75; // After 20 URLs, even slower increase
    } else if (urls <= 100) {
      basePrice = 44.75 + (urls - 50) * 0.6; // After 50 URLs, further discount
    } else {
      basePrice = 74.75 + (urls - 100) * 0.5; // After 100 URLs, lowest per-URL price
    }
    
    // Add API access cost if selected
    if (includeApiAccess && urls > 1) {
      basePrice += 6; // $6/month for API access
    }
    
    // Apply annual pricing - show full year price
    if (billingCycle === 'yearly') {
      basePrice = basePrice * 12 * 0.9; // 10% discount for annual billing, calculated on the full year
    }
    
    return parseFloat(basePrice.toFixed(2));
  };

  // Calculate check frequency based on URL count
  const getCheckFrequency = (urls: number): string => {
    if (urls <= 5) return 'Daily checks';
    if (urls <= 20) return '12-hour checks';
    if (urls <= 50) return '6-hour checks';
    return 'Hourly checks';
  };

  // Determine plan ID based on URL count for backend
  const getPlanId = (urls: number): string => {
    if (urls <= 1) return 'free';
    if (urls <= 5) return 'starter';
    if (urls <= 20) return 'basic';
    if (urls <= 50) return 'professional';
    if (urls <= 100) return 'business';
    return 'enterprise';
  };

  const price = calculatePrice(urlCount);
  const checkFrequency = getCheckFrequency(urlCount);
  const planId = getPlanId(urlCount);
  const isFreePlan = urlCount <= 1;

  return (
    <Card className={`relative overflow-hidden transition-all duration-700 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
    } ring-2 ring-primary shadow-lg max-w-xl mx-auto`}>
      <CardContent className="p-6">
        <h3 className="text-xl font-bold mb-2">Custom Plan</h3>
        <p className="text-muted-foreground mb-6">
          Choose exactly how many URLs you want to monitor
        </p>
        
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="font-medium">URLs to monitor</span>
            <span className="font-bold">{urlCount} {urlCount === 1 ? 'URL' : 'URLs'}</span>
          </div>
          <Slider
            value={[urlCount]}
            min={1}
            max={250}
            step={1}
            onValueChange={([value]) => setUrlCount(value)}
            className="mb-6"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1</span>
            <span>50</span>
            <span>100</span>
            <span>150</span>
            <span>200</span>
            <span>250</span>
          </div>
        </div>
        
        {!isFreePlan && (
          <div className="mb-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="api-access"
                checked={includeApiAccess}
                onCheckedChange={(checked) => setIncludeApiAccess(checked === true)}
              />
              <label 
                htmlFor="api-access" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Add API access (+${billingCycle === 'monthly' ? '6' : '64.80'}/
                {billingCycle === 'monthly' ? 'month' : 'year'})
              </label>
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <div className="text-center mb-6">
            <span className="text-3xl font-bold">${price}</span>
            <span className="text-muted-foreground">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
            {billingCycle === 'yearly' && (
              <Badge variant="outline" className="ml-2 bg-green-50 text-green-600 border-green-200">
                Save 10%
              </Badge>
            )}
          </div>
          
          <div className="mb-6 space-y-2">
            <div className="flex items-center">
              <span className="font-medium mr-1">URLs:</span> {urlCount} {urlCount === 1 ? 'URL' : 'URLs'}
            </div>
            <div className="flex items-center">
              <span className="font-medium mr-1">Check Frequency:</span> {checkFrequency}
            </div>
            {includeApiAccess && !isFreePlan && (
              <div className="flex items-center">
                <span className="font-medium mr-1">API Access:</span> Included
              </div>
            )}
          </div>
          
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
              includeApiAccess={includeApiAccess}
              buttonVariant="default"
              className="w-full rounded-full mb-6"
            />
          )}
        </div>
        
        <div className="space-y-3">
          <div className="flex items-start">
            <Check className="h-5 w-5 text-primary shrink-0 mr-2" />
            <span className="text-sm">Email alerts</span>
          </div>
          <div className="flex items-start">
            <Check className="h-5 w-5 text-primary shrink-0 mr-2" />
            <span className="text-sm">{urlCount > 20 ? 'Advanced' : 'Basic'} reporting</span>
          </div>
          <div className="flex items-start">
            <Check className="h-5 w-5 text-primary shrink-0 mr-2" />
            <span className="text-sm">
              {urlCount <= 5 ? '7-day' : urlCount <= 20 ? '30-day' : urlCount <= 100 ? '90-day' : '1-year'} price history
            </span>
          </div>
          {urlCount > 5 && (
            <div className="flex items-start">
              <Check className="h-5 w-5 text-primary shrink-0 mr-2" />
              <span className="text-sm">Competitor tagging</span>
            </div>
          )}
          {(urlCount > 20 || includeApiAccess) && (
            <div className="flex items-start">
              <Check className="h-5 w-5 text-primary shrink-0 mr-2" />
              <span className="text-sm">API access</span>
            </div>
          )}
          {urlCount > 50 && (
            <div className="flex items-start">
              <Check className="h-5 w-5 text-primary shrink-0 mr-2" />
              <span className="text-sm">Priority support</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomPricingCard;
