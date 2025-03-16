
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ChevronRight, Bell, LineChart, ShieldCheck } from 'lucide-react';

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="relative overflow-hidden pt-24 md:pt-32 pb-16 md:pb-24">
      {/* Background gradient */}
      <div className="absolute top-0 left-0 right-0 h-[70%] bg-gradient-to-b from-blue-50 to-transparent -z-10"></div>
      
      {/* Floating circles decoration */}
      <div className="absolute top-20 right-[10%] w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
      <div className="absolute top-40 left-[5%] w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float animate-delay-200"></div>
      
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Small tag line */}
          <div 
            className={`inline-block glass px-4 py-1.5 rounded-full text-sm font-medium mb-6 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <span className="text-primary">New</span> — Real-time price monitoring for auto dealers
          </div>
          
          {/* Main heading */}
          <h1 
            className={`text-4xl md:text-5xl lg:text-6xl font-bold leading-tight md:leading-tight lg:leading-tight mb-6 transition-all duration-700 delay-100 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <span className="relative">
              Never Get Underpriced
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 10C50.5 4 99 2.5 147.5 2.5C196 2.5 244.5 4 293 10" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </span> Again!
          </h1>
          
          {/* Subtitle */}
          <p 
            className={`text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto mb-8 transition-all duration-700 delay-200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            Get instant alerts when competitors change their prices. Stay ahead of the market with automated monitoring that keeps you competitive 24/7.
          </p>
          
          {/* CTA buttons */}
          <div 
            className={`flex flex-col sm:flex-row gap-4 justify-center mb-16 transition-all duration-700 delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <Link to="/signup">
              <Button size="lg" className="rounded-full px-8 h-12 text-base">
                Get started
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-base">
                View pricing
              </Button>
            </Link>
          </div>
          
          {/* Feature highlights */}
          <div 
            className={`grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto transition-all duration-700 delay-400 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="flex flex-col items-center">
              <div className="rounded-full bg-blue-100 p-3 mb-4">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">Instant Alerts</h3>
              <p className="text-sm text-muted-foreground text-center">
                Get notified immediately when competitors change their prices.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="rounded-full bg-blue-100 p-3 mb-4">
                <LineChart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">Trend Analysis</h3>
              <p className="text-sm text-muted-foreground text-center">
                Track price history and predict future pricing strategies.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="rounded-full bg-blue-100 p-3 mb-4">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">Stay Competitive</h3>
              <p className="text-sm text-muted-foreground text-center">
                Maintain optimal pricing to maximize your profit margins.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
