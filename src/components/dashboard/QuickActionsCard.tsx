
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { PlusCircle, Tag } from "lucide-react";

interface QuickActionsCardProps {
  canAddMoreUrls: boolean;
  onAddUrlClick: () => void;
}

export const QuickActionsCard = ({ canAddMoreUrls, onAddUrlClick }: QuickActionsCardProps) => {
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button 
            onClick={onAddUrlClick} 
            variant="outline" 
            className="h-20 flex flex-col items-center justify-center" 
            disabled={!canAddMoreUrls}
          >
            <PlusCircle className="h-5 w-5 mb-2" />
            <span className="font-medium">Add URL to Monitor</span>
            <span className="text-xs text-muted-foreground mt-1">Track competitor prices</span>
          </Button>
          <Link to="/pricing" className="w-full">
            <Button variant="outline" className="h-20 w-full flex flex-col items-center justify-center">
              <Tag className="h-5 w-5 mb-2" />
              <span className="font-medium">View Plans</span>
              <span className="text-xs text-muted-foreground mt-1">Compare subscription options</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
