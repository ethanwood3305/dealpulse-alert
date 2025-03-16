
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MoreVertical, Trash2, RefreshCw, PlusCircle, Tag, ArrowUpRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import SubscriptionCheckout from "@/components/SubscriptionCheckout";

interface UserSubscription {
  plan: string;
  urls_limit: number;
}

interface TrackedUrl {
  id: string;
  url: string;
  last_price: number | null;
  last_checked: string | null;
  created_at: string;
}

const urlSchema = z.object({
  url: z.string()
    .url("Please enter a valid URL")
    .min(5, "URL must be at least 5 characters")
});

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [trackedUrls, setTrackedUrls] = useState<TrackedUrl[]>([]);
  const [user, setUser] = useState<any>(null);
  const [canAddMoreUrls, setCanAddMoreUrls] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof urlSchema>>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      url: ""
    }
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        navigate('/login');
        return;
      }
      
      setUser(data.user);
      
      // Check for checkout status in the URL
      const searchParams = new URLSearchParams(location.search);
      const checkoutStatus = searchParams.get('checkout');
      
      if (checkoutStatus === 'success') {
        toast({
          title: "Subscription successful!",
          description: "Thank you for subscribing to DealPulse Alert. Your subscription is now active.",
        });
        // Clear the URL parameter
        navigate('/dashboard', { replace: true });
      }
      
      // Fetch user's subscription details
      await fetchSubscriptionData(data.user.id);
      
      // Fetch user's tracked URLs
      await fetchTrackedUrls(data.user.id);
      
      setIsLoading(false);
    };
    
    checkAuth();

    // Listen for auth state changes
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
  }, [navigate, location.search]);
  
  const fetchSubscriptionData = async (userId: string) => {
    try {
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .rpc('get_user_subscription', { user_uuid: userId });
        
      if (subscriptionError) {
        toast({
          title: "Error",
          description: "Failed to load subscription details. Please try again later.",
          variant: "destructive",
        });
      } else if (subscriptionData && subscriptionData.length > 0) {
        setUserSubscription({
          plan: subscriptionData[0].plan,
          urls_limit: subscriptionData[0].urls_limit
        });
      }

      // Check if user can add more URLs
      const { data: canAddMoreData, error: canAddMoreError } = await supabase
        .rpc('can_add_more_urls', { user_uuid: userId });
      
      if (!canAddMoreError) {
        setCanAddMoreUrls(canAddMoreData);
      }
    } catch (error) {
      console.error("Error fetching subscription data:", error);
    }
  };

  const fetchTrackedUrls = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('tracked_urls')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setTrackedUrls(data || []);
    } catch (error) {
      console.error("Error fetching tracked URLs:", error);
      toast({
        title: "Error",
        description: "Failed to load your tracked URLs. Please try again later.",
        variant: "destructive",
      });
    }
  };
  
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: "There was an error signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onSubmitUrl = async (values: z.infer<typeof urlSchema>) => {
    if (!user) return;
    
    setIsAddingUrl(true);
    
    try {
      // Check if user can add more URLs
      const { data: canAddMore, error: checkError } = await supabase
        .rpc('can_add_more_urls', { user_uuid: user.id });
      
      if (checkError) {
        throw checkError;
      }
      
      if (!canAddMore) {
        toast({
          title: "Limit reached",
          description: `You've reached your limit of ${userSubscription?.urls_limit} URLs. Please upgrade your plan to add more.`,
          variant: "destructive",
        });
        return;
      }
      
      // Add the URL
      const { data, error } = await supabase
        .from('tracked_urls')
        .insert({
          user_id: user.id,
          url: values.url
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      // Refresh the list
      await fetchTrackedUrls(user.id);
      
      // Refresh can add more status
      await fetchSubscriptionData(user.id);
      
      // Reset the form
      form.reset();
      
      toast({
        title: "URL added",
        description: "The URL has been added to your tracking list.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add URL. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsAddingUrl(false);
    }
  };

  const handleDeleteUrl = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('tracked_urls')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Refresh the list
      await fetchTrackedUrls(user.id);
      
      // Refresh can add more status
      await fetchSubscriptionData(user.id);
      
      toast({
        title: "URL removed",
        description: "The URL has been removed from your tracking list.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove URL. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'pro':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-800';
      case 'basic':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
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

  const renderUpgradeCard = () => {
    if (userSubscription?.plan === 'pro') {
      return null;
    }

    const nextPlan = userSubscription?.plan === 'basic' ? 'pro' : 'basic';
    const planFeatures = {
      basic: {
        name: 'Basic',
        urls: '5 URLs',
        price: '$5/month',
        features: ['Daily price checks', '30-day price history', 'Email alerts', 'Competitor tagging']
      },
      pro: {
        name: 'Pro',
        urls: '10 URLs',
        price: '$15/month',
        features: ['Hourly price checks', '90-day price history', 'Email & SMS alerts', 'API access']
      }
    };

    const plan = planFeatures[nextPlan as keyof typeof planFeatures];

    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Upgrade to {plan.name}</CardTitle>
          <CardDescription>Get more features and track more competitors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Price:</span>
              <span>{plan.price}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">URLs Limit:</span>
              <span>{plan.urls}</span>
            </div>
            <div className="mt-4">
              <h4 className="font-medium mb-2">Features:</h4>
              <ul className="list-disc list-inside space-y-1">
                {plan.features.map((feature, index) => (
                  <li key={index} className="text-sm">{feature}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <SubscriptionCheckout 
            plan={nextPlan} 
            className="w-full rounded-full"
          />
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-16 container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome, {user?.user_metadata?.full_name || user?.email}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="mt-4 md:mt-0"
            >
              Sign Out
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Your subscription details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Plan:</span>
                    <Badge className={`capitalize ${getPlanColor(userSubscription?.plan || 'free')}`}>
                      {userSubscription?.plan || 'Free'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">URL Monitoring Limit:</span>
                    <span>{userSubscription?.urls_limit || 1}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">URLs Used:</span>
                    <span>{trackedUrls.length} / {userSubscription?.urls_limit || 1}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button 
                    onClick={() => document.getElementById('add-url-form')?.scrollIntoView({ behavior: 'smooth' })}
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center"
                    disabled={!canAddMoreUrls}
                  >
                    <PlusCircle className="h-5 w-5 mb-2" />
                    <span className="font-medium">Add URL to Monitor</span>
                    <span className="text-xs text-muted-foreground mt-1">Track competitor prices</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => window.location.href = "/pricing"}
                  >
                    <Tag className="h-5 w-5 mb-2" />
                    <span className="font-medium">View Plans</span>
                    <span className="text-xs text-muted-foreground mt-1">Compare subscription options</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {renderUpgradeCard()}
          
          <Card className="mb-10">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Add a URL to Track</CardTitle>
                <CardDescription>Enter a competitor's product URL to monitor</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form 
                  id="add-url-form"
                  onSubmit={form.handleSubmit(onSubmitUrl)} 
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Product URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/product" 
                            {...field} 
                            disabled={isAddingUrl || !canAddMoreUrls}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the full URL of the product you want to track
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="self-end" 
                    disabled={isAddingUrl || !canAddMoreUrls}
                  >
                    {isAddingUrl ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>Add URL</>
                    )}
                  </Button>
                </form>
              </Form>
              {!canAddMoreUrls && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400">
                  <p className="text-sm">
                    You've reached your URL tracking limit. Please remove some URLs or upgrade your plan to add more.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Tracked URLs</CardTitle>
                  <CardDescription>Websites you're currently monitoring</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {trackedUrls.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>URL</TableHead>
                        <TableHead>Last Price</TableHead>
                        <TableHead>Last Checked</TableHead>
                        <TableHead>Added</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trackedUrls.map((url) => (
                        <TableRow key={url.id}>
                          <TableCell className="font-medium truncate max-w-[200px]">
                            <a 
                              href={url.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center hover:text-primary"
                            >
                              {url.url}
                              <ArrowUpRight className="h-3 w-3 ml-1 inline" />
                            </a>
                          </TableCell>
                          <TableCell>
                            {url.last_price ? `$${url.last_price.toFixed(2)}` : "Not checked yet"}
                          </TableCell>
                          <TableCell>
                            {formatDate(url.last_checked)}
                          </TableCell>
                          <TableCell>
                            {new Date(url.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleDeleteUrl(url.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">You're not tracking any URLs yet.</p>
                  <p className="text-muted-foreground">Add a URL above to start monitoring competitors.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
