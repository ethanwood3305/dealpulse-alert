
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ExternalLink, CheckCircle, AlertTriangle } from "lucide-react";
import { TrackedCar, ScrapedListing } from "@/hooks/use-tracked-cars";
import { formatDistanceToNow } from "date-fns";

interface ScrapedListingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: TrackedCar;
  listings: ScrapedListing[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function ScrapedListingsDialog({
  isOpen,
  onClose,
  car,
  listings,
  isLoading,
  onRefresh
}: ScrapedListingsDialogProps) {
  const cheapestPrice = car.cheapest_price || car.last_price;
  const targetPrice = car.last_price;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center justify-between">
            <span>Similar Vehicles</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Refresh Search
            </Button>
          </DialogTitle>
          <DialogDescription>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline">{car.brand}</Badge>
              <Badge variant="outline">{car.model}</Badge>
              {car.engineType && <Badge variant="outline">{car.engineType}</Badge>}
              {car.year && <Badge variant="outline">Year: {car.year}</Badge>}
              {car.mileage && <Badge variant="outline">Miles: {car.mileage}</Badge>}
              {car.color && <Badge variant="outline">{car.color}</Badge>}
            </div>
            <div className="text-sm mt-2">
              Showing real vehicle listings from dealer websites.
            </div>
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Searching dealer sites for similar vehicles...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-10">
            <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
            <p className="text-muted-foreground">No similar vehicles found in our real-time search.</p>
            <p className="text-sm text-muted-foreground mt-2">
              This could be due to the specific vehicle details or limited availability.
              Try adjusting your search criteria or click refresh to search again.
            </p>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <Alert className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-600 dark:text-green-400">
                Found {listings.length} real {listings.length === 1 ? 'vehicle' : 'vehicles'} from dealer websites.
              </AlertDescription>
            </Alert>
            
            {listings.map((listing) => {
              const isPriceBetter = listing.price < (targetPrice || Infinity);
              const priceDifference = targetPrice ? targetPrice - listing.price : 0;
              const percentageDiff = targetPrice ? (priceDifference / targetPrice) * 100 : 0;
              
              return (
                <div 
                  key={listing.id} 
                  className="rounded-lg border p-4 transition-colors bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-base">{listing.title}</h4>
                      <p className="text-sm text-muted-foreground">{listing.dealer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-green-600 dark:text-green-400">
                        £{listing.price.toLocaleString()}
                      </p>
                      {isPriceBetter && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          <a href={listing.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {percentageDiff.toFixed(1)}% cheaper - View Deal
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                    <div className="text-xs">
                      <span className="font-medium">Mileage:</span> {listing.mileage.toLocaleString()} miles
                    </div>
                    <div className="text-xs">
                      <span className="font-medium">Year:</span> {listing.year}
                    </div>
                    <div className="text-xs">
                      <span className="font-medium">Color:</span> {listing.color}
                    </div>
                    <div className="text-xs">
                      <span className="font-medium">Location:</span> {listing.location}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3">
                    <div className="text-xs text-muted-foreground">
                      Found {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
                    </div>
                    <Button size="sm" variant="ghost" asChild>
                      <a href={listing.url} target="_blank" rel="noopener noreferrer">
                        View <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
