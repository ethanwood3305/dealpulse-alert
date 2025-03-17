
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

interface ApiDocsCardProps {
  apiKey: string | null | undefined;
  userId: string | null | undefined;
  hasApiAccess: boolean;
  onGenerateKey: () => Promise<void>;
}

export const ApiDocsCard = ({
  apiKey,
  userId,
  hasApiAccess,
  onGenerateKey
}: ApiDocsCardProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGenerateKey = async () => {
    setIsGenerating(true);
    await onGenerateKey();
    setIsGenerating(false);
  };
  
  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      toast({
        title: "API key copied",
        description: "The API key has been copied to your clipboard."
      });
    }
  };
  
  if (!hasApiAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API Access</CardTitle>
          <CardDescription>Access our car tracking API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border border-amber-200 bg-amber-50 rounded-md text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-400">
            <p className="text-sm">
              API access is only available on Pro and Business plans. Upgrade your subscription to use our API.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>API Access</CardTitle>
        <CardDescription>Access our car tracking API</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Your API Key</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-2 bg-muted rounded-md text-sm font-mono truncate">
              {apiKey || 'No API key generated'}
            </code>
            <Button variant="outline" size="icon" onClick={copyApiKey} disabled={!apiKey}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          {!apiKey && (
            <Button
              onClick={handleGenerateKey}
              disabled={isGenerating}
              className="w-full mt-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate API Key'
              )}
            </Button>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="text-sm font-medium">Quick Start</div>
          <div className="p-3 bg-muted rounded-md">
            <pre className="text-xs overflow-auto">
              <code>
{`// Get a list of your tracked cars
GET https://api.carpricetracker.com/v1/cars

// Headers
"Authorization": "Bearer ${apiKey || 'YOUR_API_KEY'}"
"User-Id": "${userId || 'YOUR_USER_ID'}"
`}
              </code>
            </pre>
          </div>
        </div>
        
        <div className="pt-2">
          <a
            href="https://docs.carpricetracker.com/api"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            View full API documentation →
          </a>
        </div>
      </CardContent>
    </Card>
  );
};
