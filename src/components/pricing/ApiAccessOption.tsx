
import { Check } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";

interface ApiAccessOptionProps {
  includeApiAccess: boolean;
  setIncludeApiAccess: (checked: boolean) => void;
  isApiAccessFree: boolean;
  isFreePlan: boolean;
  billingCycle: 'monthly' | 'yearly';
}

const ApiAccessOption = ({ 
  includeApiAccess, 
  setIncludeApiAccess, 
  isApiAccessFree, 
  isFreePlan,
  billingCycle
}: ApiAccessOptionProps) => {
  if (isFreePlan) {
    return null;
  }

  if (isApiAccessFree) {
    return (
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-green-600">
          <Check className="h-4 w-4" />
          <span className="text-sm font-medium">API access included free</span>
        </div>
      </div>
    );
  }

  return (
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
  );
};

export default ApiAccessOption;
