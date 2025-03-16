
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CheckCircle } from 'lucide-react';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate signup process
    setTimeout(() => {
      setIsLoading(false);
      console.log('Signup attempt with:', { name, email });
      // Authentication logic will be added in the future
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-24 flex items-center justify-center">
        <div className="relative w-full max-w-5xl mx-auto px-4 py-8">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
              <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
            </div>
          </div>
          
          <div 
            className={`grid md:grid-cols-2 gap-8 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="glass rounded-xl p-8">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">Create your account</h1>
                <p className="text-muted-foreground">
                  Start your 14-day free trial today
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                    placeholder="John Doe"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                    placeholder="name@example.com"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                    placeholder="Create a strong password"
                    required
                  />
                </div>
                
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full rounded-full py-6"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Create account"}
                  </Button>
                </div>
              </form>
              
              <div className="mt-8 pt-6 border-t border-border text-center">
                <p className="text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary hover:underline">
                    Log in
                  </Link>
                </p>
              </div>
            </div>
            
            <div className="hidden md:flex flex-col justify-center">
              <div className="glass rounded-xl p-8">
                <h2 className="text-xl font-bold mb-6">Why choose PriceWatch?</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Real-time Price Alerts</h3>
                      <p className="text-muted-foreground text-sm">
                        Get notified instantly when competitors change their prices.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Easy Setup</h3>
                      <p className="text-muted-foreground text-sm">
                        Start monitoring competitor prices in just a few minutes.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                    <div>
                      <h3 className="font-medium">14-Day Free Trial</h3>
                      <p className="text-muted-foreground text-sm">
                        Test all features with no commitment or credit card required.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Increase Profits</h3>
                      <p className="text-muted-foreground text-sm">
                        Our customers report an average 15% increase in profit margins.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 p-4 bg-secondary/50 rounded-lg">
                  <blockquote className="italic text-muted-foreground">
                    "PriceWatch has revolutionized how we set prices. We've increased our margins while staying competitive."
                  </blockquote>
                  <div className="mt-3 flex items-center">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mr-2">
                      JD
                    </div>
                    <div>
                      <p className="text-sm font-medium">John Davis</p>
                      <p className="text-xs text-muted-foreground">Sales Manager, AutoCity</p>
                    </div>
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

export default Signup;
