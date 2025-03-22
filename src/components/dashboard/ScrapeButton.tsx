
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Globe, Loader2 } from "lucide-react";
import { ScrapedListingsDialog } from "./ScrapedListingsDialog";
import { TrackedCar, ScrapedListing } from "@/hooks/use-tracked-cars";

interface ScrapeButtonProps {
  car: TrackedCar;
  listings: ScrapedListing[];
  onTriggerScraping: (carId: string) => Promise<ScrapedListing[]>;
  isScrapingCar: boolean;
}

export function ScrapeButton({ car, listings, onTriggerScraping, isScrapingCar }: ScrapeButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleClick = async () => {
    setIsDialogOpen(true);
    if (!listings || listings.length === 0) {
      await handleRefresh();
    }
  };
  
  const handleRefresh = async () => {
    setIsLoading(true);
    await onTriggerScraping(car.id);
    setIsLoading(false);
  };
  
  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleClick}
        disabled={isScrapingCar}
      >
        {isScrapingCar ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <Globe className="h-4 w-4 mr-1" />
        )}
        Find Similar
      </Button>
      
      <ScrapedListingsDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        car={car}
        listings={listings}
        isLoading={isLoading}
        onRefresh={handleRefresh}
      />
    </>
  );
}
