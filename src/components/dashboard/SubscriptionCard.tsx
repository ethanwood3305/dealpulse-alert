
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Car, CheckCircle, XCircle, CreditCard, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

interface SubscriptionCardProps {
  plan: string | undefined;
  urls_limit: number | undefined;
  trackedUrlsCount: number;
  onCancelSubscription: () => Promise<void>;
  hasActiveSubscription: boolean;
  onRefreshSubscription: () => void;
}

export const SubscriptionCard = ({ 
  plan = 'free', 
  urls_limit = 1, 
  trackedUrlsCount,
  onCancelSubscription,
  hasActiveSubscription,
  onRefreshSubscription
}: SubscriptionCardProps) => {
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  let planLabel = 'Free Plan';
  let planDescription = 'Basic tracking features';
  let planFeatures = ['Limited to 1 car', 'Daily price checks', 'Basic notifications'];

  if (plan === 'pro') {
    planLabel = 'Pro Plan';
    planDescription = 'Advanced tracking features';
    planFeatures = [
      `Up to ${urls_limit} cars`, 
      'Hourly price checks', 
      'Advanced notifications',
      'API access',
      'Historical data'
    ];
  } else if (plan === 'business') {
    planLabel = 'Business Plan';
    planDescription = 'Enterprise-grade tracking';
    planFeatures = [
      `Up to ${urls_limit} cars`, 
      'Real-time price monitoring', 
      'Advanced analytics',
      'API access',
      'Priority support',
      'Custom integrations'
    ];
  }

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    await onCancelSubscription();
    setIsCancelling(false);
  };

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
            <span>Cars used</span>
            <span className="font-medium">{trackedUrlsCount} / {urls_limit}</span>
          </div>
          <div className="mt-2 h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full"
              style={{ width: `${Math.min(100, (trackedUrlsCount / (urls_limit || 1)) * 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        {plan === 'free' ? (
          <Button className="w-full" asChild>
            <Link to="/pricing">
              Upgrade to Pro
            </Link>
          </Button>
        ) : hasActiveSubscription ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full">
                {isCancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Subscription
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will cancel your subscription. You'll still have access to your current plan until the end of your billing period.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancelSubscription}>
                  Yes, Cancel
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button className="w-full" asChild>
            <Link to="/pricing">
              <CreditCard className="h-4 w-4 mr-2" />
              Reactivate Subscription
            </Link>
          </Button>
        )}
        
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
