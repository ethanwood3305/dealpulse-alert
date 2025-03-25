
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ExternalLink, CheckCircle, AlertTriangle, RotateCw } from "lucide-react";
import { TrackedCar, ScrapedListing } from "@/hooks/use-tracked-cars";
import { formatDistanceToNow } from "date-fns";

interface ScrapedListingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: TrackedCar;
  listings: ScrapedListing[];
  isLoading: boolean;
  hasError?: boolean;
  onRefresh: () => void;
}

export function ScrapedListingsDialog({
  isOpen,
  onClose,
  car,
  listings,
  isLoading,
  hasError = false,
  onRefresh
}: ScrapedListingsDialogProps) {
  const targetPrice = car.last_price;
  const cheapestListing = listings.length > 0 ? listings[0] : null;
  
  // Determine if user's price is cheapest by comparing with listing price
  const isUserCheapest = targetPrice !== null && cheapestListing !== null && 
    targetPrice <= cheapestListing.price;
  
  const lastCheckedText = car.last_checked ? 
    `Last checked ${formatDistanceToNow(new Date(car.last_checked), { addSuffix: true })}` :
    "Never checked before";
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center justify-between">
            <span>Similar Vehicles</span>
            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground">{lastCheckedText}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRefresh}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCw className="h-4 w-4 mr-2" />}
                Refresh Search
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline">{car.brand}</Badge>
              <Badge variant="outline">{car.model}</Badge>
              {car.engineType && <Badge variant="outline">{car.engineType}</Badge>}
              {car.year && <Badge variant="outline">Year: {car.year}</Badge>}
              {car.mileage && <Badge variant="outline">Miles: {car.mileage}</Badge>}
              {car.color && <Badge variant="outline">{car.color}</Badge>}
              {car.trim && <Badge variant="outline">Trim: {car.trim}</Badge>}
            </div>
            <div className="text-sm mt-2">
              Showing the cheapest vehicle from dealer websites.
            </div>
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Searching dealer sites for similar vehicles...</p>
            <p className="text-xs text-muted-foreground mt-2">This may take up to 30 seconds</p>
          </div>
        ) : hasError ? (
          <div className="text-center py-10">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground">There was an error searching for similar vehicles.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please try again later or contact support if the problem persists.
            </p>
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
                Found the cheapest similar vehicle from dealer websites.
                {cheapestListing && (
                  <span className="font-semibold ml-1">
                    <a 
                      href={cheapestListing.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      Price: £{cheapestListing.price.toLocaleString()}
                    </a>
                  </span>
                )}
              </AlertDescription>
            </Alert>
            
            {cheapestListing && (
              <div 
                className="rounded-lg border p-4 transition-colors bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-base">{cheapestListing.title}</h4>
                    <p className="text-sm text-muted-foreground">{cheapestListing.dealer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-green-600 dark:text-green-400">
                      £{cheapestListing.price.toLocaleString()}
                    </p>
                    {targetPrice && cheapestListing.price < targetPrice && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        <a href={cheapestListing.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {(((targetPrice - cheapestListing.price) / targetPrice) * 100).toFixed(1)}% cheaper - View Deal
                        </a>
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                  <div className="text-xs">
                    <span className="font-medium">Mileage:</span> {cheapestListing.mileage.toLocaleString()} miles
                  </div>
                  <div className="text-xs">
                    <span className="font-medium">Year:</span> {cheapestListing.year}
                  </div>
                  <div className="text-xs">
                    <span className="font-medium">Color:</span> {cheapestListing.color}
                  </div>
                  <div className="text-xs">
                    <span className="font-medium">Location:</span> {cheapestListing.location}
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-3">
                  <div className="text-xs text-muted-foreground">
                    Found {formatDistanceToNow(new Date(cheapestListing.created_at), { addSuffix: true })}
                  </div>
                  <Button size="sm" variant="ghost" asChild>
                    <a href={cheapestListing.url} target="_blank" rel="noopener noreferrer">
                      View <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
