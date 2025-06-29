
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Globe, Download, Edit, Zap, Search, FileText } from "lucide-react";
import { FAQTable } from "@/components/FAQTable";
import { extractFAQs } from "@/utils/faqExtractor";
import { exportToExcel, exportToCSV } from "@/utils/exportUtils";
import type { FAQItem } from "@/types/faq";

const Index = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [hasResults, setHasResults] = useState(false);
  const { toast } = useToast();

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

    // Simulate crawling progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    try {
      // Simulate extraction process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const extractedFAQs = await extractFAQs(url);
      setFaqs(extractedFAQs);
      setProgress(100);
      setHasResults(true);
      
      toast({
        title: "Extraction Complete",
        description: `Found ${extractedFAQs.length} FAQ items from ${url}`,
      });
    } catch (error) {
      toast({
        title: "Extraction Failed",
        description: "Unable to extract FAQs from the provided URL.",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
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

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold text-gray-900">
            Extract FAQs from Any Website
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Crawl websites, extract structured FAQ content, edit in real-time, and export to Excel or CSV
          </p>
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
                  <span>Crawling website...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features Grid */}
        {!hasResults && (
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 transition-all duration-200">
              <CardContent className="p-6 text-center">
                <Search className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Smart Crawling</h3>
                <p className="text-sm text-gray-600">
                  Automatically finds FAQ pages, support sections, and Q&A content
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 transition-all duration-200">
              <CardContent className="p-6 text-center">
                <Edit className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Live Editing</h3>
                <p className="text-sm text-gray-600">
                  Edit, sort, filter, and organize extracted FAQs in real-time
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 transition-all duration-200">
              <CardContent className="p-6 text-center">
                <Download className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Export Options</h3>
                <p className="text-sm text-gray-600">
                  Download as Excel or CSV with metadata and timestamps
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
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleExportCSV}
                  className="hover:bg-green-50 hover:border-green-300"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button 
                  onClick={handleExportExcel}
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
              onUpdate={handleFAQUpdate}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
