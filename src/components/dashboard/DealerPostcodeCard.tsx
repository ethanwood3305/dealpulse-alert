
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface DealerPostcodeCardProps {
  dealerPostcode: string | null;
  onUpdatePostcode: (postcode: string) => Promise<boolean>;
}

export function DealerPostcodeCard({ dealerPostcode, onUpdatePostcode }: DealerPostcodeCardProps) {
  const [postcode, setPostcode] = useState(dealerPostcode || "");
  const [isUpdating, setIsUpdating] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!postcode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid postcode.",
        variant: "destructive"
      });
      return;
    }
    
    setIsUpdating(true);
    
    try {
      const success = await onUpdatePostcode(postcode);
      if (success) {
        toast({
          title: "Success",
          description: "Dealer postcode has been updated successfully."
        });
      } else {
        setPostcode(dealerPostcode || "");
        toast({
          title: "Error",
          description: "Failed to update dealer postcode.",
          variant: "destructive"
        });
      }
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Dealer Location
        </CardTitle>
        <CardDescription>
          Set your dealer postcode to enable radius pricing on the map
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dealerPostcode">Dealer Postcode</Label>
            <div className="flex gap-2">
              <Input
                id="dealerPostcode"
                placeholder="e.g. SW1A 1AA"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
          
          {dealerPostcode && (
            <div className="text-sm text-muted-foreground">
              Current dealer postcode: <span className="font-medium">{dealerPostcode}</span>
            </div>
          )}
          
          <div className="text-sm text-muted-foreground pt-2">
            Setting your dealer postcode enables the radius pricing map to show competitive 
            areas based on your location.
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
