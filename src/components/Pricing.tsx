
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Toggle } from "@/components/ui/toggle";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import CustomPricingCard from "./CustomPricingCard";
import EnterpriseContact from "./EnterpriseContact";

const Pricing = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [activeTab, setActiveTab] = useState<'pricing' | 'enterprise'>('pricing');
  const location = useLocation();

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

  useEffect(() => {
    // Check for checkout status in the URL
    const searchParams = new URLSearchParams(location.search);
    const checkoutStatus = searchParams.get('checkout');
    
    if (checkoutStatus === 'success') {
      toast({
        title: "Subscription successful!",
        description: "Thank you for subscribing to DealPulse Alert. Your subscription is now active.",
      });
    } else if (checkoutStatus === 'cancelled') {
      toast({
        title: "Subscription cancelled",
        description: "You have cancelled the checkout process. No changes were made to your subscription.",
      });
    }
  }, [location.search]);

  // FAQs
  const faqs = [
    {
      question: "How does the pricing work?",
      answer: "Our pricing is based on the number of URLs you want to monitor. The more URLs you track, the lower the per-URL cost becomes. You can use our slider to select exactly how many URLs you need, and see the price adjust in real-time."
    },
    {
      question: "How does the 14-day free trial work?",
      answer: "When you sign up for any paid plan, you'll get full access to all features of that plan for 14 days without being charged. If you decide to continue using DealPulse Alert, we'll start billing you according to your chosen plan at the end of the trial period. You can cancel anytime during the trial with no obligation."
    },
    {
      question: "Can I change my plan later?",
      answer: "Yes! You can upgrade, downgrade, or adjust the number of URLs you're tracking at any time. When upgrading or adding more URLs, the new features will be immediately available. When downgrading, the changes will take effect at the start of your next billing cycle."
    },
    {
      question: "What happens when I reach my URL monitoring limit?",
      answer: "When you reach your URL monitoring limit, you'll need to either remove some URLs from your monitoring list or upgrade to add more URLs. We'll notify you when you're approaching your limit so you can make an informed decision."
    },
    {
      question: "How accurate is the price monitoring?",
      answer: "Our system is designed to be highly accurate, with over 99% detection rate for price changes. However, some website structures can occasionally present challenges. If you encounter any issues with specific competitor websites, our support team is available to help optimize the monitoring for those sites."
    },
    {
      question: "Do you offer discounts for annual billing?",
      answer: "Yes, we offer a 10% discount when you choose annual billing compared to monthly billing. This discount is automatically applied when you select the annual billing option."
    },
    {
      question: "What if I need to track more than 250 URLs?",
      answer: "For customers needing to track more than 250 URLs, we offer custom enterprise plans. Please contact our sales team through the Enterprise tab, and we'll create a tailored solution for your business needs."
    }
  ];

  return (
    <div className="py-20 relative" id="pricing">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute bottom-1/3 right-0 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 dark:opacity-10"></div>
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 dark:opacity-10"></div>
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
            Choose exactly how many URLs you want to monitor. All plans include a 14-day free trial.
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
              <Badge className="ml-2 bg-green-50 text-green-600 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800">Save 10%</Badge>
            </div>
          </div>

          {/* View toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 bg-muted rounded-lg">
              <Toggle
                pressed={activeTab === 'pricing'}
                onPressedChange={() => setActiveTab('pricing')}
                className={cn(
                  "rounded-md px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                )}
              >
                Pricing
              </Toggle>
              <Toggle
                pressed={activeTab === 'enterprise'}
                onPressedChange={() => setActiveTab('enterprise')}
                className={cn(
                  "rounded-md px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                )}
              >
                Enterprise
              </Toggle>
            </div>
          </div>
        </div>

        {activeTab === 'pricing' ? (
          <div className="max-w-4xl mx-auto mb-16">
            <CustomPricingCard billingCycle={billingCycle} />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto mb-16">
            <EnterpriseContact />
          </div>
        )}

        {/* Beta Users Section */}
        <div className="max-w-3xl mx-auto mb-16 bg-muted/50 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Join Our Beta Program</h3>
          <p className="text-muted-foreground mb-6">
            Help shape the future of DealPulse Alert by joining our beta program. Get early access to new features and provide valuable feedback.
          </p>
          <Link to="/signup">
            <Button size="lg" className="rounded-full">
              Apply for Beta Access
            </Button>
          </Link>
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
