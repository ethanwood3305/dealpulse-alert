
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Check } from 'lucide-react';

interface PlanProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
  delay: string;
}

const PricingPlan = ({ name, price, description, features, popular, delay }: PlanProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={ref}
      className={`relative glass rounded-xl overflow-hidden transition-all duration-700 ${delay} ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      } ${popular ? 'ring-2 ring-primary shadow-lg' : ''}`}
    >
      {popular && (
        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-bl-lg">
          Most Popular
        </div>
      )}
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{name}</h3>
        <p className="text-muted-foreground mb-4">{description}</p>
        <div className="mb-6">
          <span className="text-3xl font-bold">{price}</span>
          {price !== 'Custom' && <span className="text-muted-foreground">/month</span>}
        </div>
        <Link to="/signup">
          <Button 
            variant={popular ? "default" : "outline"} 
            className="w-full rounded-full mb-6"
          >
            Get started
          </Button>
        </Link>
        <div className="space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start">
              <Check className="h-5 w-5 text-primary shrink-0 mr-2" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Pricing = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="py-20 relative" id="pricing">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute bottom-1/3 right-0 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <div 
          ref={ref}
          className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
          <p className="text-muted-foreground text-lg">
            Choose the plan that best fits your business needs. All plans include a 14-day free trial.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <PricingPlan
            name="Starter"
            price="$49"
            description="Perfect for small businesses just getting started."
            features={[
              "Monitor up to 10 competitor URLs",
              "Daily price checks",
              "Email alerts",
              "Basic reporting",
              "7-day price history"
            ]}
            delay="delay-100"
          />
          
          <PricingPlan
            name="Professional"
            price="$99"
            description="Ideal for growing businesses that need more capabilities."
            features={[
              "Monitor up to 50 competitor URLs",
              "Hourly price checks",
              "Email and SMS alerts",
              "Advanced reporting & analytics",
              "30-day price history",
              "API access"
            ]}
            popular
            delay="delay-200"
          />
          
          <PricingPlan
            name="Enterprise"
            price="Custom"
            description="Tailored solutions for large dealerships and groups."
            features={[
              "Unlimited competitor monitoring",
              "Real-time price checks",
              "Priority alerts via email, SMS, and API",
              "Custom reports and dashboards",
              "Unlimited price history",
              "Dedicated account manager",
              "White-label options"
            ]}
            delay="delay-300"
          />
        </div>
      </div>
    </div>
  );
};

export default Pricing;
