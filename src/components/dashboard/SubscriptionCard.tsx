import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface SubscriptionCardProps {
  plan: string | undefined;
  urls_limit: number | undefined;
  trackedUrlsCount: number;
}

const getPlanColor = (plan: string | undefined) => {
  switch (plan) {
    case 'pro':
      return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-800';
    case 'basic':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  }
};

export const SubscriptionCard = ({ plan, urls_limit, trackedUrlsCount }: SubscriptionCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
        <CardDescription>Your current plan and usage</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Current Plan</span>
            <Badge variant={plan === 'pro' ? 'default' : 'outline'} className="capitalize">
              {plan || 'Free'}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">URLs Usage</span>
              <span className="font-medium">{trackedUrlsCount} / {urls_limit}</span>
            </div>
            <Progress value={(trackedUrlsCount / (urls_limit || 1)) * 100} />
          </div>
          
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Link to="/pricing">
              <Button variant="outline" className="w-full">View Plans</Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" className="w-full">Manage</Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
