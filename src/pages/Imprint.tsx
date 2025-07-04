
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building } from "lucide-react";
import { Link } from "react-router-dom";

const Imprint = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Impressum</h1>
                <p className="text-sm text-muted-foreground">FEXaaS - FAQ Extractor as a Service</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Impressum</CardTitle>
            <p className="text-sm text-gray-600">Angaben gemäß § 5 TMG</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-3">Anbieter</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2">[Ihr Name/Firmenname]</p>
                <p className="text-gray-700 mb-2">[Straße und Hausnummer]</p>
                <p className="text-gray-700 mb-2">[PLZ Ort]</p>
                <p className="text-gray-700">[Land]</p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">Kontakt</h3>
              <div className="space-y-2">
                <p className="text-gray-700">
                  <strong>E-Mail:</strong> [Ihre E-Mail-Adresse]
                </p>
                <p className="text-gray-700">
                  <strong>Telefon:</strong> [Ihre Telefonnummer]
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">Umsatzsteuer-ID</h3>
              <p className="text-gray-700">
                Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />
                [Ihre USt-IdNr.]
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2">[Name des Verantwortlichen]</p>
                <p className="text-gray-700 mb-2">[Straße und Hausnummer]</p>
                <p className="text-gray-700">[PLZ Ort]</p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">EU-Streitschlichtung</h3>
              <p className="text-gray-700">
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: 
                <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                  https://ec.europa.eu/consumers/odr/
                </a>
              </p>
              <p className="text-gray-700 mt-2">
                Unsere E-Mail-Adresse finden Sie oben im Impressum.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">Verbraucherstreitbeilegung/Universalschlichtungsstelle</h3>
              <p className="text-gray-700">
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </section>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-yellow-800">
                <strong>Hinweis:</strong> Dieses Impressum ist ein Template. Bitte ersetzen Sie alle Platzhalter in eckigen Klammern durch Ihre tatsächlichen Daten, bevor Sie die Website live schalten.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Imprint;
