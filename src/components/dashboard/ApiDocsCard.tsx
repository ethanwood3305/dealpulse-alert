
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertCircle, ChevronDown, Copy, Database, Eye, EyeOff, Key, Lock, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface ApiDocsCardProps {
  apiKey: string | null;
  userId: string | undefined;
  hasApiAccess: boolean;
  onGenerateKey: () => Promise<void>;
}

type CodeLanguage = 'curl' | 'javascript' | 'python' | 'ruby' | 'php' | 'java' | 'csharp' | 'go';

interface CodeExample {
  id: string;
  title: string;
  description: string;
  method: string;
  endpoint: string;
  code: Record<CodeLanguage, string>;
  response: string;
}

export const ApiDocsCard = ({ apiKey, userId, hasApiAccess, onGenerateKey }: ApiDocsCardProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedExample, setExpandedExample] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState<CodeLanguage>('curl');

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

  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey);
  };

  const maskedApiKey = apiKey 
    ? `${apiKey.substring(0, 4)}${'•'.repeat(Math.max(0, apiKey.length - 8))}${apiKey.substring(apiKey.length - 4)}`
    : 'No API key generated yet';

  // API examples with multiple language options
  const examples: CodeExample[] = [
    {
      id: "get-cars",
      title: "Get All Tracked Cars",
      description: "Retrieve all vehicles you're currently tracking",
      method: "GET",
      endpoint: "/api/cars",
      code: {
        curl: `curl -X GET "https://api.dealpulse.com/api/cars" \\
  -H "Authorization: Bearer ${apiKey || 'YOUR_API_KEY'}"`,
        javascript: `// Using fetch
fetch("https://api.dealpulse.com/api/cars", {
  method: "GET",
  headers: {
    "Authorization": "Bearer ${apiKey || 'YOUR_API_KEY'}"
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error("Error:", error));`,
        python: `import requests

url = "https://api.dealpulse.com/api/cars"
headers = {
    "Authorization": "Bearer ${apiKey || 'YOUR_API_KEY'}"
}

response = requests.get(url, headers=headers)
data = response.json()
print(data)`,
        ruby: `require 'net/http'
require 'uri'
require 'json'

uri = URI.parse("https://api.dealpulse.com/api/cars")
request = Net::HTTP::Get.new(uri)
request["Authorization"] = "Bearer ${apiKey || 'YOUR_API_KEY'}"

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts JSON.parse(response.body)`,
        php: `<?php
$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, "https://api.dealpulse.com/api/cars");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    "Authorization: Bearer ${apiKey || 'YOUR_API_KEY'}"
));

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
print_r($data);
?>`,
        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class GetCars {
    public static void main(String[] args) {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://api.dealpulse.com/api/cars"))
            .header("Authorization", "Bearer ${apiKey || 'YOUR_API_KEY'}")
            .GET()
            .build();

        client.sendAsync(request, HttpResponse.BodyHandlers.ofString())
            .thenApply(HttpResponse::body)
            .thenAccept(System.out::println)
            .join();
    }
}`,
        csharp: `using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        using (var client = new HttpClient())
        {
            client.DefaultRequestHeaders.Authorization = 
                new AuthenticationHeaderValue("Bearer", "${apiKey || 'YOUR_API_KEY'}");
            
            var response = await client.GetAsync("https://api.dealpulse.com/api/cars");
            var content = await response.Content.ReadAsStringAsync();
            
            Console.WriteLine(content);
        }
    }
}`,
        go: `package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
)

func main() {
	req, _ := http.NewRequest("GET", "https://api.dealpulse.com/api/cars", nil)
	req.Header.Add("Authorization", "Bearer ${apiKey || 'YOUR_API_KEY'}")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer resp.Body.Close()

	body, _ := ioutil.ReadAll(resp.Body)
	fmt.Println(string(body))
}`
      },
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
      code: {
        curl: `curl -X GET "https://api.dealpulse.com/api/cars/car_123abc" \\
  -H "Authorization: Bearer ${apiKey || 'YOUR_API_KEY'}"`,
        javascript: `// Using fetch
