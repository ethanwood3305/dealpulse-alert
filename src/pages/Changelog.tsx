
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

// Type for a changelog entry
type ChangelogEntry = {
  date: string;
  version: string;
  title: string;
  changes: {
    type: "added" | "changed" | "fixed" | "removed";
    description: string;
  }[];
};

// All changelog entries
const changelogData: ChangelogEntry[] = [
  {
    date: "2024-07-15",
    version: "1.2.0",
    title: "Price Field Addition",
    changes: [
      {
        type: "added",
        description: "Added price field to manual car entry form",
      },
      {
        type: "added",
        description: "Added price field to DVLA vehicle lookup",
      },
      {
        type: "changed",
        description: "Changed currency display from USD to GBP",
      },
      {
        type: "added",
        description: "Added 'Coming Soon' badge to 'View Car Trends' button",
      },
      {
        type: "changed",
        description: "Rebranded from DealPulse to Carparison",
      },
    ],
  },
  {
    date: "2024-07-01",
    version: "1.1.0",
    title: "UI Improvements",
    changes: [
      {
        type: "added",
        description: "Added Radius Map feature to visualize dealers in your area",
      },
      {
        type: "changed",
        description: "Refactored AddCarForm for better maintainability",
      },
      {
        type: "fixed",
        description: "Fixed numerous UI issues on mobile devices",
      },
    ],
  },
  {
    date: "2024-06-15",
    version: "1.0.0",
    title: "Initial Release",
    changes: [
      {
        type: "added",
        description: "Launch of Carparison with core auto dealership price monitoring functionality",
      },
      {
        type: "added",
        description: "DVLA lookup integration for quick vehicle entry",
      },
      {
        type: "added",
        description: "URL price tracking for competitor analysis",
      },
    ],
  },
];

// Badge colors for different change types
const badgeColors = {
  added: "bg-green-500 hover:bg-green-600",
  changed: "bg-blue-500 hover:bg-blue-600",
  fixed: "bg-amber-500 hover:bg-amber-600",
  removed: "bg-red-500 hover:bg-red-600",
};

const Changelog = () => {
  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-10 min-h-[calc(100vh-64px-380px)]">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Changelog</h1>
          <p className="text-muted-foreground mb-8">
            Track all the updates and improvements we've made to Carparison
          </p>

          <div className="space-y-8">
            {changelogData.map((entry, index) => (
              <Card key={index} className="border-border">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs font-normal">
                      v{entry.version}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{entry.date}</span>
                  </div>
                  <CardTitle>{entry.title}</CardTitle>
                  <CardDescription>Version {entry.version} changes</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {entry.changes.map((change, changeIndex) => (
                      <li key={changeIndex} className="flex items-start gap-2">
                        <Badge className={`mt-0.5 ${badgeColors[change.type]}`}>
                          {change.type.charAt(0).toUpperCase() + change.type.slice(1)}
                        </Badge>
                        <span>{change.description}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Changelog;
