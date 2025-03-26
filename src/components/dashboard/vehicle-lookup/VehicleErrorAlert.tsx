
import { AlertTriangle } from "lucide-react";

interface VehicleErrorAlertProps {
  error: string;
  errorCode: string | null;
}

export const VehicleErrorAlert = ({ error, errorCode }: VehicleErrorAlertProps) => {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50 p-4 animate-fade-in">
      <div className="flex items-start space-x-3">
        <div className="bg-red-100 dark:bg-red-900/40 rounded-full p-2">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h3 className="text-md font-medium text-red-800 dark:text-red-400">
            Vehicle lookup failed
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            {error}
          </p>
          {errorCode && (
            <p className="text-xs text-red-600 dark:text-red-400/70 mt-2">
              Error code: {errorCode}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
