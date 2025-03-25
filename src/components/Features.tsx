import { useEffect, useRef, useState } from 'react';
import { Bell, LineChart, Settings, Calendar, Clock, Shield, Map, BarChart3, Cpu, Tag, Target, Search } from 'lucide-react';
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
          <div className="rounded-full bg-primary/10 p-3 inline-block mb-4 transition-all duration-300 hover:bg-primary hover:text-white">
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

  const features = [
    {
      icon: Bell,
      title: "Daily Price Alerts",
      description: "Get daily notifications when competitors change their prices",
      details: "Our monitoring system checks competitor prices daily for at least 30 consecutive days, sending you notifications via email whenever a price change is detected. This extended period of monitoring helps you identify trends and make more informed pricing decisions without having to constantly check prices manually.",
      delay: "delay-100"
    },
    {
      icon: BarChart3,
      title: "Competitor Analysis",
      description: "Track pricing trends and analyze competitor strategies",
      details: "Visualize pricing trends over time with intuitive charts and data representations. Identify patterns in competitor pricing strategies, seasonal adjustments, and market positioning to make informed decisions about your own pricing.",
      delay: "delay-200"
    },
    {
      icon: Settings,
      title: "Simple Dashboard",
      description: "Easy to use and accessible dashboard for all your monitoring needs",
      details: "Our intuitive dashboard puts all the information you need at your fingertips. With a clean, user-friendly interface, you can quickly access competitor prices, view historical data, and manage your monitored vehicles without any technical expertise.",
      delay: "delay-300"
    },
    {
      icon: Clock,
      title: "Hassle-Free Setup",
      description: "Get started quickly with our intuitive onboarding process",
      details: "No technical skills required. Simply input the vehicle details you want to monitor, and our system automatically starts tracking prices. The straightforward setup process means you can be up and running in minutes, not hours.",
      delay: "delay-400"
    },
    {
      icon: Map,
      title: "Radius Scope",
      description: "View competitors within 10, 50, 100 miles or nationwide",
      details: "Customize your competitive landscape by setting your preferred radius. Whether you want to focus on local competition within 10 miles or get a broader view of the national market, our flexible radius options give you complete control over your monitoring scope.",
      delay: "delay-500"
    },
    {
      icon: Cpu,
      title: "Latest AI Algorithms",
      description: "Leveraging cutting-edge AI for accurate price comparison",
      details: "Our platform uses advanced artificial intelligence algorithms to ensure the most accurate and relevant price comparisons. By continuously learning from market data, our AI can identify patterns and anomalies that would be impossible to spot manually, giving you a competitive edge.",
      delay: "delay-600"
    }
  ];

  return (
    <div className="py-20 relative" id="features">
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
