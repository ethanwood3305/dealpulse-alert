
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, ChevronDown } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ApiDocsCardProps {
  apiKey: string | null;
  userId: string;
  hasApiAccess: boolean;
  onGenerateKey: () => Promise<void>;
}

export const ApiDocsCard = ({ apiKey, userId, hasApiAccess, onGenerateKey }: ApiDocsCardProps) => {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const baseUrl = window.location.origin;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "The API key has been copied to your clipboard."
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateKey = async () => {
    if (!hasApiAccess) {
      toast({
        title: "API access required",
        description: "Please upgrade your plan to include API access.",
        variant: "destructive"
      });
      return;
    }
    
    await onGenerateKey();
  };

  const endpointExamples = [
    {
      name: "AddURL",
      method: "POST",
      endpoint: `${baseUrl}/api/urls`,
      description: "Add a new URL to track",
      parameters: {
        url: "The URL to track (required)"
      },
      example: `curl -X POST ${baseUrl}/api/urls \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"url": "https://example.com/product"}'`
    },
    {
      name: "DeleteURL",
      method: "DELETE",
      endpoint: `${baseUrl}/api/urls/{id}`,
      description: "Delete a tracked URL by ID",
      parameters: {
        id: "The ID of the URL to delete (required)"
      },
      example: `curl -X DELETE ${baseUrl}/api/urls/123456 \\
  -H "Authorization: Bearer YOUR_API_KEY"`
    },
    {
      name: "GetLastUpdates",
      method: "GET",
      endpoint: `${baseUrl}/api/urls/updates`,
      description: "Get recent price updates for your tracked URLs",
      parameters: {
        limit: "Number of results to return (optional, default: 10)",
        offset: "Offset for pagination (optional, default: 0)"
      },
      example: `curl -X GET "${baseUrl}/api/urls/updates?limit=5" \\
  -H "Authorization: Bearer YOUR_API_KEY"`
    }
  ];

  if (!hasApiAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API Access</CardTitle>
          <CardDescription>Programmatic access to DealPulse Alert</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 text-center">
            <h3 className="text-lg font-medium mb-2">API Access Not Available</h3>
            <p className="text-muted-foreground mb-4">
              API access is available on paid plans with the API access add-on.
            </p>
            <Button variant="outline" onClick={() => window.location.href = "/pricing"}>
              Upgrade Your Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>API Access</CardTitle>
          <CardDescription>Programmatic access to DealPulse Alert</CardDescription>
        </div>
        <CollapsibleTrigger 
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full p-2 hover:bg-muted transition-colors"
        >
          <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? '' : 'transform -rotate-90'}`} />
        </CollapsibleTrigger>
      </CardHeader>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Your API Key</label>
                <div className="flex">
                  <Input 
                    value={apiKey || "No API key generated yet"} 
                    readOnly 
                    className="font-mono text-sm"
                    type={apiKey ? "password" : "text"}
                  />
                  {apiKey ? (
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => copyToClipboard(apiKey)}
                      className="ml-2"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={handleGenerateKey}
                      className="ml-2 whitespace-nowrap"
                    >
                      Generate Key
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Keep this secret! This key provides full access to your account via the API.
                </p>
              </div>

              <Tabs defaultValue="documentation">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="documentation">Documentation</TabsTrigger>
                  <TabsTrigger value="examples">Code Examples</TabsTrigger>
                </TabsList>
                
                <TabsContent value="documentation" className="space-y-4 mt-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">API Endpoints</h3>
                    <div className="space-y-4">
                      {endpointExamples.map((endpoint, index) => (
                        <div key={index} className="border rounded-md p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{endpoint.name}</h4>
                            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                              {endpoint.method}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{endpoint.description}</p>
                          <div className="font-mono text-sm bg-muted p-2 rounded mb-2">
                            {endpoint.endpoint}
                          </div>
                          <div className="mt-2">
                            <h5 className="text-sm font-medium mb-1">Parameters:</h5>
                            <ul className="text-sm space-y-1">
                              {Object.entries(endpoint.parameters).map(([key, value]) => (
                                <li key={key}><span className="font-medium">{key}</span>: {value}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="examples" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    {endpointExamples.map((endpoint, index) => (
                      <div key={index} className="border rounded-md p-4">
                        <h4 className="font-medium mb-2">{endpoint.name}</h4>
                        <div className="relative">
                          <pre className="font-mono text-sm bg-muted p-3 rounded overflow-x-auto whitespace-pre-wrap">
                            {endpoint.example.replace("YOUR_API_KEY", apiKey || "YOUR_API_KEY")}
                          </pre>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="absolute top-2 right-2"
                            onClick={() => copyToClipboard(endpoint.example.replace("YOUR_API_KEY", apiKey || "YOUR_API_KEY"))}
                          >
                            {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                            Copy
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
