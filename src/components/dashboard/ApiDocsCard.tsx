
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertCircle, ChevronDown, Copy, Database, Key, Lock, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface ApiDocsCardProps {
  apiKey: string | null;
  userId: string | undefined;
  hasApiAccess: boolean;
  onGenerateKey: () => Promise<void>;
}

export const ApiDocsCard = ({ apiKey, userId, hasApiAccess, onGenerateKey }: ApiDocsCardProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedExample, setExpandedExample] = useState<string | null>(null);

  const handleCopyApiKey = () => {
    if (!apiKey) return;
    
    navigator.clipboard.writeText(apiKey);
    toast({
      title: "API Key Copied",
      description: "The API key has been copied to your clipboard.",
    });
  };

  const handleGenerateKey = async () => {
    setIsGenerating(true);
    await onGenerateKey();
    setIsGenerating(false);
  };

  const toggleExample = (id: string) => {
    if (expandedExample === id) {
      setExpandedExample(null);
    } else {
      setExpandedExample(id);
    }
  };

  // API examples
  const examples = [
    {
      id: "get-cars",
      title: "Get All Tracked Cars",
      description: "Retrieve all vehicles you're currently tracking",
      method: "GET",
      endpoint: "/api/cars",
      code: `curl -X GET "https://api.dealpulse.com/api/cars" \\
  -H "Authorization: Bearer ${apiKey || 'YOUR_API_KEY'}"`,
      response: `{
  "success": true,
  "data": [
    {
      "id": "car_123abc",
      "brand": "Toyota",
      "model": "Camry",
      "engine_type": "2.5L 4-cylinder",
      "year": "2022",
      "color": "Silver",
      "added_at": "2023-01-15T08:30:00Z",
      "current_price": 24995,
      "price_changes": [
        {
          "date": "2023-01-20T10:15:00Z",
          "old_price": 25995,
          "new_price": 24995
        }
      ]
    },
    // More cars...
  ]
}`
    },
    {
      id: "get-car",
      title: "Get Specific Car Details",
      description: "Retrieve detailed information about a specific vehicle",
      method: "GET",
      endpoint: "/api/cars/:carId",
      code: `curl -X GET "https://api.dealpulse.com/api/cars/car_123abc" \\
  -H "Authorization: Bearer ${apiKey || 'YOUR_API_KEY'}"`,
      response: `{
  "success": true,
  "data": {
    "id": "car_123abc",
    "brand": "Toyota",
    "model": "Camry",
    "engine_type": "2.5L 4-cylinder",
    "year": "2022",
    "color": "Silver",
    "added_at": "2023-01-15T08:30:00Z",
    "url": "https://example.com/toyota-camry-2022",
    "current_price": 24995,
    "original_price": 25995,
    "price_changes": [
      {
        "date": "2023-01-20T10:15:00Z", 
        "old_price": 25995,
        "new_price": 24995
      }
    ],
    "tags": ["sedan", "reliable"]
  }
}`
    },
    {
      id: "price-history",
      title: "Get Price History",
      description: "Retrieve historical price data for a vehicle",
      method: "GET",
      endpoint: "/api/cars/:carId/price-history",
      code: `curl -X GET "https://api.dealpulse.com/api/cars/car_123abc/price-history" \\
  -H "Authorization: Bearer ${apiKey || 'YOUR_API_KEY'}"`,
      response: `{
  "success": true,
  "data": {
    "car_id": "car_123abc",
    "brand": "Toyota",
    "model": "Camry",
    "prices": [
      {
        "date": "2023-01-15T08:30:00Z",
        "price": 25995
      },
      {
        "date": "2023-01-20T10:15:00Z",
        "price": 24995
      },
      {
        "date": "2023-02-05T14:22:00Z",
        "price": 23995
      }
    ]
  }
}`
    },
    {
      id: "add-car",
      title: "Add New Car to Track",
      description: "Add a new vehicle to your tracking list",
      method: "POST",
      endpoint: "/api/cars",
      code: `curl -X POST "https://api.dealpulse.com/api/cars" \\
  -H "Authorization: Bearer ${apiKey || 'YOUR_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "brand": "Honda",
    "model": "Accord",
    "engine_type": "1.5L Turbo",
    "year": "2023",
    "color": "Blue",
    "url": "https://example.com/honda-accord-2023"
  }'`,
      response: `{
  "success": true,
  "data": {
    "id": "car_456def",
    "brand": "Honda",
    "model": "Accord",
    "engine_type": "1.5L Turbo",
    "year": "2023",
    "color": "Blue",
    "added_at": "2023-03-10T09:45:00Z",
    "url": "https://example.com/honda-accord-2023"
  },
  "message": "Vehicle added successfully"
}`
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Access</CardTitle>
        <CardDescription>
          Integrate vehicle tracking data with your existing systems
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasApiAccess ? (
          <div className="p-6 text-center">
            <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">API Access Unavailable</h3>
            <p className="text-muted-foreground mb-4">
              API access is included with Professional and Enterprise plans.
            </p>
            <Button asChild>
              <a href="/pricing">Contact Sales</a>
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6 p-4 border rounded-md">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Key className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm font-medium">Your API Key</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCopyApiKey}
                    disabled={!apiKey}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleGenerateKey}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <><RefreshCw className="h-4 w-4 mr-1 animate-spin" /> Generating...</>
                    ) : (
                      <><RefreshCw className="h-4 w-4 mr-1" /> Generate New</>
                    )}
                  </Button>
                </div>
              </div>
              <div className="bg-muted p-2 rounded font-mono text-xs break-all">
                {apiKey || 'No API key generated yet'}
              </div>
              <div className="mt-2 text-xs text-muted-foreground flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                Keep this key secret. Never share it or include it in client-side code.
              </div>
            </div>

            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="examples">Examples</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Getting Started</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Our RESTful API allows you to access and manage your vehicle tracking data programmatically.
                    All API requests should include your API key in the Authorization header.
                  </p>

                  <div className="bg-muted p-3 rounded mb-4">
                    <code className="text-xs font-mono">
                      Authorization: Bearer {apiKey || 'YOUR_API_KEY'}
                    </code>
                  </div>

                  <h4 className="font-medium mb-2">Base URL</h4>
                  <div className="bg-muted p-3 rounded mb-4">
                    <code className="text-xs font-mono">
                      https://api.dealpulse.com
                    </code>
                  </div>

                  <h4 className="font-medium mb-2">Response Format</h4>
                  <p className="text-muted-foreground text-sm mb-2">
                    All responses are returned in JSON format with the following structure:
                  </p>
                  <div className="bg-muted p-3 rounded">
                    <pre className="text-xs font-mono">
{`{
  "success": true/false,
  "data": { ... },  // Response data
  "error": { ... }  // Error details (if success is false)
}`}
                    </pre>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="examples" className="space-y-4">
                <div className="space-y-2">
                  {examples.map((example) => (
                    <Collapsible
                      key={example.id}
                      open={expandedExample === example.id}
                      onOpenChange={() => toggleExample(example.id)}
                      className="border rounded-md"
                    >
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left">
                        <div>
                          <div className="flex items-center">
                            <span className={`text-xs font-mono px-2 py-0.5 rounded mr-2 ${
                              example.method === 'GET' 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            }`}>
                              {example.method}
                            </span>
                            <span className="font-medium">{example.title}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{example.description}</p>
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${
                          expandedExample === example.id ? 'transform rotate-180' : ''
                        }`} />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-3 border-t">
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-xs font-medium mb-1">Endpoint</h4>
                            <div className="bg-muted p-2 rounded">
                              <code className="text-xs font-mono">{example.endpoint}</code>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-xs font-medium mb-1">Request</h4>
                            <div className="bg-muted p-2 rounded">
                              <pre className="text-xs font-mono overflow-x-auto">{example.code}</pre>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-xs font-medium mb-1">Response</h4>
                            <div className="bg-muted p-2 rounded">
                              <pre className="text-xs font-mono overflow-x-auto">{example.response}</pre>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
};
