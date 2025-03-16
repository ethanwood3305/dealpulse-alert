
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SubscriptionCard } from '@/components/dashboard/SubscriptionCard';
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';
import { AddUrlForm } from '@/components/dashboard/AddUrlForm';
import { TrackedUrlsTable } from '@/components/dashboard/TrackedUrlsTable';
import { useSubscription } from '@/hooks/use-subscription';
import { useTrackedUrls } from '@/hooks/use-tracked-urls';
import * as z from "zod";

const urlSchema = z.object({
  url: z.string().url("Please enter a valid URL").min(5, "URL must be at least 5 characters")
});

const Dashboard = () => {
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  const { 
    userSubscription, 
    canAddMoreUrls, 
    isLoading: isLoadingSubscription,
    refreshSubscription,
    cancelSubscription
  } = useSubscription(user?.id);
  
  const { 
    trackedUrls, 
    isLoading: isLoadingUrls,
    addUrl,
    deleteUrl,
    addTag,
    removeTag
  } = useTrackedUrls(user?.id);

  const isLoading = isLoadingSubscription || isLoadingUrls;

  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        navigate('/login');
        return;
      }
      setUser(data.user);

      // Check for checkout status in URL and refresh subscription data
      const searchParams = new URLSearchParams(location.search);
      const checkoutStatus = searchParams.get('checkout');
      if (checkoutStatus === 'success') {
        // Refresh the subscription data to get the updated plan
        setTimeout(() => {
          refreshSubscription();
        }, 1000); // Small delay to allow webhook processing
        
        toast({
          title: "Subscription successful!",
          description: "Thank you for subscribing to DealPulse Alert. Your subscription is now active."
        });
        
        // Remove the query parameter but stay on dashboard page
        navigate('/dashboard', { replace: true });
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
  }, [navigate, location.search, refreshSubscription]);

  const onSubmitUrl = async (values: z.infer<typeof urlSchema>) => {
    if (!user) return;
    setIsAddingUrl(true);
    
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
          description: `You've reached your limit of ${userSubscription?.urls_limit} URLs. Please upgrade your plan to add more.`,
          variant: "destructive"
        });
        return;
      }

      const success = await addUrl(values.url);
      if (success) {
        refreshSubscription();
        toast({
          title: "URL added",
          description: "The URL has been added to your tracking list."
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add URL. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsAddingUrl(false);
    }
  };

  const handleDeleteUrl = async (id: string) => {
    if (!user) return;
    const success = await deleteUrl(id);
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

  const handleCancelSubscription = async () => {
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

  const scrollToAddUrlForm = () => {
    document.getElementById('add-url-form')?.scrollIntoView({
      behavior: 'smooth'
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
            isPro={userSubscription?.plan === 'pro'}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <SubscriptionCard 
              plan={userSubscription?.plan}
              urls_limit={userSubscription?.urls_limit}
              trackedUrlsCount={trackedUrls.length}
              onCancelSubscription={handleCancelSubscription}
              hasActiveSubscription={!!userSubscription?.stripe_subscription_id}
            />
            
            <QuickActionsCard 
              canAddMoreUrls={canAddMoreUrls}
              onAddUrlClick={scrollToAddUrlForm}
            />
          </div>
          
          <AddUrlForm 
            onSubmit={onSubmitUrl}
            isAddingUrl={isAddingUrl}
            canAddMoreUrls={canAddMoreUrls}
          />
          
          <TrackedUrlsTable 
            trackedUrls={trackedUrls}
            onDelete={handleDeleteUrl}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
          />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
