
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SubscriptionCard } from '@/components/dashboard/SubscriptionCard';
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';
import { ApiDocsCard } from '@/components/dashboard/ApiDocsCard';
import { TrackedCarsTable } from '@/components/dashboard/TrackedCarsTable';
import { VehicleLookup } from '@/components/dashboard/VehicleLookup';
import { useSubscription } from '@/hooks/use-subscription';
import { useTrackedCars } from '@/hooks/use-tracked-cars';
import SEO from '@/components/SEO';

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const navigate = useNavigate();
  
  const { 
    userSubscription, 
    canAddMoreUrls: canAddMoreCars, 
    isLoading: isLoadingSubscription,
    refreshSubscription,
    generateApiKey
  } = useSubscription(user?.id);
  
  const { 
    trackedCars, 
    isLoading: isLoadingCars,
    deleteCar,
    addTag,
    removeTag,
    updateCarDetails,
    refreshCars,
    triggerScraping,
    isScrapingCar,
    getListingsForCar
  } = useTrackedCars(user?.id);

  const isLoading = !initialLoadComplete && (isLoadingSubscription || isLoadingCars);

  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        navigate('/login');
        return;
      }
      setUser(data.user);
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
  }, [navigate]);

  useEffect(() => {
    if (!isLoadingSubscription && !isLoadingCars && !initialLoadComplete) {
      setInitialLoadComplete(true);
    }
  }, [isLoadingSubscription, isLoadingCars, initialLoadComplete]);

  const handleDeleteCar = async (id: string): Promise<boolean> => {
    if (!user) return false;
    const success = await deleteCar(id);
    if (success) {
      refreshSubscription();
    }
    return success;
  };

  const handleAddTag = async (urlId: string, tag: string): Promise<void> => {
    if (!user) return;
    await addTag(urlId, tag);
  };

  const handleRemoveTag = async (urlId: string, tag: string): Promise<void> => {
    if (!user) return;
    await removeTag(urlId, tag);
  };

  const handleUpdateCarDetails = async (carId: string, mileage: string, price: string): Promise<boolean> => {
    if (!user) return false;
    const success = await updateCarDetails(carId, mileage, price);
    return success;
  };

  const handleGenerateApiKey = async (): Promise<boolean> => {
    if (!user) return false;
    const success = await generateApiKey();
    if (success) {
      refreshSubscription();
    }
    return success;
  };

  const scrollToVehicleLookup = () => {
    document.getElementById('vehicle-lookup')?.scrollIntoView({
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

  const handleCarAdded = () => {
    refreshCars();
    refreshSubscription();
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
      <SEO 
        title="Dashboard | Carparison"
        description="Monitor your tracked vehicles, manage your subscription, and get real-time price alerts for your competitors' listings in one convenient dashboard."
        canonicalUrl="https://carparison.app/dashboard"
      />
      <Navbar />
      
      <main className="flex-grow py-16 container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <DashboardHeader 
            userName={user?.user_metadata?.full_name} 
            userEmail={user?.email}
            isPro={userSubscription?.plan !== 'free'}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <SubscriptionCard 
              plan={userSubscription?.plan}
              urls_limit={userSubscription?.urls_limit}
              trackedUrlsCount={trackedCars.length}
              onRefreshSubscription={manuallyRefreshSubscription}
            />
            
            <QuickActionsCard 
              canAddMoreCars={canAddMoreCars}
              onAddCarClick={scrollToVehicleLookup}
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
          
          <div id="vehicle-lookup" className="mb-10">
            <VehicleLookup 
              userId={user?.id}
              onCarAdded={handleCarAdded}
            />
          </div>
          
          <TrackedCarsTable 
            trackedCars={trackedCars}
            onDelete={handleDeleteCar}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            onUpdateDetails={handleUpdateCarDetails}
            carsLimit={userSubscription?.urls_limit}
            onTriggerScraping={triggerScraping}
            isScrapingCar={isScrapingCar}
            getListingsForCar={getListingsForCar}
          />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
