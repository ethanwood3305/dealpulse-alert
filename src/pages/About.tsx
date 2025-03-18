
import { useEffect, useRef, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const About = () => {
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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-24">
        {/* Hero section */}
        <div className="relative py-16 md:py-24 overflow-hidden">
          {/* Background elements */}
          <div className="absolute inset-0 overflow-hidden -z-10">
            <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
            <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
          </div>
          
          <div className="container mx-auto px-4 md:px-6">
            <div 
              ref={ref}
              className={`max-w-3xl mx-auto text-center transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-6">About DealPulse</h1>
              <p className="text-lg text-muted-foreground mb-8">
                A solo developer's mission to empower auto dealerships with competitive pricing insights.
              </p>
            </div>
          </div>
        </div>
        
        {/* Story section */}
        <div className="py-16 bg-secondary/50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">My Story</h2>
              <p className="text-muted-foreground mb-4">
                DealPulse began as a passion project in 2020. After years working in the automotive industry, I noticed a common pain point: dealerships spending hours manually checking competitors' prices, often missing opportunities to adjust their pricing strategy in real-time.
              </p>
              <p className="text-muted-foreground mb-4">
                As a solo developer with both industry experience and technical skills, I set out to create a solution that would automate this process. Working nights and weekends, I built the first version of DealPulse to help a few local dealerships in my area.
              </p>
              <p className="text-muted-foreground">
                Today, I continue to develop and maintain DealPulse single-handedly, from writing code to handling customer support. This one-person operation allows me to stay nimble, respond quickly to customer feedback, and maintain the personal touch that larger companies often lose.
              </p>
            </div>
          </div>
        </div>
        
        {/* Values section */}
        <div className="py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold mb-6">My Values</h2>
              <p className="text-muted-foreground">
                These core principles guide everything I do at DealPulse.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="glass rounded-xl p-6">
                <h3 className="text-xl font-medium mb-3">Innovation</h3>
                <p className="text-muted-foreground">
                  I continuously improve the platform, embracing new technologies to provide the best possible solutions for my clients.
                </p>
              </div>
              
              <div className="glass rounded-xl p-6">
                <h3 className="text-xl font-medium mb-3">Reliability</h3>
                <p className="text-muted-foreground">
                  My clients depend on DealPulse data to make critical business decisions. I ensure the platform is accurate, fast, and always available.
                </p>
              </div>
              
              <div className="glass rounded-xl p-6">
                <h3 className="text-xl font-medium mb-3">Personal Touch</h3>
                <p className="text-muted-foreground">
                  As a solo developer, I can provide personalized support and build features that directly address my clients' needs, without bureaucracy slowing things down.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Future section */}
        <div className="py-16 bg-secondary/50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">Looking Forward</h2>
              <p className="text-muted-foreground mb-4">
                While DealPulse is currently a one-person operation, I have big plans for the future. I'm constantly working on new features and improvements based on user feedback, and I'm committed to growing this platform to serve dealerships of all sizes.
              </p>
              <p className="text-muted-foreground mb-4">
                Being a solo developer means I can move quickly and make decisions that prioritize my users rather than shareholders. It also means I wear many hats - developer, designer, marketer, and customer support.
              </p>
              <p className="text-muted-foreground">
                I'm grateful for each and every client who trusts DealPulse to help their business thrive, and I'm excited to continue this journey together.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;
