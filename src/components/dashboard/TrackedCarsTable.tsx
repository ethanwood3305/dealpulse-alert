import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Car as CarIcon } from "lucide-react";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { TrackedCar } from "@/hooks/use-tracked-cars";
import { EditVehicleDialog } from "./EditVehicleDialog";
import { ScrapeButton } from "./ScrapeButton";
import { ScrapedListing } from "@/integrations/supabase/database.types";

interface TrackedCarsTableProps {
  trackedCars: TrackedCar[];
  onDelete: (id: string) => Promise<boolean>;
  onAddTag: (urlId: string, tag: string) => Promise<void>;
  onRemoveTag: (urlId: string, tag: string) => Promise<void>;
  onUpdateDetails: (carId: string, mileage: string, price: string) => Promise<boolean>;
  carsLimit: number;
  onTriggerScraping?: (carId: string) => Promise<ScrapedListing[]>;
  isScrapingCar?: boolean;
  getListingsForCar?: (carId: string) => ScrapedListing[];
}

function CompetitorTag({ tag, onRemove }: { tag: string; onRemove: () => void }) {
  return (
    <Badge variant="secondary" className="gap-x-1.5">
      {tag}
      <button onClick={onRemove} className="ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
        <Trash2 className="h-3 w-3" />
        <span className="sr-only">Remove tag</span>
      </button>
    </Badge>
  );
}

export function TrackedCarsTable({ 
  trackedCars, 
  onDelete, 
  onAddTag, 
  onRemoveTag, 
  onUpdateDetails, 
  carsLimit,
  onTriggerScraping,
  isScrapingCar,
  getListingsForCar
}: TrackedCarsTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editCarId, setEditCarId] = useState<string | null>(null);

  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };

  const closeDeleteDialog = () => {
    setDeleteId(null);
  };

  const handleDelete = async () => {
    if (deleteId) {
      const success = await onDelete(deleteId);
      if (success) {
        closeDeleteDialog();
      }
    }
  };

  const getCarToEdit = () => {
    if (!editCarId) return null;
    return trackedCars.find(car => car.id === editCarId) || null;
  };

  const handleAddTag = (carId: string, tag: string) => {
    onAddTag(carId, tag);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Your Tracked Vehicles</h2>
        <div className="text-sm text-muted-foreground">
          {trackedCars.length} / {carsLimit} vehicles
        </div>
      </div>

      {trackedCars.length === 0 ? (
        <div className="text-center py-12 border rounded-md bg-muted/50">
          <CarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No vehicles tracked yet</h3>
          <p className="text-muted-foreground">
            Add your first vehicle to start tracking prices.
          </p>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Vehicle</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Details</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Price</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tags</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {trackedCars.map((car) => (
                  <tr key={car.id} className="bg-card">
                    <td className="px-4 py-4 align-top">
                      <div>
                        <div className="font-medium">{car.brand} {car.model}</div>
                        <div className="text-sm text-muted-foreground">{car.engineType}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="text-sm">
                        {car.year && <div>Year: {car.year}</div>}
                        {car.mileage && <div>Mileage: {car.mileage}</div>}
                        {car.color && <div>Color: {car.color}</div>}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="font-medium">
                        {car.last_price ? `£${car.last_price.toLocaleString()}` : "Not set"}
                      </div>
                      {car.cheapest_price && car.cheapest_price < (car.last_price || Infinity) && (
                        <div className="text-sm text-green-600 dark:text-green-400">
                          Found at £{car.cheapest_price.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {car.tags && car.tags.length > 0 ? (
                          car.tags.map((tag) => (
                            <CompetitorTag
                              key={tag}
                              tag={tag}
                              onRemove={() => onRemoveTag(car.id, tag)}
                            />
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No tags</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right align-top">
                      <div className="flex flex-col items-end space-y-2">
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditCarId(car.id)}
                        >
                          Edit
                        </Button>
                        {onTriggerScraping && getListingsForCar && (
                          <ScrapeButton 
                            car={car}
                            listings={getListingsForCar(car.id)}
                            onTriggerScraping={onTriggerScraping}
                            isScrapingCar={isScrapingCar || false}
                          />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => confirmDelete(car.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={closeDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the vehicle
              from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog}>Cancel</AlertDialogCancel>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </AlertDialogTrigger>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {getCarToEdit() && (
        <EditVehicleDialog
          car={getCarToEdit()!}
          open={!!editCarId}
          onOpenChange={(open) => !open && setEditCarId(null)}
          onSave={onUpdateDetails}
        />
      )}
    </div>
  );
}
