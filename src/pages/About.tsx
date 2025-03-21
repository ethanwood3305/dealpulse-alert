
import { useEffect, useRef, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Users, Award, TrendingUp, LineChart, MapPin, Settings, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-24">
        {/* Hero section */}
        <div className="relative py-16 md:py-24 overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 overflow-hidden -z-10 bg-gradient-to-b from-background to-secondary/20"></div>
          
          <div className="container mx-auto px-4 md:px-6">
            <motion.div 
              ref={ref}
              className="max-w-3xl mx-auto text-center"
              initial="hidden"
              animate={isVisible ? "visible" : "hidden"}
              variants={fadeInVariants}
              transition={{ duration: 0.7 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
                Revolutionizing Auto Dealership Intelligence
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                DealPulse was born from a vision to transform how dealerships compete in today's digital marketplace, offering unparalleled pricing insights that drive business growth.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" className="rounded-full gap-2">
                  Our Services <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="rounded-full">
                  Contact Us
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Mission section */}
        <div className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
                <p className="text-muted-foreground mb-6">
                  At DealPulse, we're committed to empowering auto dealerships with real-time competitive intelligence. Our mission is to level the playing field by providing dealerships of all sizes with enterprise-grade pricing analytics that were previously only accessible to industry giants.
                </p>
                <p className="text-muted-foreground mb-6">
                  We believe that by giving dealerships clear visibility into market pricing trends, we help them make smarter decisions, optimize their inventory, and ultimately increase their bottom line while providing better value to consumers.
                </p>
                <div className="space-y-4">
                  {[
                    "Real-time market intelligence",
                    "Data-driven inventory optimization",
                    "Transparent pricing strategies",
                    "Increased sales conversion"
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="aspect-video rounded-lg overflow-hidden shadow-xl">
                  <img 
                    src="https://images.unsplash.com/photo-1605810230434-7631ac76ec81?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2574&q=80" 
                    alt="Car dealership showroom" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 bg-primary text-white p-6 rounded-lg shadow-lg">
                  <p className="text-2xl font-bold">200+</p>
                  <p className="text-sm opacity-90">Enterprise Clients</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Values section */}
        <div className="py-16 md:py-24 bg-secondary/20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold mb-6">Our Core Values</h2>
              <p className="text-muted-foreground">
                These principles guide everything we do at DealPulse, from product development to customer service.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  icon: <Award className="h-8 w-8 text-primary" />,
                  title: "Excellence",
                  description: "We strive for excellence in everything we do, from our technology to our customer service."
                },
                {
                  icon: <Users className="h-8 w-8 text-primary" />,
                  title: "Collaboration",
                  description: "We believe in working closely with our clients to ensure our solutions meet their unique needs."
                },
                {
                  icon: <TrendingUp className="h-8 w-8 text-primary" />,
                  title: "Innovation",
                  description: "We're constantly improving our platform with cutting-edge technologies and methodologies."
                }
              ].map((value, index) => (
                <motion.div 
                  key={index} 
                  className="bg-background rounded-xl p-8 shadow-lg h-full"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="bg-primary/10 p-3 rounded-full w-fit mb-6">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Team section */}
        <div className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold mb-6">Our Leadership Team</h2>
              <p className="text-muted-foreground">
                Meet the experienced professionals who are driving DealPulse's mission forward.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {[
                {
                  name: "Bradley",
                  title: "Co-Founder & Automotive Expert",
                  image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80",
                  bio: "With over 20 years in the automotive industry as a former car dealership salesman, Bradley brings unparalleled industry insight to DealPulse's strategic direction."
                },
                {
                  name: "Ethan",
                  title: "Co-Founder & CTO",
                  image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80",
                  bio: "A software developer with 2 years of automotive industry experience, Ethan leads our technology development with innovative solutions that transform dealership operations."
                }
              ].map((person, index) => (
                <motion.div 
                  key={index} 
                  className="bg-background rounded-xl overflow-hidden shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="aspect-[3/4] overflow-hidden">
                    <img 
                      src={person.image} 
                      alt={person.name} 
                      className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold">{person.name}</h3>
                    <p className="text-primary font-medium mb-3">{person.title}</p>
                    <p className="text-muted-foreground">{person.bio}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Features highlight */}
        <div className="py-16 md:py-24 bg-secondary/20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold mb-6">What Sets Us Apart</h2>
              <p className="text-muted-foreground">
                DealPulse offers a comprehensive suite of tools designed specifically for the unique challenges of automobile dealerships.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {[
                {
                  icon: <LineChart className="h-6 w-6 text-primary" />,
                  title: "Advanced Analytics",
                  description: "Gain deep insights into market trends with our powerful analytics dashboard."
                },
                {
                  icon: <MapPin className="h-6 w-6 text-primary" />,
                  title: "Radius Price Mapping",
                  description: "Visualize geographical pricing data to optimize your competitive positioning."
                },
                {
                  icon: <Settings className="h-6 w-6 text-primary" />,
                  title: "Customizable Alerts",
                  description: "Set up notifications for price changes that matter to your business."
                },
                {
                  icon: <MessageSquare className="h-6 w-6 text-primary" />,
                  title: "Dedicated Support",
                  description: "Our team of industry experts is always available to help you succeed."
                }
              ].map((feature, index) => (
                <motion.div 
                  key={index} 
                  className="flex gap-5 p-6 bg-background rounded-xl shadow-lg"
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="bg-primary/10 p-3 h-fit rounded-full">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        
        {/* CTA section */}
        <div className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto bg-gradient-to-r from-primary/90 to-blue-600/90 rounded-2xl p-8 md:p-12 text-white shadow-xl">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-4">Ready to transform your dealership?</h2>
                  <p className="mb-6 opacity-90">
                    Join hundreds of successful dealerships that are already leveraging DealPulse to stay competitive and increase their profits.
                  </p>
                  <Button size="lg" variant="secondary" className="rounded-full gap-2">
                    Schedule a Demo <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold">28%</p>
                    <p className="text-sm opacity-90">Average Profit Increase</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold">3x</p>
                    <p className="text-sm opacity-90">Faster Market Response</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold">15+</p>
                    <p className="text-sm opacity-90">Hours Saved Weekly</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold">96%</p>
                    <p className="text-sm opacity-90">Client Retention</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;
