
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { ScrapedListing } from "@/integrations/supabase/database.types";
import { TrackedCar } from "@/hooks/use-tracked-cars";
import { ScrapedListingsDialog } from "./ScrapedListingsDialog";
import { Badge } from "@/components/ui/badge";

interface ScrapeButtonProps {
  car: TrackedCar;
  listings: ScrapedListing[];
  onTriggerScraping: (carId: string) => Promise<ScrapedListing[]>;
  isScrapingCar: boolean;
}

export function ScrapeButton({ car, listings, onTriggerScraping, isScrapingCar }: ScrapeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = async () => {
    if (isScrapingCar) return;
    
    try {
      await onTriggerScraping(car.id);
      setIsOpen(true);
    } catch (error) {
      console.error("Error triggering scraping:", error);
    }
  };

  const hasListings = listings && listings.length > 0;
  const listingCount = hasListings ? listings.length : 0;
  
  const getStatusDisplay = () => {
    if (isScrapingCar) {
      return (
        <Button variant="outline" size="sm" disabled>
          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
          Searching...
        </Button>
      );
    }
    
    if (hasListings) {
      return (
        <div className="flex items-center">
          <Button variant="outline" size="sm" onClick={handleClick} className="relative">
            <Search className="h-3.5 w-3.5 mr-1" />
            Find Cheapest
            {listingCount > 0 && (
              <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {listingCount}
              </Badge>
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsOpen(true)}
            className="ml-1"
          >
            View
          </Button>
        </div>
      );
    }
    
    return (
      <Button variant="outline" size="sm" onClick={handleClick}>
        <Search className="h-3.5 w-3.5 mr-1" />
        Find Cheapest
      </Button>
    );
  };

  return (
    <>
      {getStatusDisplay()}
      
      <ScrapedListingsDialog 
        listingData={listings || []}
        open={isOpen} 
        onOpenChange={setIsOpen}
      />
    </>
  );
}
