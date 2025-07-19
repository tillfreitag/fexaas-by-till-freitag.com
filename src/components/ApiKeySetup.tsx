
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Key, Eye, EyeOff, ExternalLink } from "lucide-react";
import { CrawlerService } from "@/services/CrawlerService";
import { sanitizeErrorMessage } from "@/utils/securityConfig";

interface ApiKeySetupProps {
  onApiKeySet: () => void;
}

export const ApiKeySetup = ({ onApiKeySet }: ApiKeySetupProps) => {
  const [apiKey, setApiKey] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your Firecrawl API key",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    
    try {
      const isValid = await CrawlerService.testApiKey(apiKey);
      
      if (isValid) {
        CrawlerService.saveApiKey(apiKey);
        toast({
          title: "API Key Saved",
          description: "Your Firecrawl API key has been validated and saved successfully!",
        });
        onApiKeySet();
      } else {
        toast({
          title: "Invalid API Key",
          description: "The API key you entered is not valid. Please check and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Validation Error",
        description: sanitizeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card className="max-w-lg mx-auto shadow-lg border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="text-center">
        <div className="mx-auto p-3 bg-blue-100 rounded-full w-fit mb-4">
          <Key className="h-8 w-8 text-blue-600" />
        </div>
        <CardTitle className="text-2xl">Setup Firecrawl API</CardTitle>
        <CardDescription className="text-base">
          To crawl real websites, you'll need a Firecrawl API key. 
          <br />
          <a 
            href="https://firecrawl.link/tillfreitag" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium mt-2"
          >
            Get your free API key here
            <ExternalLink className="h-4 w-4" />
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="apiKey" className="text-sm font-medium">
              Firecrawl API Key
            </label>
            <div className="relative">
              <Input
                id="apiKey"
                type={isVisible ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="fc-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="pr-10"
                disabled={isValidating}
                maxLength={200}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setIsVisible(!isVisible)}
              >
                {isVisible ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            disabled={isValidating}
          >
            {isValidating ? "Validating..." : "Save & Continue"}
          </Button>
        </form>
        
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>Security:</strong> Your API key is stored locally in your browser and never sent to our servers.
            All connections use HTTPS encryption.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
