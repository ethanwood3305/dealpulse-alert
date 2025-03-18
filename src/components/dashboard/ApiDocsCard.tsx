
import { useState } from 'react';
import { Check, Copy, Eye, EyeOff, KeyRound, RefreshCw, Globe, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ApiDocsCardProps {
  apiKey: string | null;
  userId: string;
  hasApiAccess: boolean;
  onGenerateKey: () => Promise<boolean>;
}

type CodeLanguage = 'curl' | 'javascript' | 'python' | 'ruby' | 'go' | 'php';

export const ApiDocsCard = ({ 
  apiKey, 
  userId,
  hasApiAccess,
  onGenerateKey 
}: ApiDocsCardProps) => {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<CodeLanguage>('curl');
  
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

  const getCodeExample = (language: CodeLanguage) => {
    const keyDisplay = apiKey ? (showKey ? apiKey : "YOUR_API_KEY") : 'YOUR_API_KEY';
    
    switch (language) {
      case 'curl':
        return `curl -X GET \\
  https://api.dealpulse.app/vehicles \\
  -H "x-api-key: ${keyDisplay}"`;

      case 'javascript':
        return `fetch('https://api.dealpulse.app/vehicles', {
  headers: {
    'x-api-key': '${keyDisplay}'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`;

      case 'python':
        return `import requests

headers = {
    'x-api-key': '${keyDisplay}'
}

response = requests.get('https://api.dealpulse.app/vehicles', headers=headers)
data = response.json()
print(data)`;

      case 'ruby':
        return `require 'net/http'
require 'json'

uri = URI('https://api.dealpulse.app/vehicles')
request = Net::HTTP::Get.new(uri)
request['x-api-key'] = '${keyDisplay}'

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

data = JSON.parse(response.body)
puts data`;

      case 'go':
        return `package main

import (
    "fmt"
    "io/ioutil"
    "net/http"
)

func main() {
    client := &http.Client{}
    req, _ := http.NewRequest("GET", "https://api.dealpulse.app/vehicles", nil)
    req.Header.Add("x-api-key", "${keyDisplay}")
    
    resp, err := client.Do(req)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    defer resp.Body.Close()
    
    body, _ := ioutil.ReadAll(resp.Body)
    fmt.Println(string(body))
}`;

      case 'php':
        return `<?php
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => "https://api.dealpulse.app/vehicles",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "x-api-key: ${keyDisplay}"
    ],
]);

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
    echo "Error: " . $err;
} else {
    $data = json_decode($response, true);
    print_r($data);
}
?>`;

      default:
        return '';
    }
  };

  const getLanguageIcon = (language: CodeLanguage) => {
    switch (language) {
      case 'curl':
        return '📟';
      case 'javascript':
        return '🟨';
      case 'python':
        return '🐍';
      case 'ruby':
        return '💎';
      case 'go':
        return '🔵';
      case 'php':
        return '🐘';
      default:
        return '📋';
    }
  };

  const getLanguageLabel = (language: CodeLanguage) => {
    switch (language) {
      case 'curl':
        return 'cURL';
      case 'javascript':
        return 'JavaScript';
      case 'python':
        return 'Python';
      case 'ruby':
        return 'Ruby';
      case 'go':
        return 'Go';
      case 'php':
        return 'PHP';
      default:
        return language;
    }
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
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium mb-2">Code Examples</h4>
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                          <Select
                            value={selectedLanguage}
                            onValueChange={(value) => setSelectedLanguage(value as CodeLanguage)}
                          >
                            <SelectTrigger className="w-[140px] h-8">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                              {(['curl', 'javascript', 'python', 'ruby', 'go', 'php'] as CodeLanguage[]).map((lang) => (
                                <SelectItem key={lang} value={lang}>
                                  <div className="flex items-center">
                                    <span className="mr-2">{getLanguageIcon(lang)}</span>
                                    {getLanguageLabel(lang)}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="bg-muted p-2 rounded-md font-mono text-xs overflow-x-auto">
                        <pre>{getCodeExample(selectedLanguage)}</pre>
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
