import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Globe, Download, Edit, Zap, Search, FileText, Settings, AlertCircle, ExternalLink } from "lucide-react";
import { FAQTable } from "@/components/FAQTable";
import { ApiKeySetup } from "@/components/ApiKeySetup";
import { OpenAIKeySetup } from "@/components/OpenAIKeySetup";
import { extractFAQs } from "@/utils/faqExtractor";
import { exportToExcel, exportToCSV } from "@/utils/exportUtils";
import { CrawlerService } from "@/services/CrawlerService";
import { OpenAIService } from "@/services/OpenAIService";
import type { FAQItem } from "@/types/faq";
import Footer from "@/components/Footer";

const Index = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractionStep, setExtractionStep] = useState("");
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [hasResults, setHasResults] = useState(false);
  const [needsFirecrawlKey, setNeedsFirecrawlKey] = useState(!CrawlerService.hasApiKey());
  const [showOpenAISetup, setShowOpenAISetup] = useState(false);
  const { toast } = useToast();

  const handleFirecrawlKeySet = () => {
    setNeedsFirecrawlKey(false);
    toast({
      title: "Firecrawl Ready",
      description: "You can now crawl real websites!",
    });
  };

  const handleOpenAIKeySet = () => {
    setShowOpenAISetup(false);
    toast({
      title: "AI Extraction Ready",
      description: "You can now use AI-powered FAQ extraction!",
    });
  };

  const handleSetupAI = () => {
    console.log('Setup AI button clicked');
    console.log('Current OpenAI key status:', OpenAIService.hasApiKey());
    setShowOpenAISetup(true);
  };

  const handleExtract = async () => {
    if (!url) {
      toast({
        title: "URL Required",
        description: "Please enter a valid URL to extract FAQs from.",
        variant: "destructive",
      });
      return;
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      toast({
        title: "Invalid URL",
        description: "Please enter a URL starting with http:// or https://",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setHasResults(false);
    setExtractionStep("Initializing...");

    // Simulate crawling progress with more detailed status
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 30) {
          setExtractionStep(CrawlerService.hasApiKey() ? "🌐 Crawling website with Firecrawl..." : "📄 Generating demo data...");
        } else if (prev < 60) {
          setExtractionStep("📝 Processing content...");
        } else if (prev < 90) {
          setExtractionStep(OpenAIService.hasApiKey() ? "🤖 AI analyzing content with OpenAI..." : "⚙️ Basic FAQ extraction...");
        }
        
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
      const extractedFAQs = await extractFAQs(url);
      setFaqs(extractedFAQs);
      setProgress(100);
      setExtractionStep("✅ Extraction complete!");
      setHasResults(true);
      
      const extractionMethod = OpenAIService.hasApiKey() ? "AI-powered extraction" : "basic extraction";
      const crawlMethod = CrawlerService.hasApiKey() ? "real website crawling" : "demo mode";
      
      toast({
        title: "Extraction Complete",
        description: `Successfully extracted ${extractedFAQs.length} FAQ items using ${extractionMethod} with ${crawlMethod}`,
      });
    } catch (error) {
      console.error('FAQ extraction error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during extraction';
      
      setExtractionStep("❌ Extraction failed");
      
      toast({
        title: "Extraction Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      clearInterval(progressInterval);
    }
  };

  const handleExportExcel = () => {
    exportToExcel(faqs, url);
    toast({
      title: "Excel Export",
      description: "FAQ data exported to Excel successfully!",
    });
  };

  const handleExportCSV = () => {
    exportToCSV(faqs, url);
    toast({
      title: "CSV Export", 
      description: "FAQ data exported to CSV successfully!",
    });
  };

  const handleFAQUpdate = (updatedFaqs: FAQItem[]) => {
    setFaqs(updatedFaqs);
  };

  // Show Firecrawl API key setup if needed
  if (needsFirecrawlKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  FEXaaS
                </h1>
                <p className="text-sm text-muted-foreground">FAQ Extractor as a Service</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 flex-grow">
          <div className="text-center space-y-4 mb-8">
            <h2 className="text-4xl font-bold text-gray-900">
              Setup Website Crawling
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Firecrawl enables real website crawling to extract content from any public URL. Without it, you'll only see demo data.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 max-w-md mx-auto">
              <AlertCircle className="h-4 w-4" />
              <span><strong>Required:</strong> To crawl real websites</span>
            </div>
            <div className="mt-4">
              <a 
                href="https://firecrawl.link/tillfreitag" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                Learn more about Firecrawl
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          <ApiKeySetup onApiKeySet={handleFirecrawlKeySet} />

          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              Don't have an API key? You can still{" "}
              <Button 
                variant="link" 
                className="p-0 h-auto text-blue-600 hover:text-blue-800"
                onClick={() => setNeedsFirecrawlKey(false)}
              >
                try the demo mode
              </Button>
            </p>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // Show OpenAI API key setup overlay if needed
  if (showOpenAISetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 flex flex-col">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    FEXaaS
                  </h1>
                  <p className="text-sm text-muted-foreground">FAQ Extractor as a Service</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowOpenAISetup(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 flex-grow">
          <div className="text-center space-y-4 mb-8">
            <h2 className="text-4xl font-bold text-gray-900">
              Setup AI-Powered Extraction
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              OpenAI enables intelligent FAQ extraction that understands context and finds relevant Q&A pairs in any language or format.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-purple-700 bg-purple-50 border border-purple-200 rounded-lg p-3 max-w-md mx-auto">
              <Zap className="h-4 w-4" />
              <span><strong>Optional:</strong> For smarter FAQ detection</span>
            </div>
          </div>

          <OpenAIKeySetup onApiKeySet={handleOpenAIKeySet} />
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  FEXaaS
                </h1>
                <p className="text-sm text-muted-foreground">FAQ Extractor as a Service</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {CrawlerService.hasApiKey() && (
                <Badge variant="outline" className="text-green-600 border-green-300">
                  <Globe className="h-3 w-3 mr-1" />
                  Real Crawling
                </Badge>
              )}
              {OpenAIService.hasApiKey() && (
                <Badge variant="outline" className="text-purple-600 border-purple-300">
                  <Zap className="h-3 w-3 mr-1" />
                  AI Extraction
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSetupAI}
                className="hover:bg-gray-50 hover:border-gray-300 transition-colors"
                type="button"
              >
                <Settings className="h-4 w-4 mr-1" />
                Setup AI
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8 flex-grow">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold text-gray-900">
            Extract FAQs from Any Website
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {OpenAIService.hasApiKey() && CrawlerService.hasApiKey()
              ? "✨ Full AI-powered extraction with real website crawling"
              : OpenAIService.hasApiKey() 
                ? "🤖 AI-powered extraction with demo data (setup Firecrawl for real crawling)"
                : CrawlerService.hasApiKey() 
                  ? "🌐 Real website crawling with basic extraction (setup OpenAI for AI analysis)"
                  : "📄 Demo mode - setup API keys for full functionality"
            }
          </p>
          {!CrawlerService.hasApiKey() && (
            <div className="mt-4">
              <a 
                href="https://firecrawl.link/tillfreitag" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                Get Firecrawl API for real website crawling
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>

        {/* Input Section */}
        <Card className="max-w-2xl mx-auto shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              Website URL
            </CardTitle>
            <CardDescription>
              Enter any public URL to extract FAQ content from
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
                disabled={isLoading}
              />
              <Button 
                onClick={handleExtract} 
                disabled={isLoading || !url}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isLoading ? (
                  <>
                    <Search className="h-4 w-4 mr-2 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Extract FAQs
                  </>
                )}
              </Button>
            </div>

            {isLoading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{extractionStep}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {CrawlerService.hasApiKey() ? (
                    <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                      <Globe className="h-2 w-2 mr-1" />
                      Firecrawl
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
                      Demo Mode
                    </Badge>
                  )}
                  {OpenAIService.hasApiKey() ? (
                    <Badge variant="outline" className="text-purple-600 border-purple-300 text-xs">
                      <Zap className="h-2 w-2 mr-1" />
                      OpenAI
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-600 border-gray-300 text-xs">
                      Basic Extraction
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features Grid */}
        {!hasResults && (
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 transition-all duration-200">
              <CardContent className="p-6 text-center">
                <Zap className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">AI-Powered Extraction</h3>
                <p className="text-sm text-gray-600">
                  {OpenAIService.hasApiKey() 
                    ? "✅ Intelligent extraction that understands context and finds relevant FAQs"
                    : "❌ Setup OpenAI API for smart FAQ extraction in any language"
                  }
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 transition-all duration-200">
              <CardContent className="p-6 text-center">
                <Globe className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Real Website Crawling</h3>
                <p className="text-sm text-gray-600">
                  {CrawlerService.hasApiKey() 
                    ? "✅ Crawl any public website to extract actual content"
                    : (
                      <>
                        ❌ Setup{" "}
                        <a 
                          href="https://firecrawl.link/tillfreitag" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          Firecrawl API
                        </a>
                        {" "}to crawl real websites instead of demo data
                      </>
                    )
                  }
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 transition-all duration-200">
              <CardContent className="p-6 text-center">
                <Download className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Export & Edit</h3>
                <p className="text-sm text-gray-600">
                  Edit, sort, filter extracted FAQs and export as Excel or CSV
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results Section */}
        {hasResults && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="text-2xl font-bold">Extracted FAQs</h3>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {faqs.length} items found
                </Badge>
                {OpenAIService.hasApiKey() && (
                  <Badge variant="outline" className="text-purple-600 border-purple-300">
                    <Zap className="h-3 w-3 mr-1" />
                    AI Extracted
                  </Badge>
                )}
                {CrawlerService.hasApiKey() ? (
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    <Globe className="h-3 w-3 mr-1" />
                    Real Website
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Demo Data
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => exportToCSV(faqs, url)}
                  className="hover:bg-green-50 hover:border-green-300"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button 
                  onClick={() => exportToExcel(faqs, url)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </div>

            <Separator />

            <FAQTable 
              faqs={faqs} 
              onUpdate={setFaqs}
            />
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Index;
