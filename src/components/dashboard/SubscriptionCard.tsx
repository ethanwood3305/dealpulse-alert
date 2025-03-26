
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, CheckCircle, RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";

interface SubscriptionCardProps {
  plan: string | undefined;
  urls_limit: number | undefined;
  trackedUrlsCount: number;
  onRefreshSubscription: () => void;
}

export const SubscriptionCard = ({ 
  plan = 'standard', 
  urls_limit = 10, 
  trackedUrlsCount,
  onRefreshSubscription
}: SubscriptionCardProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  let planLabel = 'Standard Plan';
  let planDescription = 'Basic tracking features';
  let planFeatures = [`Limited to ${urls_limit} vehicles`, 'Daily price checks', 'Basic notifications'];

  if (plan === 'professional') {
    planLabel = 'Professional Plan';
    planDescription = 'Advanced tracking features';
    planFeatures = [
      `Up to ${urls_limit} vehicles`, 
      'Hourly price checks', 
      'Advanced notifications',
      'API access',
      'Historical data'
    ];
  } else if (plan === 'enterprise') {
    planLabel = 'Enterprise Plan';
    planDescription = 'Enterprise-grade tracking';
    planFeatures = [
      `Up to ${urls_limit} vehicles`, 
      'Real-time price monitoring', 
      'Advanced analytics',
      'API access',
      'Priority support',
      'Custom integrations'
    ];
  }

  const handleRefreshSubscription = () => {
    setIsRefreshing(true);
    onRefreshSubscription();
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{planLabel}</CardTitle>
            <CardDescription>{planDescription}</CardDescription>
          </div>
          <div className="bg-primary/10 p-2 rounded-full">
            <Car className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {planFeatures.map((feature, index) => (
            <div key={index} className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-muted rounded-md">
          <div className="flex items-center justify-between text-sm">
            <span>Current amount of vehicles</span>
            <span className="font-medium">{trackedUrlsCount}</span>
          </div>
          <div className="mt-2 h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full"
              style={{ width: `${Math.min(100, (trackedUrlsCount / (urls_limit || 1)) * 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="ghost" size="sm" className="w-full" onClick={handleRefreshSubscription}>
          {isRefreshing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Subscription Status
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
