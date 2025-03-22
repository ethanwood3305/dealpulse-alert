
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { TrackedCar } from "@/hooks/use-tracked-cars";

interface EditVehicleDialogProps {
  car: TrackedCar;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (carId: string, mileage: string, price: string) => Promise<boolean>;
}

export function EditVehicleDialog({ car, open, onOpenChange, onSave }: EditVehicleDialogProps) {
  const [mileage, setMileage] = useState(car.mileage || '');
  const [price, setPrice] = useState(car.last_price ? car.last_price.toString() : '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await onSave(car.id, mileage, price);
      if (success) {
        onOpenChange(false);
        toast({
          title: "Vehicle updated",
          description: "Vehicle details have been updated successfully."
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update vehicle details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Vehicle Details</DialogTitle>
          <DialogDescription>
            Update the mileage and target price for {car.brand} {car.model}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="mileage" className="text-right">
              Mileage
            </Label>
            <Input
              id="mileage"
              type="number"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Target Price (£)
            </Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
