
import { useEffect, useRef, useState } from 'react';
import { Settings, Bell, LineChart, Zap, Clock, Shield } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description, delay }: { 
  icon: React.ElementType;
  title: string;
  description: string;
  delay: string;
}) => {
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
      className={`glass rounded-xl p-6 transition-all duration-700 ${delay} ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      <div className="rounded-full bg-primary bg-opacity-10 p-3 inline-block mb-4">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
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

  return (
    <div className="py-20 relative" id="features">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
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
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={Bell}
            title="Real-Time Price Alerts"
            description="Get instant notifications when competitors change their prices, so you can respond quickly."
            delay="delay-100"
          />
          <FeatureCard
            icon={LineChart}
            title="Competitor Analysis"
            description="Track pricing trends and analyze competitor strategies to stay ahead of the market."
            delay="delay-200"
          />
          <FeatureCard
            icon={Settings}
            title="Customizable Monitoring"
            description="Set up monitoring parameters that match your business needs and pricing strategy."
            delay="delay-300"
          />
          <FeatureCard
            icon={Zap}
            title="Fast Implementation"
            description="Get up and running in minutes with our simple setup process and intuitive interface."
            delay="delay-400"
          />
          <FeatureCard
            icon={Clock}
            title="Historical Data"
            description="Access historical pricing data to identify patterns and make informed decisions."
            delay="delay-500"
          />
          <FeatureCard
            icon={Shield}
            title="Price Protection"
            description="Ensure your prices remain competitive without sacrificing profit margins."
            delay="delay-600"
          />
        </div>
      </div>
    </div>
  );
};

export default Features;
