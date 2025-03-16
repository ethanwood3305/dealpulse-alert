
import { useEffect, useRef, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const TeamMember = ({ name, role, image, delay }: { 
  name: string; 
  role: string; 
  image: string;
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
      className={`glass rounded-xl overflow-hidden transition-all duration-700 ${delay} ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      <div className="aspect-square bg-muted">
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-6">
        <h3 className="text-lg font-medium">{name}</h3>
        <p className="text-muted-foreground">{role}</p>
      </div>
    </div>
  );
};

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
              <h1 className="text-4xl md:text-5xl font-bold mb-6">About PriceWatch</h1>
              <p className="text-lg text-muted-foreground mb-8">
                We're on a mission to help auto dealerships stay competitive in a rapidly changing market.
              </p>
            </div>
          </div>
        </div>
        
        {/* Story section */}
        <div className="py-16 bg-secondary/50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <p className="text-muted-foreground mb-4">
                PriceWatch was founded in 2020 by a team of automotive industry veterans and software engineers who saw a gap in the market. Car dealerships were struggling to keep track of competitors' prices manually, often missing opportunities to adjust their pricing strategy in real-time.
              </p>
              <p className="text-muted-foreground mb-4">
                We built PriceWatch to solve this problem, providing an automated solution that monitors competitor prices around the clock and alerts dealerships when changes occur. This enables our clients to respond quickly and stay competitive in their local markets.
              </p>
              <p className="text-muted-foreground">
                Today, PriceWatch is trusted by hundreds of dealerships across the country, from small independent lots to large multi-location groups. Our platform processes millions of price points daily, providing valuable insights that help our clients maximize their sales and profits.
              </p>
            </div>
          </div>
        </div>
        
        {/* Values section */}
        <div className="py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold mb-6">Our Values</h2>
              <p className="text-muted-foreground">
                These core principles guide everything we do at PriceWatch.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="glass rounded-xl p-6">
                <h3 className="text-xl font-medium mb-3">Innovation</h3>
                <p className="text-muted-foreground">
                  We continuously improve our platform, embracing new technologies to provide the best possible solutions for our clients.
                </p>
              </div>
              
              <div className="glass rounded-xl p-6">
                <h3 className="text-xl font-medium mb-3">Reliability</h3>
                <p className="text-muted-foreground">
                  Our clients depend on our data to make critical business decisions. We ensure our platform is accurate, fast, and always available.
                </p>
              </div>
              
              <div className="glass rounded-xl p-6">
                <h3 className="text-xl font-medium mb-3">Client Success</h3>
                <p className="text-muted-foreground">
                  We measure our success by the success of our clients. Their growth and profitability are our top priorities.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Team section */}
        <div className="py-16 bg-secondary/50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold mb-6">Our Team</h2>
              <p className="text-muted-foreground">
                Meet the people behind PriceWatch who are dedicated to helping auto dealerships thrive.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              <TeamMember
                name="Alex Johnson"
                role="CEO & Founder"
                image="/placeholder.svg"
                delay="delay-100"
              />
              <TeamMember
                name="Sarah Chen"
                role="CTO"
                image="/placeholder.svg"
                delay="delay-200"
              />
              <TeamMember
                name="Michael Rodriguez"
                role="Head of Product"
                image="/placeholder.svg"
                delay="delay-300"
              />
              <TeamMember
                name="Jessica Taylor"
                role="Customer Success"
                image="/placeholder.svg"
                delay="delay-400"
              />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;
