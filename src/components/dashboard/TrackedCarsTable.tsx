
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrashIcon, MapPinIcon, ChevronUp, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { TrackedCar } from "@/hooks/use-tracked-cars";
import { TagInput } from "./TagInput";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import { useState } from "react";

interface TrackedCarsTableProps {
  trackedCars: TrackedCar[];
  onDelete: (id: string) => Promise<boolean>;
  onAddTag: (carId: string, tag: string) => Promise<void>;
  onRemoveTag: (carId: string, tag: string) => Promise<void>;
  carsLimit: number | undefined;
}

type SortField = 'brand' | 'model' | 'year' | 'mileage' | 'created_at' | 'tags';
type SortDirection = 'asc' | 'desc';

export const TrackedCarsTable = ({ 
  trackedCars, 
  onDelete,
  onAddTag,
  onRemoveTag,
  carsLimit = 1
}: TrackedCarsTableProps) => {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  if (trackedCars.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tracked Vehicles</CardTitle>
          <CardDescription>You're not tracking any vehicles yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add a vehicle above to start tracking competitor prices.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedCars = [...trackedCars].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    
    switch (sortField) {
      case 'brand':
        return (a.brand || '').localeCompare(b.brand || '') * direction;
      case 'model':
        return (a.model || '').localeCompare(b.model || '') * direction;
      case 'year':
        return ((a.year || '0').localeCompare(b.year || '0')) * direction;
      case 'mileage':
        return ((parseInt(a.mileage || '0') - parseInt(b.mileage || '0'))) * direction;
      case 'tags':
        return ((a.tags?.length || 0) - (b.tags?.length || 0)) * direction;
      case 'created_at':
      default:
        return (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) * (sortDirection === 'asc' ? -1 : 1);
    }
  });

  const handleDelete = async (id: string) => {
    try {
      const success = await onDelete(id);
      if (!success) {
        toast({
          title: "Error",
          description: "Failed to delete vehicle. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      toast({
        title: "Error",
        description: "Failed to delete vehicle. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleViewOnMap = (car: TrackedCar) => {
    const basePrice = car.year ? parseInt(car.year) * 100 : 10000;
    const mileageAdjustment = car.mileage ? -parseInt(car.mileage) * 0.05 : 0;
    const estimatedTargetPrice = Math.max(5000, basePrice + mileageAdjustment);
    
    navigate(`/radius-map?car=${encodeURIComponent(car.id)}&targetPrice=${estimatedTargetPrice}`);
  };

  const SortButton = ({ field }: { field: SortField }) => {
    const isActive = sortField === field;
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className="ml-2 px-0 h-4"
        onClick={() => handleSort(field)}
      >
        {isActive && sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : null}
        {isActive && sortDirection === 'desc' ? <ChevronDown className="h-4 w-4" /> : null}
        {!isActive ? <ChevronUp className="h-4 w-4 opacity-20" /> : null}
      </Button>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tracked Vehicles</CardTitle>
        <CardDescription>Your tracked competitor vehicle models</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="flex items-center">
                  Brand
                  <SortButton field="brand" />
                </TableHead>
                <TableHead className="flex items-center">
                  Model
                  <SortButton field="model" />
                </TableHead>
                <TableHead>Engine Type</TableHead>
                <TableHead className="flex items-center">
                  Year
                  <SortButton field="year" />
                </TableHead>
                <TableHead>Color</TableHead>
                <TableHead className="flex items-center">
                  Mileage
                  <SortButton field="mileage" />
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Price</TableHead>
                <TableHead>Last Checked</TableHead>
                <TableHead className="flex items-center">
                  Tags
                  <SortButton field="tags" />
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCars.map((car, index) => {
                const isActive = index < (carsLimit || 0);
                
                return (
                  <TableRow key={car.id} className={!isActive ? "opacity-70" : ""}>
                    <TableCell className="font-medium">{car.brand || 'N/A'}</TableCell>
                    <TableCell>{car.model || 'N/A'}</TableCell>
                    <TableCell>{car.engineType || 'N/A'}</TableCell>
                    <TableCell>{car.year || 'N/A'}</TableCell>
                    <TableCell>{car.color || 'N/A'}</TableCell>
                    <TableCell>{car.mileage || 'N/A'}</TableCell>
                    <TableCell>
                      {isActive ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                          Not Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {isActive ? (
                        car.last_price ? (
                          <span className="font-mono">${car.last_price.toFixed(2)}</span>
                        ) : (
                          <span className="text-muted-foreground">Pending</span>
                        )
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isActive ? (
                        car.last_checked ? (
                          format(new Date(car.last_checked), 'MMM d, yyyy h:mm a')
                        ) : (
                          <span className="text-muted-foreground">Not checked yet</span>
                        )
                      ) : (
                        <span className="text-muted-foreground">Inactive</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <TagInput 
                        urlId={car.id}
                        existingTags={car.tags || []}
                        onAddTag={onAddTag}
                        onRemoveTag={onRemoveTag}
                      />
                    </TableCell>
                    <TableCell className="text-right flex items-center justify-end space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleViewOnMap(car)}
                        title="View on radius map"
                      >
                        <MapPinIcon className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this tracked vehicle and remove all associated data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(car.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
