
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Check, X, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Toggle, toggleVariants } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

interface PlanProps {
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  description: string;
  features: string[];
  featureExplanations?: { [key: string]: string };
  popular?: boolean;
  delay: string;
  billingCycle: 'monthly' | 'yearly';
}

const PricingPlan = ({ 
  name, 
  monthlyPrice, 
  yearlyPrice, 
  description, 
  features, 
  featureExplanations,
  popular, 
  delay,
  billingCycle
}: PlanProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const price = billingCycle === 'monthly' ? monthlyPrice : yearlyPrice;

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
          {price !== 'Custom' && (
            <span className="text-muted-foreground">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
          )}
          {billingCycle === 'yearly' && price !== 'Custom' && (
            <Badge variant="outline" className="ml-2 bg-green-50 text-green-600 border-green-200">
              Save 20%
            </Badge>
          )}
        </div>
        <Link to="/signup">
          <Button 
            variant={popular ? "default" : "outline"} 
            className="w-full rounded-full mb-6"
          >
            {price === 'Custom' ? 'Contact Sales' : 'Start Free Trial'}
          </Button>
        </Link>
        <div className="space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start group relative">
              <Check className="h-5 w-5 text-primary shrink-0 mr-2" />
              <span className="text-sm">{feature}</span>
              {featureExplanations && featureExplanations[feature] && (
                <div className="ml-1 inline-flex">
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-popover rounded-md shadow-md text-xs hidden group-hover:block z-10">
                    {featureExplanations[feature]}
                  </div>
                </div>
              )}
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
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [activeTab, setActiveTab] = useState<'cards' | 'table'>('cards');

  const featureExplanations = {
    "Monitor up to 10 competitor URLs": "Track prices of up to 10 unique URLs from your competitors' websites.",
    "Daily price checks": "Our system will check for price changes once per day.",
    "Hourly price checks": "Get more frequent updates with hourly price change monitoring.",
    "Real-time price checks": "Receive immediate updates whenever a competitor changes their prices.",
    "API access": "Integrate our price data directly into your own systems.",
    "White-label options": "Rebrand our reports and dashboards with your company's logo and colors."
  };

  const plans = [
    {
      name: "Starter",
      monthlyPrice: "$49",
      yearlyPrice: "$39",
      description: "Perfect for small businesses just getting started.",
      features: [
        "Monitor up to 10 competitor URLs",
        "Daily price checks",
        "Email alerts",
        "Basic reporting",
        "7-day price history"
      ],
      featureExplanations,
      delay: "delay-100"
    },
    {
      name: "Professional",
      monthlyPrice: "$99",
      yearlyPrice: "$79",
      description: "Ideal for growing businesses that need more capabilities.",
      features: [
        "Monitor up to 50 competitor URLs",
        "Hourly price checks",
        "Email and SMS alerts",
        "Advanced reporting & analytics",
        "30-day price history",
        "API access"
      ],
      featureExplanations,
      popular: true,
      delay: "delay-200"
    },
    {
      name: "Enterprise",
      monthlyPrice: "Custom",
      yearlyPrice: "Custom",
      description: "Tailored solutions for large dealerships and groups.",
      features: [
        "Unlimited competitor monitoring",
        "Real-time price checks",
        "Priority alerts via email, SMS, and API",
        "Custom reports and dashboards",
        "Unlimited price history",
        "Dedicated account manager",
        "White-label options"
      ],
      featureExplanations,
      delay: "delay-300"
    }
  ];

  // All possible features for comparison table
  const allFeatures = [
    "Competitor URLs",
    "Price check frequency",
    "Alert methods",
    "Reporting capabilities",
    "Price history",
    "API access",
    "Account management",
    "White-labeling"
  ];

  const planDetails = {
    "Starter": {
      "Competitor URLs": "Up to 10",
      "Price check frequency": "Daily",
      "Alert methods": "Email only",
      "Reporting capabilities": "Basic",
      "Price history": "7 days",
      "API access": <X className="mx-auto text-red-500" />,
      "Account management": "Self-service",
      "White-labeling": <X className="mx-auto text-red-500" />
    },
    "Professional": {
      "Competitor URLs": "Up to 50",
      "Price check frequency": "Hourly",
      "Alert methods": "Email and SMS",
      "Reporting capabilities": "Advanced",
      "Price history": "30 days",
      "API access": <Check className="mx-auto text-primary" />,
      "Account management": "Self-service",
      "White-labeling": <X className="mx-auto text-red-500" />
    },
    "Enterprise": {
      "Competitor URLs": "Unlimited",
      "Price check frequency": "Real-time",
      "Alert methods": "Email, SMS, and API",
      "Reporting capabilities": "Custom",
      "Price history": "Unlimited",
      "API access": <Check className="mx-auto text-primary" />,
      "Account management": "Dedicated manager",
      "White-labeling": <Check className="mx-auto text-primary" />
    }
  };

  // FAQs
  const faqs = [
    {
      question: "How does the 14-day free trial work?",
      answer: "When you sign up for any paid plan, you'll get full access to all features of that plan for 14 days without being charged. If you decide to continue using DealPulse Alert, we'll start billing you according to your chosen plan at the end of the trial period. You can cancel anytime during the trial with no obligation."
    },
    {
      question: "Can I change plans later?",
      answer: "Yes! You can upgrade, downgrade, or cancel your plan at any time. When upgrading, the new features will be immediately available. When downgrading, the changes will take effect at the start of your next billing cycle."
    },
    {
      question: "What happens when I reach my URL monitoring limit?",
      answer: "When you reach your URL monitoring limit, you'll need to either remove some URLs from your monitoring list or upgrade to a higher tier plan to add more. We'll notify you when you're approaching your limit so you can make an informed decision."
    },
    {
      question: "How accurate is the price monitoring?",
      answer: "Our system is designed to be highly accurate, with over 99% detection rate for price changes. However, some website structures can occasionally present challenges. If you encounter any issues with specific competitor websites, our support team is available to help optimize the monitoring for those sites."
    },
    {
      question: "Do you offer discounts for annual billing?",
      answer: "Yes, we offer a 20% discount when you choose annual billing compared to monthly billing. This discount is automatically applied when you select the annual billing option."
    }
  ];

  const testimonials = [
    {
      quote: "DealPulse Alert has been a game changer for our dealership. We've increased our competitive edge and boosted sales by 23% in just three months.",
      author: "Sarah Johnson",
      position: "Sales Manager, Riverside Motors"
    },
    {
      quote: "The real-time alerts have saved us countless hours of manual price checking. Now we can react instantly to market changes.",
      author: "Michael Chen",
      position: "Owner, Premier Auto Group"
    }
  ];

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
          className={`text-center max-w-3xl mx-auto mb-8 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Choose the plan that best fits your business needs. All plans include a 14-day free trial.
          </p>
          
          {/* Billing toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm ${billingCycle === 'monthly' ? 'font-medium' : 'text-muted-foreground'}`}>
              Monthly billing
            </span>
            <Switch 
              checked={billingCycle === 'yearly'}
              onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
            />
            <div className="flex items-center">
              <span className={`text-sm ${billingCycle === 'yearly' ? 'font-medium' : 'text-muted-foreground'}`}>
                Annual billing
              </span>
              <Badge className="ml-2 bg-green-50 text-green-600 border-green-200">Save 20%</Badge>
            </div>
          </div>

          {/* View toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 bg-muted rounded-lg">
              <Toggle
                pressed={activeTab === 'cards'}
                onPressedChange={() => setActiveTab('cards')}
                className={cn(
                  "rounded-md px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                )}
              >
                Plans
              </Toggle>
              <Toggle
                pressed={activeTab === 'table'}
                onPressedChange={() => setActiveTab('table')}
                className={cn(
                  "rounded-md px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                )}
              >
                Compare
              </Toggle>
            </div>
          </div>
        </div>

        {activeTab === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            {plans.map((plan) => (
              <PricingPlan
                key={plan.name}
                name={plan.name}
                monthlyPrice={plan.monthlyPrice}
                yearlyPrice={plan.yearlyPrice}
                description={plan.description}
                features={plan.features}
                featureExplanations={plan.featureExplanations}
                popular={plan.popular}
                delay={plan.delay}
                billingCycle={billingCycle}
              />
            ))}
          </div>
        ) : (
          <div className="max-w-5xl mx-auto mb-16 overflow-x-auto">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Feature</TableHead>
                      <TableHead className="text-center">Starter</TableHead>
                      <TableHead className="text-center">Professional</TableHead>
                      <TableHead className="text-center">Enterprise</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allFeatures.map((feature) => (
                      <TableRow key={feature}>
                        <TableCell className="font-medium">{feature}</TableCell>
                        <TableCell className="text-center">
                          {planDetails["Starter"][feature]}
                        </TableCell>
                        <TableCell className="text-center">
                          {planDetails["Professional"][feature]}
                        </TableCell>
                        <TableCell className="text-center">
                          {planDetails["Enterprise"][feature]}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell className="font-medium">Price</TableCell>
                      <TableCell className="text-center">
                        {billingCycle === 'monthly' ? '$49/month' : '$39/month'}
                        {billingCycle === 'yearly' && (
                          <div className="text-xs text-green-600">Billed annually</div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {billingCycle === 'monthly' ? '$99/month' : '$79/month'}
                        {billingCycle === 'yearly' && (
                          <div className="text-xs text-green-600">Billed annually</div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">Custom pricing</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Testimonials */}
        <div className="max-w-5xl mx-auto mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">What our customers say</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="glass">
                <CardContent className="p-6">
                  <div className="mb-4 text-xl italic">"{testimonial.quote}"</div>
                  <div className="text-right">
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.position}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h3>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
