
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
  
  // Check if there are any cheaper vehicles
  const hasCheaperVehicles = listings && listings.length > 0 && listings.some(listing => 
    car.last_price && Number(listing.price) < Number(car.last_price)
  );
  
  // Check if the current car is the cheapest (i.e., no cheaper cars found)
  const isTheCheapestVehicle = car.last_checked && listings && listings.length > 0 && 
    !listings.some(listing => Number(listing.price) < Number(car.last_price || 0));
  
  const handleClick = async () => {
    setIsDialogOpen(true);
    // Only auto-trigger scraping if no listings exist or car has never been checked
    if (!listings || listings.length === 0 || !car.last_checked) {
      await handleRefresh();
    }
  };
  
  const handleRefresh = async () => {
    setIsLoading(true);
    setHasError(false);
    
    try {
      await onTriggerScraping(car.id);
      // No need to throw error here as onTriggerScraping already handles that
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
      <div className="relative">
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={handleClick}
          disabled={isScrapingCar}
          title="Find the lowest price for a similar vehicle online"
          className="whitespace-nowrap"
        >
          {isScrapingCar ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Globe className="h-4 w-4 mr-1" />
          )}
          Find lowest price
        </Button>
        
        {/* Show red notification for cheaper vehicles */}
        {hasCheaperVehicles && !isScrapingCar && !isDialogOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
            !
          </span>
        )}
        
        {/* Show green notification when your car is the cheapest */}
        {isTheCheapestVehicle && !isScrapingCar && !isDialogOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[10px] text-white">
            ✓
          </span>
        )}
      </div>
      
      <ScrapedListingsDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        car={car}
        listings={listings}
        isLoading={isLoading || isScrapingCar} // Show loading if either local or global loading
        hasError={hasError}
        onRefresh={handleRefresh}
      />
    </>
  );
}
