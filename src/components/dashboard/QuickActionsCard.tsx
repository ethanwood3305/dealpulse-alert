
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Car } from "lucide-react";

interface QuickActionsCardProps {
  canAddMoreCars: boolean;
  onAddCarClick: () => void;
}

export const QuickActionsCard = ({ canAddMoreCars, onAddCarClick }: QuickActionsCardProps) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and actions</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={onAddCarClick}
          disabled={!canAddMoreCars}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Car
        </Button>
        <Button variant="outline" className="w-full justify-start">
          <Car className="mr-2 h-4 w-4" />
          View Car Trends
        </Button>
      </CardContent>
    </Card>
  );
};
