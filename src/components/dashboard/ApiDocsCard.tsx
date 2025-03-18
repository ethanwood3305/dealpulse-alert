
import { useState } from 'react';
import { Check, Copy, Eye, EyeOff, KeyRound, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from '@/components/ui/accordion';

interface ApiDocsCardProps {
  apiKey: string | null;
  userId: string;
  hasApiAccess: boolean;
  onGenerateKey: () => Promise<boolean>;
}

export const ApiDocsCard = ({ 
  apiKey, 
  userId,
  hasApiAccess,
  onGenerateKey 
}: ApiDocsCardProps) => {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showKey, setShowKey] = useState(false);
  
  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handleGenerateKey = async () => {
    setIsGenerating(true);
    try {
      await onGenerateKey();
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleKeyVisibility = () => {
    setShowKey(!showKey);
  };
  
  const maskApiKey = (key: string | null) => {
    if (!key) return 'No API key found';
    return showKey ? key : key.substring(0, 4) + '••••••••••••••••' + key.substring(key.length - 4);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>API Access</CardTitle>
        <CardDescription>
          Access vehicle data programmatically via our API
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="api-docs">
            <AccordionTrigger>API Documentation</AccordionTrigger>
            <AccordionContent>
              {hasApiAccess ? (
                <div>
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Your API Key</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8"
                        onClick={handleGenerateKey}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        <span className="ml-2">Regenerate</span>
                      </Button>
                    </div>
                    <div className="flex">
                      <div className="flex-1 p-2 bg-muted rounded-l-md font-mono text-xs truncate">
                        {maskApiKey(apiKey)}
                      </div>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="rounded-none"
                        onClick={toggleKeyVisibility}
                        disabled={!apiKey}
                      >
                        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="rounded-l-none"
                        onClick={copyApiKey}
                        disabled={!apiKey}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Get all tracked vehicles</h4>
                      <div className="bg-muted p-2 rounded-md font-mono text-xs overflow-x-auto">
                        <pre>GET https://api.dealpulse.app/vehicles</pre>
                        <pre>{`Headers: { "x-api-key": "${apiKey ? (showKey ? apiKey : "YOUR_API_KEY") : 'YOUR_API_KEY'}" }`}</pre>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Get vehicle by ID</h4>
                      <div className="bg-muted p-2 rounded-md font-mono text-xs overflow-x-auto">
                        <pre>GET https://api.dealpulse.app/vehicles/:id</pre>
                        <pre>{`Headers: { "x-api-key": "${apiKey ? (showKey ? apiKey : "YOUR_API_KEY") : 'YOUR_API_KEY'}" }`}</pre>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium mb-2">Code Examples</h4>
                      
                      <div>
                        <h5 className="text-xs font-medium mb-1">cURL</h5>
                        <div className="bg-muted p-2 rounded-md font-mono text-xs overflow-x-auto">
                          <pre>{`curl -X GET \\
  https://api.dealpulse.app/vehicles \\
  -H "x-api-key: ${apiKey ? (showKey ? apiKey : "YOUR_API_KEY") : 'YOUR_API_KEY'}"`}</pre>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-xs font-medium mb-1">JavaScript</h5>
                        <div className="bg-muted p-2 rounded-md font-mono text-xs overflow-x-auto">
                          <pre>{`fetch('https://api.dealpulse.app/vehicles', {
  headers: {
    'x-api-key': '${apiKey ? (showKey ? apiKey : "YOUR_API_KEY") : 'YOUR_API_KEY'}'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`}</pre>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-xs font-medium mb-1">Python</h5>
                        <div className="bg-muted p-2 rounded-md font-mono text-xs overflow-x-auto">
                          <pre>{`import requests

headers = {
    'x-api-key': '${apiKey ? (showKey ? apiKey : "YOUR_API_KEY") : 'YOUR_API_KEY'}'
}

response = requests.get('https://api.dealpulse.app/vehicles', headers=headers)
data = response.json()
print(data)`}</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 flex flex-col items-center justify-center">
                  <KeyRound className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">API Access Unavailable</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md mt-2">
                    API access is only available on paid plans. Upgrade to access our API and integrate with your applications.
                  </p>
                  <Button 
                    className="mt-4"
                    onClick={handleGenerateKey}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <KeyRound className="h-4 w-4 mr-2" />
                    )}
                    Generate API Key
                  </Button>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};
