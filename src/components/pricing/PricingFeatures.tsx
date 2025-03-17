
import PriceFeatureItem from './PriceFeatureItem';

interface PricingFeaturesProps {
  urlCount: number;
  includeApiAccess: boolean;
  isApiAccessFree: boolean;
  priceHistory: string;
}

const PricingFeatures = ({ 
  urlCount, 
  includeApiAccess, 
  isApiAccessFree,
  priceHistory 
}: PricingFeaturesProps) => {
  return (
    <div className="space-y-3">
      <PriceFeatureItem text="Email alerts" />
      <PriceFeatureItem text={`${urlCount > 20 ? 'Advanced' : 'Basic'} reporting`} />
      <PriceFeatureItem text={priceHistory} />
      
      {urlCount > 5 && (
        <PriceFeatureItem text="Competitor vehicles comparison" />
      )}
      
      {(urlCount > 20 || includeApiAccess || isApiAccessFree) && (
        <PriceFeatureItem text="API access" />
      )}
      
      {urlCount > 50 && (
        <PriceFeatureItem text="Priority support" />
      )}
    </div>
  );
};

export default PricingFeatures;
