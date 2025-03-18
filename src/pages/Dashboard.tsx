
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
import { AddCarForm } from '@/components/dashboard/AddCarForm';
import { TrackedCarsTable } from '@/components/dashboard/TrackedCarsTable';
import { VehicleLookup } from '@/components/dashboard/VehicleLookup';
import { useSubscription } from '@/hooks/use-subscription';
import { useTrackedCars } from '@/hooks/use-tracked-cars';
import * as z from "zod";

const carSchema = z.object({
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  engineType: z.string().min(1, "Engine type is required"),
  mileage: z.string().optional(),
  year: z.string().optional(),
  color: z.string().optional(),
});

const Dashboard = () => {
  const [isAddingCar, setIsAddingCar] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'lookup'>('form');
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
    addCar,
    deleteCar,
    addTag,
    removeTag,
    refreshCars
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
          description: `You've reached your limit of ${userSubscription?.urls_limit} vehicles. Please contact support to add more.`,
          variant: "destructive"
        });
        return;
      }

      const success = await addCar({
        brand: values.brand,
        model: values.model,
        engineType: values.engineType,
        mileage: values.mileage,
        year: values.year,
        color: values.color
      });
      
      if (success) {
        refreshSubscription();
        toast({
          title: "Vehicle added",
          description: "The vehicle has been added to your tracking list."
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add vehicle. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsAddingCar(false);
    }
  };

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

  const handleGenerateApiKey = async (): Promise<boolean> => {
    if (!user) return false;
    const success = await generateApiKey();
    if (success) {
      refreshSubscription();
    }
    return success;
  };

  const scrollToAddCarForm = () => {
    document.getElementById('add-car-form')?.scrollIntoView({
      behavior: 'smooth'
    });
    setActiveTab('form');
  };
  
  const scrollToVehicleLookup = () => {
    document.getElementById('vehicle-lookup')?.scrollIntoView({
      behavior: 'smooth'
    });
    setActiveTab('lookup');
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
      <Navbar />
      
      <main className="flex-grow py-16 container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <DashboardHeader 
            userName={user?.user_metadata?.full_name} 
            userEmail={user?.email}
            isPro={userSubscription?.plan !== 'free'}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <SubscriptionCard 
              plan={userSubscription?.plan}
              urls_limit={userSubscription?.urls_limit}
              trackedUrlsCount={trackedCars.length}
              onRefreshSubscription={manuallyRefreshSubscription}
            />
            
            <QuickActionsCard 
              canAddMoreCars={canAddMoreCars}
              onAddCarClick={scrollToAddCarForm}
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
          
          <div className="mb-6">
            <div className="flex border-b border-gray-200 mb-6">
              <button
                className={`py-2 px-4 text-center ${activeTab === 'form' ? 'border-b-2 border-primary font-medium text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('form')}
              >
                Add Vehicle Manually
              </button>
              <button
                className={`py-2 px-4 text-center ${activeTab === 'lookup' ? 'border-b-2 border-primary font-medium text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('lookup')}
              >
                DVLA Registration Lookup
              </button>
            </div>
            
            <div className={activeTab === 'form' ? 'block' : 'hidden'}>
              <AddCarForm 
                onSubmit={onSubmitCar}
                isAddingCar={isAddingCar}
                canAddMoreCars={canAddMoreCars}
              />
            </div>
            
            <div id="vehicle-lookup" className={activeTab === 'lookup' ? 'block' : 'hidden'}>
              <VehicleLookup 
                userId={user?.id}
                onCarAdded={handleCarAdded}
              />
            </div>
          </div>
          
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
