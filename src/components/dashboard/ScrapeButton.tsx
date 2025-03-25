
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Globe, Loader2 } from "lucide-react";
import { ScrapedListingsDialog } from "./ScrapedListingsDialog";
import { TrackedCar, ScrapedListing } from "@/hooks/use-tracked-cars";
import { toast } from "@/components/ui/use-toast";

interface ScrapeButtonProps {
  car: TrackedCar;
  listings: ScrapedListing[];
  onTriggerScraping: (carId: string) => Promise<ScrapedListing[]>;
  isScrapingCar: boolean;
}

export function ScrapeButton({ car, listings, onTriggerScraping, isScrapingCar }: ScrapeButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const handleClick = async () => {
    setIsDialogOpen(true);
    if (!listings || listings.length === 0) {
      await handleRefresh();
    }
  };
  
  const handleRefresh = async () => {
    setIsLoading(true);
    setHasError(false);
    
    try {
      await onTriggerScraping(car.id);
    } catch (error) {
      console.error("Error triggering scraping:", error);
      setHasError(true);
      toast({
        title: "Search Error",
        description: "We encountered an error while searching for vehicles. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleClick}
        disabled={isScrapingCar}
        title="Find the cheapest similar vehicle online"
      >
        {isScrapingCar ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <Globe className="h-4 w-4 mr-1" />
        )}
        Find Cheapest
      </Button>
      
      <ScrapedListingsDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        car={car}
        listings={listings}
        isLoading={isLoading}
        hasError={hasError}
        onRefresh={handleRefresh}
      />
    </>
  );
}
