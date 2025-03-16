
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SubscriptionCardProps {
  plan: string | undefined;
  urls_limit: number | undefined;
  trackedUrlsCount: number;
  onCancelSubscription: () => Promise<void>;
  hasActiveSubscription: boolean;
  onRefreshSubscription?: () => void;
}

const getPlanColor = (plan: string | undefined) => {
  switch (plan) {
    case 'professional':
    case 'business':
    case 'enterprise':
      return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-800';
    case 'basic':
    case 'starter':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  }
};

export const SubscriptionCard = ({ 
  plan, 
  urls_limit, 
  trackedUrlsCount,
  onCancelSubscription,
  hasActiveSubscription,
  onRefreshSubscription
}: SubscriptionCardProps) => {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Your current plan and usage</CardDescription>
        </div>
        {onRefreshSubscription && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onRefreshSubscription} 
            title="Refresh subscription status"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Current Plan</span>
            <Badge 
              variant={plan === 'free' ? 'outline' : 'default'}
              className={`capitalize ${plan !== 'free' ? getPlanColor(plan) : ''}`}
            >
              {plan || 'Free'}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">URLs Usage</span>
              <span className="font-medium">{trackedUrlsCount} / {urls_limit || 1}</span>
            </div>
            <Progress value={(trackedUrlsCount / (urls_limit || 1)) * 100} />
          </div>
          
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Link to="/pricing">
              <Button variant="outline" className="w-full">View Plans</Button>
            </Link>
            
            {hasActiveSubscription ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full text-destructive border-destructive hover:bg-destructive/10">
                    Cancel Plan
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel your subscription? Your plan will remain active until the end of the current billing period.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                    <AlertDialogAction onClick={onCancelSubscription}>
                      Yes, Cancel
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Link to="/pricing">
                <Button variant="outline" className="w-full">
                  Upgrade
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
