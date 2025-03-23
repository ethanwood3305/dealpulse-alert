
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrackedCar } from "@/hooks/use-tracked-cars";
import { ScrapedListing } from "@/integrations/supabase/database.types";
import { EditVehicleDialog } from "./EditVehicleDialog";
import { DeleteCarDialog } from "./DeleteCarDialog";
import { EmptyCarsList } from "./EmptyCarsList";
import { CarRow } from "./CarRow";
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
                  <CarRow
                    key={car.id}
                    car={car}
                    cheapestUrl={getListingUrl(car.id)}
                    onEdit={() => setEditCarId(car.id)}
                    onMapClick={() => navigateToMap(car.id)}
                    onDelete={() => confirmDelete(car.id)}
                    onRemoveTag={(tag) => onRemoveTag(car.id, tag)}
                  />
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
