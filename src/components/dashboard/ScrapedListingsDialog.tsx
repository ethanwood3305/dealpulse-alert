
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrapedListing } from "@/integrations/supabase/database.types";

interface ScrapedListingsDialogProps {
  listingData: ScrapedListing[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScrapedListingsDialog({ listingData, open, onOpenChange }: ScrapedListingsDialogProps) {
  const handleVisitListing = (url: string) => {
    window.open(url, '_blank');
  };

  if (listingData.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Similar Vehicles Found</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {listingData.map((listing) => (
            <div key={listing.id} className="border rounded-md p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{listing.title}</h3>
                {listing.is_cheapest && (
                  <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    Cheapest
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                <div>
                  <span className="text-muted-foreground mr-1">Price:</span>
                  <span className="font-medium">£{listing.price.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground mr-1">Mileage:</span>
                  <span className="font-medium">{listing.mileage.toLocaleString()} miles</span>
                </div>
                <div>
                  <span className="text-muted-foreground mr-1">Year:</span>
                  <span className="font-medium">{listing.year}</span>
                </div>
                <div>
                  <span className="text-muted-foreground mr-1">Color:</span>
                  <span className="font-medium">{listing.color}</span>
                </div>
              </div>
              
              <div className="text-sm mb-3">
                <span className="text-muted-foreground mr-1">Location:</span>
                <span className="font-medium">{listing.location}</span>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleVisitListing(listing.url)}
                className="w-full"
              >
                View Listing
              </Button>
            </div>
          ))}
        </div>
        
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
