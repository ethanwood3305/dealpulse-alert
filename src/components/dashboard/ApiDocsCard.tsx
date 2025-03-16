
import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, ChevronDown, ChevronUp, KeyRound } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ApiDocsCardProps {
  apiKey: string | null;
  userId: string;
  hasApiAccess: boolean;
  onGenerateKey: () => Promise<void>;
}

export const ApiDocsCard = ({ apiKey, userId, hasApiAccess, onGenerateKey }: ApiDocsCardProps) => {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "API key has been copied to your clipboard"
    });
    
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  const handleGenerateKey = async () => {
    setIsGenerating(true);
    try {
      await onGenerateKey();
      toast({
        title: "API key generated",
        description: "Your new API key has been generated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate API key. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  const baseFetchUrl = `${baseUrl}/api/dealpulse`;

  return (
    <Card className="mb-10">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">API Documentation</h2>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent>
          <CardContent className="p-6">
            {hasApiAccess ? (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Your API Key</h3>
                  {apiKey ? (
                    <div className="flex items-center">
                      <code className="bg-muted p-2 rounded text-sm flex-grow overflow-x-auto">
                        {apiKey}
                      </code>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="ml-2 flex-shrink-0"
                        onClick={() => handleCopy(apiKey)}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span className="text-muted-foreground italic">No API key generated</span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="ml-2"
                        onClick={handleGenerateKey}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <>Generating...</>
                        ) : (
                          <>
                            <KeyRound className="h-4 w-4 mr-2" />
                            Generate Key
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">API Endpoints</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-1">Get all tracked URLs</h4>
                        <code className="bg-muted p-2 rounded text-sm block mb-2">
                          GET {baseFetchUrl}/tracked-urls
                        </code>
                        <p className="text-sm text-muted-foreground">
                          Returns all URLs you're currently tracking
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-1">Get URL details</h4>
                        <code className="bg-muted p-2 rounded text-sm block mb-2">
                          GET {baseFetchUrl}/tracked-urls/:id
                        </code>
                        <p className="text-sm text-muted-foreground">
                          Returns details for a specific tracked URL
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-1">Add URL to track</h4>
                        <code className="bg-muted p-2 rounded text-sm block mb-2">
                          POST {baseFetchUrl}/tracked-urls
                        </code>
                        <p className="text-sm text-muted-foreground">
                          Add a new URL to track
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Authentication</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Include your API key in the request headers:
                    </p>
                    <code className="bg-muted p-2 rounded text-sm block">
                      Authorization: Bearer {apiKey || 'your-api-key'}
                    </code>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Example Request</h3>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`fetch('${baseFetchUrl}/tracked-urls', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ${apiKey || 'your-api-key'}',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`}
                    </pre>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-4 text-center">
                <p className="text-muted-foreground mb-4">
                  API access is not included in your current plan. 
                  Upgrade your plan to get API access.
                </p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
