
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  FEXaaS
                </h3>
                <p className="text-sm text-gray-600">FAQ Extractor as a Service</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 max-w-xs">
              Intelligent FAQ extraction from any website using AI-powered analysis and real-time website crawling.
            </p>
          </div>

          {/* Links Section */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Legal</h4>
            <div className="space-y-2">
              <Link 
                to="/privacy" 
                className="block text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                Datenschutzerklärung
              </Link>
              <Link 
                to="/imprint" 
                className="block text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                Impressum
              </Link>
            </div>
          </div>

          {/* Contact Section */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Service</h4>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                AI-powered FAQ extraction
              </p>
              <p className="text-sm text-gray-600">
                Real-time website crawling
              </p>
              <p className="text-sm text-gray-600">
                Export to Excel & CSV
              </p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 mt-8 pt-6 text-center">
          <p className="text-sm text-gray-600">
            © {currentYear} FEXaaS. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