fetch("https://api.dealpulse.com/api/cars/car_123abc", {
  method: "GET",
  headers: {
    "Authorization": "Bearer ${apiKey || 'YOUR_API_KEY'}"
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error("Error:", error));`,
        python: `import requests

url = "https://api.dealpulse.com/api/cars/car_123abc"
headers = {
    "Authorization": "Bearer ${apiKey || 'YOUR_API_KEY'}"
}

response = requests.get(url, headers=headers)
data = response.json()
print(data)`,
        ruby: `require 'net/http'
require 'uri'
require 'json'

uri = URI.parse("https://api.dealpulse.com/api/cars/car_123abc")
request = Net::HTTP::Get.new(uri)
request["Authorization"] = "Bearer ${apiKey || 'YOUR_API_KEY'}"

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts JSON.parse(response.body)`,
        php: `<?php
$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, "https://api.dealpulse.com/api/cars/car_123abc");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    "Authorization: Bearer ${apiKey || 'YOUR_API_KEY'}"
));

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
print_r($data);
?>`,
        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class GetCar {
    public static void main(String[] args) {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://api.dealpulse.com/api/cars/car_123abc"))
            .header("Authorization", "Bearer ${apiKey || 'YOUR_API_KEY'}")
            .GET()
            .build();

        client.sendAsync(request, HttpResponse.BodyHandlers.ofString())
            .thenApply(HttpResponse::body)
            .thenAccept(System.out::println)
            .join();
    }
}`,
        csharp: `using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        using (var client = new HttpClient())
        {
            client.DefaultRequestHeaders.Authorization = 
                new AuthenticationHeaderValue("Bearer", "${apiKey || 'YOUR_API_KEY'}");
            
            var response = await client.GetAsync("https://api.dealpulse.com/api/cars/car_123abc");
            var content = await response.Content.ReadAsStringAsync();
            
            Console.WriteLine(content);
        }
    }
}`,
        go: `package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
)

func main() {
	req, _ := http.NewRequest("GET", "https://api.dealpulse.com/api/cars/car_123abc", nil)
	req.Header.Add("Authorization", "Bearer ${apiKey || 'YOUR_API_KEY'}")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer resp.Body.Close()

	body, _ := ioutil.ReadAll(resp.Body)
	fmt.Println(string(body))
}`
      },
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
      code: {
        curl: `curl -X GET "https://api.dealpulse.com/api/cars/car_123abc/price-history" \\
  -H "Authorization: Bearer ${apiKey || 'YOUR_API_KEY'}"`,
        javascript: `// Using fetch
fetch("https://api.dealpulse.com/api/cars/car_123abc/price-history", {
  method: "GET",
  headers: {
    "Authorization": "Bearer ${apiKey || 'YOUR_API_KEY'}"
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error("Error:", error));`,
        python: `import requests

url = "https://api.dealpulse.com/api/cars/car_123abc/price-history"
headers = {
    "Authorization": "Bearer ${apiKey || 'YOUR_API_KEY'}"
}

response = requests.get(url, headers=headers)
data = response.json()
print(data)`,
        ruby: `require 'net/http'
require 'uri'
require 'json'

uri = URI.parse("https://api.dealpulse.com/api/cars/car_123abc/price-history")
request = Net::HTTP::Get.new(uri)
request["Authorization"] = "Bearer ${apiKey || 'YOUR_API_KEY'}"

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts JSON.parse(response.body)`,
        php: `<?php
$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, "https://api.dealpulse.com/api/cars/car_123abc/price-history");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    "Authorization: Bearer ${apiKey || 'YOUR_API_KEY'}"
));

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
print_r($data);
?>`,
        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class GetPriceHistory {
    public static void main(String[] args) {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://api.dealpulse.com/api/cars/car_123abc/price-history"))
            .header("Authorization", "Bearer ${apiKey || 'YOUR_API_KEY'}")
            .GET()
            .build();

        client.sendAsync(request, HttpResponse.BodyHandlers.ofString())
            .thenApply(HttpResponse::body)
            .thenAccept(System.out::println)
            .join();
    }
}`,
        csharp: `using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        using (var client = new HttpClient())
        {
            client.DefaultRequestHeaders.Authorization = 
                new AuthenticationHeaderValue("Bearer", "${apiKey || 'YOUR_API_KEY'}");
            
            var response = await client.GetAsync("https://api.dealpulse.com/api/cars/car_123abc/price-history");
            var content = await response.Content.ReadAsStringAsync();
            
            Console.WriteLine(content);
        }
    }
}`,
        go: `package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
)

