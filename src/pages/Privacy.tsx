
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Datenschutzerklärung</h1>
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
            <CardTitle className="text-2xl">Datenschutzerklärung</CardTitle>
            <p className="text-sm text-gray-600">Zuletzt aktualisiert: {new Date().toLocaleDateString('de-DE')}</p>
          </CardHeader>
          <CardContent className="space-y-6 prose max-w-none">
            <section>
              <h3 className="text-lg font-semibold mb-3">1. Verantwortlicher</h3>
              <p className="text-gray-700">
                [Hier müssen Sie Ihre Kontaktdaten als Verantwortlicher eintragen - Name, Adresse, E-Mail, Telefon gemäß Art. 13 DSGVO]
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">2. Erhebung und Verarbeitung personenbezogener Daten</h3>
              <p className="text-gray-700">
                Unsere Anwendung FEXaaS verarbeitet folgende Daten:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Von Ihnen eingegebene Website-URLs zur FAQ-Extraktion</li>
                <li>Lokal in Ihrem Browser gespeicherte API-Schlüssel (localStorage)</li>
                <li>Technische Daten zur Bereitstellung des Dienstes</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">3. API-Schlüssel und externe Dienste</h3>
              <p className="text-gray-700">
                Unsere Anwendung nutzt externe APIs:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>OpenAI API:</strong> Zur intelligenten FAQ-Extraktion. Ihre API-Schlüssel werden nur lokal in Ihrem Browser gespeichert.</li>
                <li><strong>Firecrawl API:</strong> Zum Crawlen von Websites. Auch diese API-Schlüssel bleiben lokal in Ihrem Browser.</li>
              </ul>
              <p className="text-gray-700 mt-2">
                Wir haben keinen Zugriff auf Ihre API-Schlüssel. Diese werden ausschließlich in Ihrem Browser gespeichert und direkt an die jeweiligen Dienste übertragen.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">4. Rechtsgrundlage</h3>
              <p className="text-gray-700">
                Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO zur Vertragserfüllung bzw. zur Durchführung vorvertraglicher Maßnahmen.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">5. Ihre Rechte</h3>
              <p className="text-gray-700">
                Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. 
                Außerdem haben Sie das Recht, sich bei einer Aufsichtsbehörde zu beschweren.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">6. Kontakt</h3>
              <p className="text-gray-700">
                Bei Fragen zum Datenschutz wenden Sie sich bitte an: [Ihre E-Mail-Adresse]
              </p>
            </section>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-yellow-800">
                <strong>Hinweis:</strong> Diese Datenschutzerklärung ist ein Template. Vor dem Live-Gang der Website sollten Sie diese von einem Anwalt prüfen und an Ihre spezifischen Gegebenheiten anpassen lassen.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;
