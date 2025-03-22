
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrashIcon, MapPinIcon, ChevronUp, ChevronDown, Pencil } from "lucide-react";
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
import { EditVehicleDialog } from "./EditVehicleDialog";

interface TrackedCarsTableProps {
  trackedCars: TrackedCar[];
  onDelete: (id: string) => Promise<boolean>;
  onAddTag: (carId: string, tag: string) => Promise<void>;
  onRemoveTag: (carId: string, tag: string) => Promise<void>;
  onUpdateDetails?: (carId: string, mileage: string, price: string) => Promise<boolean>;
  carsLimit: number | undefined;
}

type SortField = 'brand' | 'model' | 'year' | 'mileage' | 'created_at' | 'tags' | 'last_price' | 'cheapest_price';
type SortDirection = 'asc' | 'desc';

export const TrackedCarsTable = ({ 
  trackedCars, 
  onDelete,
  onAddTag,
  onRemoveTag,
  onUpdateDetails,
  carsLimit = 1
}: TrackedCarsTableProps) => {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [editCarId, setEditCarId] = useState<string | null>(null);

  const selectedCar = editCarId ? trackedCars.find(car => car.id === editCarId) : null;

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
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedCars = [...trackedCars].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    
    switch (sortField) {
      case 'brand':
        return ((a.brand || '').toLowerCase()).localeCompare((b.brand || '').toLowerCase()) * direction;
      case 'model':
        return ((a.model || '').toLowerCase()).localeCompare((b.model || '').toLowerCase()) * direction;
      case 'year':
        if (!a.year && !b.year) return 0;
        if (!a.year) return 1 * direction;
        if (!b.year) return -1 * direction;
        return (a.year.localeCompare(b.year)) * direction;
      case 'mileage':
        const mileageA = a.mileage ? parseInt(a.mileage) : 0;
        const mileageB = b.mileage ? parseInt(b.mileage) : 0;
        return (mileageA - mileageB) * direction;
      case 'last_price':
        const priceA = a.last_price || 0;
        const priceB = b.last_price || 0;
        return (priceA - priceB) * direction;
      case 'cheapest_price':
        const cheapestA = a.cheapest_price || 0;
        const cheapestB = b.cheapest_price || 0;
        return (cheapestA - cheapestB) * direction;
      case 'tags':
        return ((a.tags?.length || 0) - (b.tags?.length || 0)) * direction;
      case 'created_at':
      default:
        return ((new Date(b.created_at).getTime() - new Date(a.created_at).getTime())) * direction;
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

  const handleEditCar = (carId: string) => {
    setEditCarId(carId);
  };

  const handleSaveCarDetails = async (carId: string, mileage: string, price: string) => {
    if (onUpdateDetails) {
      return await onUpdateDetails(carId, mileage, price);
    }
    return false;
  };

  return (
    <>
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
                  <TableHead>
                    <div className="flex items-center">
                      <span>Brand</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-1 p-0 h-4"
                        onClick={() => handleSort('brand')}
                      >
                        {sortField === 'brand' && sortDirection === 'asc' ? 
                          <ChevronUp className="h-4 w-4" /> : 
                          (sortField === 'brand' && sortDirection === 'desc' ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronUp className="h-4 w-4 opacity-20" />)}
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      <span>Model</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-1 p-0 h-4"
                        onClick={() => handleSort('model')}
                      >
                        {sortField === 'model' && sortDirection === 'asc' ? 
                          <ChevronUp className="h-4 w-4" /> : 
                          (sortField === 'model' && sortDirection === 'desc' ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronUp className="h-4 w-4 opacity-20" />)}
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead>Engine Type</TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      <span>Year</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-1 p-0 h-4"
                        onClick={() => handleSort('year')}
                      >
                        {sortField === 'year' && sortDirection === 'asc' ? 
                          <ChevronUp className="h-4 w-4" /> : 
                          (sortField === 'year' && sortDirection === 'desc' ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronUp className="h-4 w-4 opacity-20" />)}
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      <span>Mileage</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-1 p-0 h-4"
                        onClick={() => handleSort('mileage')}
                      >
                        {sortField === 'mileage' && sortDirection === 'asc' ? 
                          <ChevronUp className="h-4 w-4" /> : 
                          (sortField === 'mileage' && sortDirection === 'desc' ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronUp className="h-4 w-4 opacity-20" />)}
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      <span>Current Price</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-1 p-0 h-4"
                        onClick={() => handleSort('last_price')}
                      >
                        {sortField === 'last_price' && sortDirection === 'asc' ? 
                          <ChevronUp className="h-4 w-4" /> : 
                          (sortField === 'last_price' && sortDirection === 'desc' ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronUp className="h-4 w-4 opacity-20" />)}
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      <span>Cheapest Price</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-1 p-0 h-4"
                        onClick={() => handleSort('cheapest_price')}
                      >
                        {sortField === 'cheapest_price' && sortDirection === 'asc' ? 
                          <ChevronUp className="h-4 w-4" /> : 
                          (sortField === 'cheapest_price' && sortDirection === 'desc' ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronUp className="h-4 w-4 opacity-20" />)}
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead>Last Checked</TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      <span>Tags</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-1 p-0 h-4"
                        onClick={() => handleSort('tags')}
                      >
                        {sortField === 'tags' && sortDirection === 'asc' ? 
                          <ChevronUp className="h-4 w-4" /> : 
                          (sortField === 'tags' && sortDirection === 'desc' ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronUp className="h-4 w-4 opacity-20" />)}
                      </Button>
                    </div>
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
                            <span className="font-mono">£{car.last_price.toFixed(2)}</span>
                          ) : (
                            <span className="text-muted-foreground">Pending</span>
                          )
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isActive ? (
                          car.cheapest_price ? (
                            <span className={`font-mono ${car.cheapest_price < (car.last_price || Infinity) ? 'text-green-600 dark:text-green-400' : ''}`}>
                              £{car.cheapest_price.toFixed(2)}
                            </span>
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
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {onUpdateDetails && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditCar(car.id)}
                              title="Edit vehicle details"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
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
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedCar && (
        <EditVehicleDialog
          car={selectedCar}
          open={!!editCarId}
          onOpenChange={(open) => !open && setEditCarId(null)}
          onSave={handleSaveCarDetails}
        />
      )}
    </>
  );
};
