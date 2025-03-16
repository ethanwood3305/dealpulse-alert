
import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, ChevronDown, ChevronUp, KeyRound, Code as CodeIcon, Eye, EyeOff } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface ApiDocsCardProps {
  apiKey: string | null;
  userId: string;
  hasApiAccess: boolean;
  onGenerateKey: () => Promise<void>;
}

interface CodeExample {
  language: string;
  code: string;
  icon: React.ReactNode;
}

export const ApiDocsCard = ({ apiKey, userId, hasApiAccess, onGenerateKey }: ApiDocsCardProps) => {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

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

  const toggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey);
  };

  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  const baseFetchUrl = `${baseUrl}/api/dealpulse`;

  const maskApiKey = (key: string | null) => {
    if (!key) return '';
    return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  const codeExamples: CodeExample[] = [
    {
      language: "JavaScript",
      icon: <span className="flex w-5 h-5 items-center justify-center text-yellow-400 font-bold">JS</span>,
      code: `fetch('${baseFetchUrl}/tracked-urls', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ${apiKey || 'your-api-key'}',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`
    },
    {
      language: "Python",
      icon: <span className="flex w-5 h-5 items-center justify-center text-blue-500 font-bold">PY</span>,
      code: `import requests

url = "${baseFetchUrl}/tracked-urls"
headers = {
    "Authorization": "Bearer ${apiKey || 'your-api-key'}",
    "Content-Type": "application/json"
}

response = requests.get(url, headers=headers)
data = response.json()
print(data)`
    },
    {
      language: "C#",
      icon: <span className="flex w-5 h-5 items-center justify-center text-purple-500 font-bold">C#</span>,
      code: `using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        using (HttpClient client = new HttpClient())
        {
            client.DefaultRequestHeaders.Authorization = 
                new AuthenticationHeaderValue("Bearer", "${apiKey || 'your-api-key'}");
            
            HttpResponseMessage response = await client.GetAsync("${baseFetchUrl}/tracked-urls");
            response.EnsureSuccessStatusCode();
            
            string responseBody = await response.Content.ReadAsStringAsync();
            Console.WriteLine(responseBody);
        }
    }
}`
    },
    {
      language: "Go",
      icon: <span className="flex w-5 h-5 items-center justify-center text-cyan-500 font-bold">GO</span>,
      code: `package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
)

func main() {
	url := "${baseFetchUrl}/tracked-urls"
	req, _ := http.NewRequest("GET", url, nil)
	
	req.Header.Add("Authorization", "Bearer ${apiKey || 'your-api-key'}")
	req.Header.Add("Content-Type", "application/json")
	
	res, _ := http.DefaultClient.Do(req)
	defer res.Body.Close()
	
	body, _ := ioutil.ReadAll(res.Body)
	fmt.Println(string(body))
}`
    },
    {
      language: "Ruby",
      icon: <span className="flex w-5 h-5 items-center justify-center text-red-500 font-bold">RB</span>,
      code: `require 'uri'
require 'net/http'
require 'json'

uri = URI('${baseFetchUrl}/tracked-urls')
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = true if uri.scheme == 'https'

request = Net::HTTP::Get.new(uri)
request['Authorization'] = 'Bearer ${apiKey || 'your-api-key'}'
request['Content-Type'] = 'application/json'

response = http.request(request)
puts JSON.parse(response.body)`
    },
    {
      language: "Java",
      icon: <span className="flex w-5 h-5 items-center justify-center text-orange-600 font-bold">JV</span>,
      code: `import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class ApiExample {
    public static void main(String[] args) {
        try {
            URL url = new URL("${baseFetchUrl}/tracked-urls");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Authorization", "Bearer ${apiKey || 'your-api-key'}");
            conn.setRequestProperty("Content-Type", "application/json");

            BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            String inputLine;
            StringBuffer response = new StringBuffer();
            while ((inputLine = in.readLine()) != null) {
                response.append(inputLine);
            }
            in.close();

            System.out.println(response.toString());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}`
    },
    {
      language: "PHP",
      icon: <span className="flex w-5 h-5 items-center justify-center text-indigo-500 font-bold">PHP</span>,
      code: `<?php
$url = "${baseFetchUrl}/tracked-urls";
$headers = array(
    'Authorization: Bearer ${apiKey || 'your-api-key'}',
    'Content-Type: application/json'
);

$curl = curl_init();
curl_setopt($curl, CURLOPT_URL, $url);
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);

$response = curl_exec($curl);
curl_close($curl);

$data = json_decode($response, true);
print_r($data);
?>`
    },
    {
      language: "Swift",
      icon: <span className="flex w-5 h-5 items-center justify-center text-orange-500 font-bold">SW</span>,
      code: `import Foundation

let url = URL(string: "${baseFetchUrl}/tracked-urls")!
var request = URLRequest(url: url)
request.httpMethod = "GET"
request.addValue("Bearer ${apiKey || 'your-api-key'}", forHTTPHeaderField: "Authorization")
request.addValue("application/json", forHTTPHeaderField: "Content-Type")

let task = URLSession.shared.dataTask(with: request) { data, response, error in
    if let error = error {
        print("Error: \(error)")
        return
    }
    
    if let data = data {
        do {
            let json = try JSONSerialization.jsonObject(with: data)
            print(json)
        } catch {
            print("JSON error: \(error)")
        }
    }
}

task.resume()`
    },
    {
      language: "Kotlin",
      icon: <span className="flex w-5 h-5 items-center justify-center text-purple-400 font-bold">KT</span>,
      code: `import java.net.HttpURLConnection
import java.net.URL
import java.io.BufferedReader
import java.io.InputStreamReader

fun main() {
    val url = URL("${baseFetchUrl}/tracked-urls")
    val connection = url.openConnection() as HttpURLConnection
    connection.requestMethod = "GET"
    connection.setRequestProperty("Authorization", "Bearer ${apiKey || 'your-api-key'}")
    connection.setRequestProperty("Content-Type", "application/json")

    val responseCode = connection.responseCode
    if (responseCode == HttpURLConnection.HTTP_OK) {
        val reader = BufferedReader(InputStreamReader(connection.inputStream))
        val response = StringBuilder()
        var line: String?
        while (reader.readLine().also { line = it } != null) {
            response.append(line)
        }
        reader.close()
        println(response.toString())
    } else {
        println("Error: $responseCode")
    }
}`
    }
  ];

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
                        {showApiKey ? apiKey : maskApiKey(apiKey)}
                      </code>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="ml-2 flex-shrink-0"
                        onClick={toggleApiKeyVisibility}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
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
                      Authorization: Bearer {showApiKey ? apiKey : (apiKey ? (apiKey.substring(0, 4) + '•••••' + apiKey.substring(apiKey.length - 4)) : 'your-api-key')}
                    </code>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center">
                      <CodeIcon className="h-5 w-5 mr-2" />
                      Example Requests
                    </h3>
                    
                    <Tabs defaultValue="JavaScript" className="w-full">
                      <TabsList className="mb-2 flex flex-wrap">
                        {codeExamples.map((example) => (
                          <TabsTrigger key={example.language} value={example.language} className="flex items-center gap-1.5">
                            {example.icon}
                            {example.language}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      
                      {codeExamples.map((example) => (
                        <TabsContent key={example.language} value={example.language}>
                          <div className="relative">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="absolute top-2 right-2 h-7 px-2"
                              onClick={() => handleCopy(example.code)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <pre className="bg-muted p-3 pt-10 rounded text-sm overflow-x-auto">
                              {example.code}
                            </pre>
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
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
