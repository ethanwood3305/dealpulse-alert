
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrashIcon } from "lucide-react";
import { format } from "date-fns";
import { TrackedCar } from "@/hooks/use-tracked-cars";
import { TagInput } from "./TagInput";
import { Badge } from "@/components/ui/badge";
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

interface TrackedCarsTableProps {
  trackedCars: TrackedCar[];
  onDelete: (id: string) => Promise<void>;
  onAddTag: (carId: string, tag: string) => Promise<void>;
  onRemoveTag: (carId: string, tag: string) => Promise<void>;
  carsLimit: number | undefined;
}

export const TrackedCarsTable = ({ 
  trackedCars, 
  onDelete,
  onAddTag,
  onRemoveTag,
  carsLimit = 1
}: TrackedCarsTableProps) => {
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

  // Sort cars by creation date (newest first)
  const sortedCars = [...trackedCars].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tracked Vehicles</CardTitle>
        <CardDescription>Your tracked competitor vehicle models</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Brand</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Engine Type</TableHead>
              <TableHead>Mileage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Price</TableHead>
              <TableHead>Last Checked</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCars.map((car, index) => {
              const isActive = index < carsLimit;
              
              return (
                <TableRow key={car.id} className={!isActive ? "opacity-70" : ""}>
                  <TableCell className="font-medium">{car.brand}</TableCell>
                  <TableCell>{car.model}</TableCell>
                  <TableCell>{car.engineType}</TableCell>
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
                  <TableCell className="text-right">
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
                          <AlertDialogAction onClick={() => onDelete(car.id)}>
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
      </CardContent>
    </Card>
  );
};
