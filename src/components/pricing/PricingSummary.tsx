
import { Badge } from "@/components/ui/badge";

interface PricingSummaryProps {
  price: number;
  urlCount: number;
  checkFrequency: string;
  includeApiAccess: boolean;
  isApiAccessFree: boolean;
  isFreePlan: boolean;
  billingCycle: 'monthly' | 'yearly';
}

const PricingSummary = ({ 
  price, 
  urlCount, 
  checkFrequency, 
  includeApiAccess, 
  isApiAccessFree, 
  isFreePlan,
  billingCycle 
}: PricingSummaryProps) => {
  return (
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
          <span className="font-medium mr-1">Cars:</span> {urlCount} {urlCount === 1 ? 'Car' : 'Cars'}
        </div>
        <div className="flex items-center">
          <span className="font-medium mr-1">Check Frequency:</span> {checkFrequency}
        </div>
        {(includeApiAccess || isApiAccessFree) && !isFreePlan && (
          <div className="flex items-center">
            <span className="font-medium mr-1">API Access:</span> 
            {isApiAccessFree ? 'Included free' : 'Included'}
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingSummary;
