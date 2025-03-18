
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Copy, KeyRound, KeySquare } from "lucide-react";

interface ApiDocsCardProps {
  apiKey: string | null;
  userId: string;
  hasApiAccess: boolean;
  onGenerateKey: () => Promise<boolean>;
}

export function ApiDocsCard({
  apiKey,
  userId,
  hasApiAccess,
  onGenerateKey
}: ApiDocsCardProps) {
  const handleCopyApiKey = () => {
    if (!apiKey) return;
    
    navigator.clipboard.writeText(apiKey);
    toast({
      title: "API Key Copied",
      description: "The API key has been copied to your clipboard."
    });
  };
  
  const handleCopyUserId = () => {
    if (!userId) return;
    
    navigator.clipboard.writeText(userId);
    toast({
      title: "User ID Copied",
      description: "Your User ID has been copied to your clipboard."
    });
  };
  
  const handleGenerateKey = async () => {
    const loading = toast({
      title: "Generating API Key",
      description: "Please wait while we generate a new API key for you."
    });
    
    const success = await onGenerateKey();
    
    if (success) {
      toast({
        title: "API Key Generated",
        description: "Your new API key has been generated successfully."
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate API key. Please try again later."
      });
    }
  };
  
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="api-docs">
        <Card className="border-none shadow-none overflow-visible">
          <CardHeader className="p-0">
            <AccordionTrigger className="py-4 px-6 hover:no-underline">
              <div className="flex flex-col items-start text-left">
                <CardTitle className="text-xl">API Access</CardTitle>
                <CardDescription>
                  Access your car data programmatically
                </CardDescription>
              </div>
            </AccordionTrigger>
          </CardHeader>
          <AccordionContent>
            <CardContent className="px-6 pb-6 pt-0">
              {hasApiAccess ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-1.5">Your API Key</div>
                    <div className="flex gap-2">
                      <Input 
                        value={apiKey || ""} 
                        readOnly 
                        className="font-mono text-sm"
                      />
                      <Button 
                        size="icon" 
                        variant="outline" 
                        onClick={handleCopyApiKey}
                        title="Copy API Key"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Keep this key secure and don't share it publicly.
                    </p>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium mb-1.5">Your User ID</div>
                    <div className="flex gap-2">
                      <Input 
                        value={userId} 
                        readOnly 
                        className="font-mono text-sm"
                      />
                      <Button 
                        size="icon" 
                        variant="outline" 
                        onClick={handleCopyUserId}
                        title="Copy User ID"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      You'll need this to authenticate your API requests.
                    </p>
                  </div>
                  
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleGenerateKey}
                    >
                      <KeySquare className="mr-2 h-4 w-4" /> Generate New API Key
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      This will invalidate your current API key.
                    </p>
                  </div>
                  
                  <div className="space-y-2 border-t border-border pt-4 mt-4">
                    <h3 className="text-sm font-medium">Example API Request</h3>
                    <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                      {`curl -X GET "https://api.dealpulse.app/cars" \\
  -H "Authorization: Bearer ${apiKey || 'your-api-key'}" \\
  -H "User-ID: ${userId}" \\
  -H "Content-Type: application/json"`}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center space-y-2">
                  <KeyRound className="h-8 w-8 mx-auto text-muted-foreground" />
                  <h3 className="font-medium">API Access Not Available</h3>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to a paid plan to access the API.
                  </p>
                </div>
              )}
            </CardContent>
          </AccordionContent>
        </Card>
      </AccordionItem>
    </Accordion>
  );
}
