
import { Check } from 'lucide-react';

interface PriceFeatureItemProps {
  text: string;
}

const PriceFeatureItem = ({ text }: PriceFeatureItemProps) => {
  return (
    <div className="flex items-start">
      <Check className="h-5 w-5 text-primary shrink-0 mr-2" />
      <span className="text-sm">{text}</span>
    </div>
  );
};

export default PriceFeatureItem;
