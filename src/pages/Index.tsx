
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

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
      <SEO 
        title="Carparison - Monitor Vehicle Prices Effortlessly"
        description="Stay ahead of the market with real-time price tracking for any vehicle model. Get daily alerts when prices change and make informed decisions."
        canonicalUrl="https://carparison.app"
        ogImage="/car-dealer-preview.png"
      />
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
