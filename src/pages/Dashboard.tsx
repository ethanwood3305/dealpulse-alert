
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SubscriptionCard } from '@/components/dashboard/SubscriptionCard';
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';
import { TrackedCarsTable } from '@/components/dashboard/TrackedCarsTable';
import { VehicleLookup } from '@/components/dashboard/VehicleLookup';
import { useSubscription } from '@/hooks/use-subscription';
import { useTrackedCars } from '@/hooks/use-tracked-cars';
import { useOrganization } from '@/hooks/use-organization';
import { OrganizationSelector } from '@/components/dashboard/OrganizationSelector';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [rlsError, setRlsError] = useState(false);
  const navigate = useNavigate();
  
  console.log('[Dashboard] Component rendering, user:', user?.id);
  
  const { 
    userSubscription, 
    canAddMoreUrls: canAddMoreCars, 
    isLoading: isLoadingSubscription,
    refreshSubscription,
    generateApiKey
  } = useSubscription(user?.id);
  
  console.log('[Dashboard] useSubscription hook returned:', { 
    plan: userSubscription?.plan,
    isLoadingSubscription,
    canAddMoreCars
  });
  
  const {
    currentOrganization,
    organizations,
    isLoading: isLoadingOrganizations,
    isFixingRLS,
    switchOrganization,
    createOrganization,
    fixRLSPolicies
  } = useOrganization(user?.id);
  
  console.log('[Dashboard] useOrganization hook returned:', { 
    currentOrganizationId: currentOrganization?.id,
    organizationsCount: organizations?.length,
    isLoadingOrganizations
  });
  
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
    getListingsForCar,
    addCar
  } = useTrackedCars(user?.id, currentOrganization?.id);
  
  console.log('[Dashboard] useTrackedCars hook returned:', { 
    trackedCarsCount: trackedCars?.length,
    isLoadingCars,
    currentOrgId: currentOrganization?.id
  });

  const isLoading = !initialLoadComplete && (isLoadingSubscription || isLoadingCars || isLoadingOrganizations);
  console.log('[Dashboard] Overall loading state:', isLoading);

  const handleFixRLS = async () => {
    if (!user) return;
    
    try {
      const success = await fixRLSPolicies();
      
      if (success) {
        toast({
          title: "Success",
          description: "Permission issues fixed. Please wait while we reload your data."
        });
        setRlsError(false);
        
        // Refresh the data after fixing RLS
        if (user?.id) {
          refreshCars();
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to fix permission issues. Please contact support.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fixing RLS policies:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    // Check for RLS errors or if organizations couldn't be loaded
    if (initialLoadComplete && !isLoadingOrganizations && organizations.length === 0 && user?.id) {
      setRlsError(true);
    } else if (organizations.length > 0) {
      setRlsError(false);
    }
  }, [isLoadingOrganizations, organizations, user, initialLoadComplete]);

  useEffect(() => {
    const checkAuth = async () => {
      console.log('[Dashboard] Checking authentication status');
      const { data, error } = await supabase.auth.getUser();
      
      console.log('[Dashboard] Auth check response:', { userData: data?.user, error });
      
      if (error || !data?.user) {
        console.log('[Dashboard] No authenticated user found, redirecting to login');
        navigate('/login');
        return;
      }
      
      console.log('[Dashboard] User authenticated:', data.user);
      setUser(data.user);
    };
    
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Dashboard] Auth state changed:', { event, sessionExists: !!session });
      if (!session) {
        console.log('[Dashboard] Session ended, redirecting to login');
        navigate('/login');
      }
    });
    
    return () => {
      console.log('[Dashboard] Cleaning up auth listener');
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [navigate]);

  useEffect(() => {
    console.log('[Dashboard] Checking if initial load is complete:', { 
      isLoadingSubscription, 
      isLoadingCars, 
      isLoadingOrganizations, 
      initialLoadComplete 
    });
    
    if (!isLoadingSubscription && !isLoadingCars && !isLoadingOrganizations && !initialLoadComplete) {
      console.log('[Dashboard] Initial load complete, updating state');
      setInitialLoadComplete(true);
    }
  }, [isLoadingSubscription, isLoadingCars, isLoadingOrganizations, initialLoadComplete]);

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

  const handleAddCar = async (car: any) => {
    if (!currentOrganization) {
      toast({
        title: "No dealership assigned",
        description: "Please create or select a dealership first before adding vehicles.",
        variant: "destructive"
      });
      return false;
    }
    
    console.log('Adding car with organization:', currentOrganization.id, car);
    return await addCar({
      ...car,
      organization_id: currentOrganization.id
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
      <SEO 
        title="Dashboard | Carparison"
        description="Monitor your tracked vehicles, manage your subscription, and get real-time price alerts for your competitors' listings in one convenient dashboard."
        canonicalUrl="https://carparison.app/dashboard"
      />
      <Navbar />
      
      <main className="flex-grow py-16 container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {rlsError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Permission Error</AlertTitle>
              <AlertDescription className="flex items-center gap-2">
                There was an error loading your organization data. 
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleFixRLS} 
                  disabled={isFixingRLS}
                  className="ml-2"
                >
                  {isFixingRLS ? 'Fixing...' : 'Fix Permissions'}
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between">
            <DashboardHeader 
              userName={user?.user_metadata?.full_name} 
              userEmail={user?.email}
              isPro={userSubscription?.plan !== 'free'}
            />
            
            <div className="mt-4 md:mt-0">
              <OrganizationSelector
                organizations={organizations}
                currentOrganization={currentOrganization}
                onSwitchOrganization={switchOrganization}
                onCreateOrganization={createOrganization}
              />
            </div>
          </div>
          
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
          
          <div id="vehicle-lookup" className="mb-10">
            <VehicleLookup 
              userId={user?.id}
              onCarAdded={handleCarAdded}
              addCar={handleAddCar}
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
