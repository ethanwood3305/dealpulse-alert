
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrackedCar } from "@/hooks/use-tracked-cars";
import { ScrapedListing } from "@/integrations/supabase/database.types";
import { EditVehicleDialog } from "./EditVehicleDialog";
import { DeleteCarDialog } from "./DeleteCarDialog";
import { EmptyCarsList } from "./EmptyCarsList";
import { CarRow } from "./CarRow";
import { ScrapeButton } from "./ScrapeButton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const navigate = useNavigate();

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
  
  const navigateToMap = (carId: string) => {
    navigate(`/radius-map?carId=${carId}`);
  };

  const getListingUrl = (carId: string) => {
    if (!getListingsForCar) return '';
    
    const listings = getListingsForCar(carId);
    if (!listings || listings.length === 0) return '';
    
    const cheapestListing = listings.find(listing => listing.is_cheapest);
    return cheapestListing ? cheapestListing.url : '';
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
        <EmptyCarsList />
      ) : (
        <div className="border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Make/Model</TableHead>
                  <TableHead>Trim</TableHead>
                  <TableHead>Engine</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Mileage</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Registration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trackedCars.map((car) => (
                  <TableRow key={car.id}>
                    <TableCell>
                      <div className="font-medium">{car.brand} {car.model}</div>
                    </TableCell>
                    <TableCell>{car.trim || "—"}</TableCell>
                    <TableCell>{car.engineType}</TableCell>
                    <TableCell>{car.year || "—"}</TableCell>
                    <TableCell>{car.mileage || "—"}</TableCell>
                    <TableCell>{car.color || "—"}</TableCell>
                    <TableCell>
                      {car.last_price !== null ? (
                        <span className="font-semibold">£{Number(car.last_price).toLocaleString()}</span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {car.tags && car.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {car.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            >
                              {tag}
                              <button
                                onClick={() => onRemoveTag(car.id, tag)}
                                className="ml-1 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-100"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {onTriggerScraping && getListingsForCar && (
                          <ScrapeButton
                            car={car}
                            listings={getListingsForCar(car.id)}
                            onTriggerScraping={onTriggerScraping}
                            isScrapingCar={!!isScrapingCar}
                          />
                        )}
                        
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setEditCarId(car.id)}
                          >
                            Edit
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => navigateToMap(car.id)}
                          >
                            Map
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => confirmDelete(car.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <DeleteCarDialog
        open={!!deleteId}
        onOpenChange={closeDeleteDialog}
        onConfirmDelete={handleDelete}
      />

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
