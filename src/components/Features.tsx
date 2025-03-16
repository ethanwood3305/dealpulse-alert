
import { useEffect, useRef, useState } from 'react';
import { Settings, Bell, LineChart, Zap, Clock, Shield, Smartphone, Mail, ChartBar, Target } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FeatureProps {
  icon: React.ElementType;
  title: string;
  description: string;
  details: string;
  delay: string;
}

const FeatureCard = ({ icon: Icon, title, description, details, delay }: FeatureProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
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
      className={`transition-all duration-500 ${delay} ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      <Card 
        className={cn(
          "glass h-full cursor-pointer transition-all duration-300",
          isExpanded ? "shadow-lg" : "hover:shadow-md hover:translate-y-[-5px]"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardContent className="p-6">
          <div className="rounded-full bg-primary bg-opacity-10 p-3 inline-block mb-4 transition-all duration-300 hover:bg-primary hover:text-white">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-2">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
          
          <div className={cn(
            "mt-4 overflow-hidden transition-all duration-300",
            isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}>
            <div className="pt-4 border-t border-border">
              <p>{details}</p>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-primary">
            {isExpanded ? "Click to collapse" : "Click to expand"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Features = () => {
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

  // Enhanced features with more engaging icons and descriptions
  const features = [
    {
      icon: Bell,
      title: "Real-Time Price Alerts",
      description: "Get instant notifications when competitors change their prices",
      details: "Our advanced monitoring system checks competitor prices as frequently as every hour, sending you immediate notifications via email or SMS whenever a price change is detected. You'll never miss a competitor's price adjustment again.",
      delay: "delay-100"
    },
    {
      icon: LineChart,
      title: "Competitor Analysis",
      description: "Track pricing trends and analyze competitor strategies",
      details: "Visualize pricing trends over time with intuitive charts and data representations. Identify patterns in competitor pricing strategies, seasonal adjustments, and market positioning to make informed decisions about your own pricing.",
      delay: "delay-200"
    },
    {
      icon: Settings,
      title: "Customizable Monitoring",
      description: "Set up personalized monitoring parameters",
      details: "Configure exactly what you want to track with customizable parameters. Set thresholds for alerts, specify monitoring frequencies, and prioritize which competitors matter most to your business strategy.",
      delay: "delay-300"
    },
    {
      icon: Zap,
      title: "Fast Implementation",
      description: "Get up and running in minutes with our simple setup",
      details: "No technical skills required. Simply input the competitor URLs you want to monitor, and our system automatically starts tracking prices. The intuitive dashboard makes it easy to manage your monitoring setup with just a few clicks.",
      delay: "delay-400"
    },
    {
      icon: Clock,
      title: "Historical Data",
      description: "Access historical pricing data with visual timelines",
      details: "Dive into comprehensive historical pricing data to understand how prices have changed over time. Our visual timelines help you spot trends, identify seasonal patterns, and make data-driven predictions about future price movements.",
      delay: "delay-500"
    },
    {
      icon: Shield,
      title: "Price Protection",
      description: "Ensure your prices remain competitive without sacrificing profit",
      details: "Our smart comparison tools help you maintain competitive pricing while preserving your profit margins. Get recommendations on optimal price points based on competitor activity and market trends.",
      delay: "delay-600"
    }
  ];

  return (
    <div className="py-20 relative" id="features">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 dark:opacity-10"></div>
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 dark:opacity-10"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <div 
          ref={ref}
          className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to stay competitive</h2>
          <p className="text-muted-foreground text-lg">
            Our platform provides real-time monitoring and advanced analytics to help you make data-driven pricing decisions.
            <span className="block mt-2 text-sm italic">Click on any feature to learn more</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              details={feature.details}
              delay={feature.delay}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
