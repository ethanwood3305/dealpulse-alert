
import { AlertCircle, AlertTriangle, Clock } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface VehicleErrorAlertProps {
  error: string;
  errorCode: string | null;
}

export const VehicleErrorAlert = ({ error, errorCode }: VehicleErrorAlertProps) => {
  return (
    <Alert variant={
      errorCode === "VEHICLE_NOT_FOUND" ? "default" : 
      errorCode === "TIMEOUT" ? "default" : "destructive"
    }>
      {errorCode === "VEHICLE_NOT_FOUND" ? (
        <AlertTriangle className="h-4 w-4" />
      ) : errorCode === "TIMEOUT" ? (
        <Clock className="h-4 w-4" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      <AlertTitle>
        {errorCode === "VEHICLE_NOT_FOUND" 
          ? "Vehicle not found" 
          : errorCode === "SERVICE_UNAVAILABLE"
          ? "Service unavailable"
          : errorCode === "TIMEOUT"
          ? "Service timed out"
          : "Lookup failed"}
      </AlertTitle>
      <AlertDescription>
        {error}
        {errorCode === "VEHICLE_NOT_FOUND" && (
          <p className="mt-2 text-sm">
            Please check the registration number and try again. Make sure it's a valid UK registration.
          </p>
        )}
        {errorCode === "SERVICE_UNAVAILABLE" && (
          <p className="mt-2 text-sm">
            The vehicle lookup service is currently unavailable. Please try again later.
          </p>
        )}
        {errorCode === "TIMEOUT" && (
          <p className="mt-2 text-sm">
            The vehicle lookup service is taking too long to respond. Please try again in a few minutes.
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
};
