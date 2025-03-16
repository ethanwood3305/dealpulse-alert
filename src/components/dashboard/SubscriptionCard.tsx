
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
        <CardTitle>Current Plan</CardTitle>
        <CardDescription>Your subscription details</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Plan:</span>
            <Badge className={`capitalize ${getPlanColor(plan || 'free')}`}>
              {plan || 'Free'}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">URL Monitoring Limit:</span>
            <span>{urls_limit || 1}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">URLs Used:</span>
            <span>{trackedUrlsCount} / {urls_limit || 1}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
