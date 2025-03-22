
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Car } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickActionsCardProps {
  canAddMoreCars: boolean;
  onAddCarClick: () => void;
  selectedCar?: {
    id: string;
    brand: string;
    model: string;
    lastPrice?: number;
  } | null;
}

export const QuickActionsCard = ({ 
  canAddMoreCars, 
  onAddCarClick, 
  selectedCar 
}: QuickActionsCardProps) => {
  const navigate = useNavigate();

  const handleViewTrends = () => {
    if (selectedCar) {
      navigate(`/radius-map?car=${selectedCar.id}&targetPrice=${selectedCar.lastPrice || 10000}`);
    } else {
      navigate('/radius-map');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and actions</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-1">
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={onAddCarClick}
          disabled={!canAddMoreCars}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Car
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={handleViewTrends}
          disabled={!selectedCar}
        >
          <Car className="mr-2 h-4 w-4" />
          View Car Trends
        </Button>
        
        {selectedCar && (
          <div className="mt-2 p-3 bg-muted/50 rounded-md">
            <p className="text-sm font-medium">Selected Car:</p>
            <p className="text-sm">{selectedCar.brand} {selectedCar.model}</p>
            {selectedCar.lastPrice && (
              <p className="text-sm mt-1">
                <span className="font-medium">Target Price:</span> £{selectedCar.lastPrice.toLocaleString()}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
