
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface DashboardHeaderProps {
  userName: string | undefined;
  userEmail: string | undefined;
  isPro: boolean;
}

export const DashboardHeader = ({ userName, userEmail, isPro }: DashboardHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome, {userName || userEmail}
        </p>
      </div>
      
      {!isPro && (
        <Link to="/pricing">
          <Button className="mt-4 md:mt-0">
            Upgrade Plan
          </Button>
        </Link>
      )}
    </div>
  );
};