func main() {
	req, _ := http.NewRequest("GET", "https://api.dealpulse.com/api/cars/car_123abc/price-history", nil)
	req.Header.Add("Authorization", "Bearer ${apiKey || 'YOUR_API_KEY'}")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer resp.Body.Close()

	body, _ := ioutil.ReadAll(resp.Body)
	fmt.Println(string(body))
}`
      },
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
      code: {
        curl: `curl -X POST "https://api.dealpulse.com/api/cars" \\
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
        javascript: `// Using fetch
fetch("https://api.dealpulse.com/api/cars", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${apiKey || 'YOUR_API_KEY'}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    brand: "Honda",
    model: "Accord",
    engine_type: "1.5L Turbo",
    year: "2023",
    color: "Blue",
    url: "https://example.com/honda-accord-2023"
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error("Error:", error));`,
        python: `import requests
import json

url = "https://api.dealpulse.com/api/cars"
headers = {
    "Authorization": "Bearer ${apiKey || 'YOUR_API_KEY'}",
    "Content-Type": "application/json"
}
payload = {
    "brand": "Honda",
    "model": "Accord",
    "engine_type": "1.5L Turbo",
    "year": "2023",
    "color": "Blue",
    "url": "https://example.com/honda-accord-2023"
}

response = requests.post(url, headers=headers, data=json.dumps(payload))
data = response.json()
print(data)`,
        ruby: `require 'net/http'
require 'uri'
require 'json'

uri = URI.parse("https://api.dealpulse.com/api/cars")
request = Net::HTTP::Post.new(uri)
request["Authorization"] = "Bearer ${apiKey || 'YOUR_API_KEY'}"
request["Content-Type"] = "application/json"
request.body = {
  brand: "Honda",
  model: "Accord",
  engine_type: "1.5L Turbo",
  year: "2023",
  color: "Blue",
  url: "https://example.com/honda-accord-2023"
}.to_json

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts JSON.parse(response.body)`,
        php: `<?php
$ch = curl_init();

$data = array(
    "brand" => "Honda",
    "model" => "Accord",
    "engine_type" => "1.5L Turbo",
    "year" => "2023",
    "color" => "Blue",
    "url" => "https://example.com/honda-accord-2023"
);

curl_setopt($ch, CURLOPT_URL, "https://api.dealpulse.com/api/cars");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    "Authorization: Bearer ${apiKey || 'YOUR_API_KEY'}",
    "Content-Type: application/json"
));

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
print_r($data);
?>`,
        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class AddCar {
    public static void main(String[] args) {
        String jsonBody = """
            {
                "brand": "Honda",
                "model": "Accord",
                "engine_type": "1.5L Turbo",
                "year": "2023",
                "color": "Blue",
                "url": "https://example.com/honda-accord-2023"
            }
            """;
        
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://api.dealpulse.com/api/cars"))
            .header("Authorization", "Bearer ${apiKey || 'YOUR_API_KEY'}")
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
            .build();

        client.sendAsync(request, HttpResponse.BodyHandlers.ofString())
            .thenApply(HttpResponse::body)
            .thenAccept(System.out::println)
            .join();
    }
}`,
        csharp: `using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        using (var client = new HttpClient())
        {
            client.DefaultRequestHeaders.Authorization = 
                new AuthenticationHeaderValue("Bearer", "${apiKey || 'YOUR_API_KEY'}");
            
            var jsonBody = @"{
                ""brand"": ""Honda"",
                ""model"": ""Accord"",
                ""engine_type"": ""1.5L Turbo"",
                ""year"": ""2023"",
                ""color"": ""Blue"",
                ""url"": ""https://example.com/honda-accord-2023""
            }";
            
            var content = new StringContent(jsonBody, Encoding.UTF8, "application/json");
            var response = await client.PostAsync("https://api.dealpulse.com/api/cars", content);
            var responseContent = await response.Content.ReadAsStringAsync();
            
            Console.WriteLine(responseContent);
        }
    }
}`,
        go: `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
)

func main() {
	data := map[string]string{
		"brand":       "Honda",
		"model":       "Accord",
		"engine_type": "1.5L Turbo",
		"year":        "2023",
		"color":       "Blue",
		"url":         "https://example.com/honda-accord-2023",
	}
	
	jsonData, _ := json.Marshal(data)
	
	req, _ := http.NewRequest("POST", "https://api.dealpulse.com/api/cars", bytes.NewBuffer(jsonData))
	req.Header.Add("Authorization", "Bearer ${apiKey || 'YOUR_API_KEY'}")
	req.Header.Add("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer resp.Body.Close()

	body, _ := ioutil.ReadAll(resp.Body)
	fmt.Println(string(body))
}`
      },
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

  const languageOptions = [
    { value: 'curl', label: 'cURL' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'php', label: 'PHP' },
    { value: 'java', label: 'Java' },
    { value: 'csharp', label: 'C#' },
    { value: 'go', label: 'Go' },
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
                    onClick={toggleShowApiKey}
                    className="gap-1"
                  >
                    {showApiKey ? (
                      <><EyeOff className="h-4 w-4" /> Hide</>
                    ) : (
                      <><Eye className="h-4 w-4" /> Show</>
                    )}
                  </Button>
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
                {showApiKey ? apiKey || 'No API key generated yet' : maskedApiKey}
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
                      Authorization: Bearer {showApiKey ? apiKey || 'YOUR_API_KEY' : 'YOUR_API_KEY'}
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
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Programming Language</label>
                  <Select value={codeLanguage} onValueChange={(value) => setCodeLanguage(value as CodeLanguage)}>
                    <SelectTrigger className="w-full md:w-64">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
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
                              <pre className="text-xs font-mono overflow-x-auto">{example.code[codeLanguage]}</pre>
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
