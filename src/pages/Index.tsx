
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Index = () => {
  const featuresRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there's a hash in the URL
    if (window.location.hash === '#features') {
      setTimeout(() => {
        featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        <Hero />
        <div ref={featuresRef} id="features">
          <Features />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
