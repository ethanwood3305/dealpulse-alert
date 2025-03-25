
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CheckCircle } from 'lucide-react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import SEO from '@/components/SEO';

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupFormValues = z.infer<typeof signupSchema>;

const Signup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: ''
    }
  });

  useEffect(() => {
    setIsVisible(true);
    
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        navigate('/dashboard');
      }
    };
    
    checkSession();
  }, [navigate]);

  const setupInitialSubscription = async (userId: string) => {
    try {
      console.log("Setting up initial subscription for user:", userId);
      
      const { error } = await supabase
        .from('subscriptions')
        .update({
          plan: 'standard',
          urls_limit: 10
        })
        .eq('user_id', userId);
        
      if (error) {
        console.error("Error setting up subscription:", error);
        throw error;
      }
      
      console.log("Initial subscription setup successfully");
      return true;
    } catch (error) {
      console.error("Failed to setup subscription:", error);
      return false;
    }
  };

  const handleSubmit = async (values: SignupFormValues) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.name,
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        const setupSuccessful = await setupInitialSubscription(data.user.id);
        
        if (setupSuccessful) {
          toast({
            title: "Account created successfully!",
            description: "Your account is now ready. You can log in to start tracking vehicles.",
          });
        } else {
          toast({
            title: "Account created successfully!",
            description: "There was an issue setting up your account. Please contact support.",
          });
        }
        
        navigate('/login');
      }
    } catch (error: any) {
      toast({
        title: "Error creating account",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Sign Up | Carparison"
        description="Create your Carparison account today and start monitoring vehicle prices. Track competitor listings and make data-driven pricing decisions."
        canonicalUrl="https://carparison.app/signup"
      />
      <Navbar />
      
      <main className="flex-grow pt-24 flex items-center justify-center">
        <div className="relative w-full max-w-5xl mx-auto px-4 py-8">
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
                  Start tracking vehicle prices today
                </p>
              </div>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="John Doe"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="name@example.com"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Create a strong password"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
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
              </Form>
              
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
                <h2 className="text-xl font-bold mb-6">Why choose DealPulse?</h2>
                
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
                        Start monitoring competitor car prices in just a few minutes.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Enterprise Solutions</h3>
                      <p className="text-muted-foreground text-sm">
                        Tailored plans for businesses of all sizes with advanced features.
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
                    "DealPulse has revolutionized how we set prices. We've increased our margins while staying competitive."
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
