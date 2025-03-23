
import { ExternalLink } from "lucide-react";

interface PriceDisplayProps {
  lastPrice: number | null;
  cheapestPrice: number | null;
  cheapestUrl: string;
}

export function PriceDisplay({ lastPrice, cheapestPrice, cheapestUrl }: PriceDisplayProps) {
  const hasLastPrice = lastPrice !== null && lastPrice !== undefined;
  const hasCheapestPrice = cheapestPrice !== null && cheapestPrice !== undefined;
  const isUserCheapest = hasCheapestPrice && hasLastPrice && cheapestPrice === lastPrice;
  const cheaperExists = hasCheapestPrice && hasLastPrice && cheapestPrice < lastPrice;
  
  return (
    <div>
      <div className="font-medium">
        {hasLastPrice ? `£${lastPrice.toLocaleString()}` : "—"}
      </div>
      
      {isUserCheapest ? (
        <div className="text-sm text-green-600 dark:text-green-400 font-medium">
          You have the cheapest listing currently.
        </div>
      ) : cheaperExists ? (
        <div className="text-sm text-red-600 dark:text-red-400">
          {cheapestUrl ? (
            <a 
              href={cheapestUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center underline hover:text-red-800 dark:hover:text-red-300 cursor-pointer font-medium"
            >
              Found at £{cheapestPrice.toLocaleString()}
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          ) : (
            <span>Found at £{cheapestPrice.toLocaleString()}</span>
          )}
        </div>
      ) : null}
    </div>
  );
}
