
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Car } from "lucide-react";

export default function Hero() {
  return (
    <div className="relative isolate px-6 pt-14 lg:px-8">
      <div className="mx-auto max-w-4xl py-24 sm:py-32">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-primary/10 p-3">
              <Car className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Monitor Vehicle Prices <span className="text-primary">Effortlessly</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Stay ahead of the market with real-time price tracking for any vehicle model. Get alerts when prices change and make informed decisions.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/login">
                Start Tracking Vehicles
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg">
              <Link to="/contact">
                Enquire Now
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
