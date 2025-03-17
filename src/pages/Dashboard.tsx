
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SubscriptionCard } from '@/components/dashboard/SubscriptionCard';
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';
import { ApiDocsCard } from '@/components/dashboard/ApiDocsCard';
import { AddCarForm } from '@/components/dashboard/AddCarForm';
import { TrackedCarsTable } from '@/components/dashboard/TrackedCarsTable';
import { useSubscription } from '@/hooks/use-subscription';
import { useTrackedCars } from '@/hooks/use-tracked-cars';
import * as z from "zod";

// Define the car schema with proper types
const carSchema = z.object({
  registrationNumber: z.string().optional(),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  engineType: z.string().min(1, "Engine type is required"),
});

const Dashboard = () => {
  const [isAddingCar, setIsAddingCar] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checkoutProcessed, setCheckoutProcessed] = useState(false);
  const [checkoutTime, setCheckoutTime] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const { 
    userSubscription, 
    canAddMoreUrls: canAddMoreCars, 
    isLoading: isLoadingSubscription,
    refreshSubscription,
    cancelSubscription,
    generateApiKey,
    refreshAttempts
  } = useSubscription(user?.id);
  
  const { 
    trackedCars, 
    isLoading: isLoadingCars,
    addCar,
    deleteCar,
    addTag,
    removeTag
  } = useTrackedCars(user?.id);

  const isLoading = !initialLoadComplete && (isLoadingSubscription || isLoadingCars);

  const processCheckout = useCallback(async () => {
    if (checkoutProcessed) return;
    
    const searchParams = new URLSearchParams(location.search);
    const checkoutStatus = searchParams.get('checkout');
    const timestamp = searchParams.get('t');
    const expectedPlan = searchParams.get('plan');
    const expectedUrls = searchParams.get('urls');
    
    if (checkoutStatus === 'success' && !checkoutProcessed) {
      setCheckoutProcessed(true);
      setCheckoutTime(timestamp);
      
      console.log("[Dashboard] Processing successful checkout");
      console.log(`[Dashboard] Expected plan: ${expectedPlan}, URLs: ${expectedUrls}`);
      
      sessionStorage.setItem('expectedPlan', expectedPlan);
      sessionStorage.setItem('expectedUrlCount', expectedUrls);
      
      toast({
        title: "Processing your subscription...",
        description: "Please wait while we update your account details.",
      });
      
      const firstRefresh = await refreshSubscription(3);
      
      if (firstRefresh) {
        if (expectedPlan && userSubscription?.plan === expectedPlan) {
          toast({
            title: "Subscription active!",
            description: `Your ${expectedPlan} plan is now active.`
          });
        } else {
          toast({
            title: "Subscription active!",
            description: "Your subscription has been updated successfully."
          });
        }
      } else {
        console.log("[Dashboard] First refresh attempt failed, scheduling delayed refreshes");
        
        const scheduleRefresh = (delayMs: number, attempts: number, index: number) => {
          setTimeout(async () => {
            if (checkoutProcessed) {
              console.log(`[Dashboard] Running delayed refresh #${index} (${delayMs}ms delay)`);
              const refreshSuccessful = await refreshSubscription(attempts);
              
              if (refreshSuccessful && index <= 2) {
                toast({
                  title: "Subscription active!",
                  description: "Your subscription has been updated successfully."
                });
              } else if (!refreshSuccessful && index === 4) {
                toast({
                  title: "Subscription status unclear",
                  description: "Please refresh the page to see your current subscription status.",
                  variant: "destructive"
                });
              }
            }
          }, delayMs);
        };
        
        scheduleRefresh(5000, 3, 1);
        scheduleRefresh(15000, 3, 2);
        scheduleRefresh(30000, 2, 3);
        scheduleRefresh(60000, 2, 4);
      }
      
      navigate('/dashboard', { replace: true });
    }
  }, [refreshSubscription, navigate, location.search, checkoutProcessed, userSubscription]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        navigate('/login');
        return;
      }
      setUser(data.user);

      const searchParams = new URLSearchParams(location.search);
      const checkoutStatus = searchParams.get('checkout');
      
      if (checkoutStatus === 'success' && !checkoutProcessed) {
        console.log("[Dashboard] Checkout success detected in URL");
        processCheckout();
      }
    };
    
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/login');
      }
    });
    
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [navigate, location.search, checkoutProcessed, processCheckout]);

  useEffect(() => {
    if (!isLoadingSubscription && !isLoadingCars && !initialLoadComplete) {
      setInitialLoadComplete(true);
    }
  }, [isLoadingSubscription, isLoadingCars, initialLoadComplete]);

  const onSubmitCar = async (values: z.infer<typeof carSchema>) => {
    if (!user) return;
    setIsAddingCar(true);
    
    try {
      const { data: canAddMore, error: checkError } = await supabase.rpc('can_add_more_urls', {
        user_uuid: user.id
      });
      
      if (checkError) {
        throw checkError;
      }
      
      if (!canAddMore) {
        toast({
          title: "Limit reached",
          description: `You've reached your limit of ${userSubscription?.urls_limit} cars. Please upgrade your plan to add more.`,
          variant: "destructive"
        });
        return;
      }

      // Here's the fix: ensure we pass an object with the required fields (brand, model, engineType)
      // and the optional registrationNumber field
      const success = await addCar({
        brand: values.brand,
        model: values.model,
        engineType: values.engineType,
        registrationNumber: values.registrationNumber
      });
      
      if (success) {
        refreshSubscription();
        toast({
          title: "Car added",
          description: "The car has been added to your tracking list."
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add car. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsAddingCar(false);
    }
  };

  const handleDeleteCar = async (id: string) => {
    if (!user) return;
    const success = await deleteCar(id);
    if (success) {
      refreshSubscription();
    }
  };

  const handleAddTag = async (urlId: string, tag: string) => {
    if (!user) return;
    await addTag(urlId, tag);
  };

  const handleRemoveTag = async (urlId: string, tag: string) => {
    if (!user) return;
    await removeTag(urlId, tag);
  };

  const handleCancelSubscription = async (): Promise<void> => {
    if (!user) return;
    const success = await cancelSubscription();
    if (success) {
      toast({
        title: "Subscription canceled",
        description: "Your subscription has been canceled. Your plan will remain active until the end of the current billing period."
      });
      refreshSubscription();
    }
  };

  const handleGenerateApiKey = async () => {
    if (!user) return;
    const success = await generateApiKey();
    if (success) {
      refreshSubscription();
    }
  };

  const scrollToAddCarForm = () => {
    document.getElementById('add-car-form')?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  const manuallyRefreshSubscription = () => {
    if (!user) return;
    
    toast({
      title: "Refreshing subscription...",
      description: "Please wait while we check for updates to your plan.",
    });
    
    refreshSubscription(3).then(success => {
      if (success) {
        toast({
          title: "Subscription refreshed",
          description: "Your subscription information is now up to date."
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading your dashboard...</span>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-16 container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <DashboardHeader 
            userName={user?.user_metadata?.full_name} 
            userEmail={user?.email}
            isPro={userSubscription?.plan !== 'free'}
          />
          
          {checkoutTime && refreshAttempts > 0 && !userSubscription?.stripe_subscription_id && (
            <div className="mb-6 p-4 border border-yellow-200 bg-yellow-50 rounded-md text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-400">
              <h3 className="font-medium mb-2">Subscription Update In Progress</h3>
              <p className="text-sm mb-2">
                We're still processing your subscription. This usually takes less than a minute.
              </p>
              <Button onClick={() => refreshSubscription()} variant="outline" size="sm">
                Check Subscription Status
              </Button>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <SubscriptionCard 
              plan={userSubscription?.plan}
              urls_limit={userSubscription?.urls_limit}
              trackedUrlsCount={trackedCars.length}
              onCancelSubscription={handleCancelSubscription}
              hasActiveSubscription={!!userSubscription?.stripe_subscription_id}
              onRefreshSubscription={manuallyRefreshSubscription}
            />
            
            <QuickActionsCard 
              canAddMoreUrls={canAddMoreCars}
              onAddUrlClick={scrollToAddCarForm}
            />
          </div>
          
          <div className="mb-10">
            <ApiDocsCard 
              apiKey={userSubscription?.api_key}
              userId={user?.id}
              hasApiAccess={userSubscription?.has_api_access || false}
              onGenerateKey={handleGenerateApiKey}
            />
          </div>
          
          <AddCarForm 
            onSubmit={onSubmitCar}
            isAddingCar={isAddingCar}
            canAddMoreCars={canAddMoreCars}
          />
          
          <TrackedCarsTable 
            trackedCars={trackedCars}
            onDelete={handleDeleteCar}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            carsLimit={userSubscription?.urls_limit}
          />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
