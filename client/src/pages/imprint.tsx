import { Link } from "wouter";

export default function ImprintPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12">
        <Link href="/">
          <a className="logo text-2xl text-primary mb-8 inline-block">Eva Harper</a>
        </Link>

        <h1 className="text-4xl font-bold mb-8">Legal Notice (Imprint) & Privacy Policy</h1>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Company Information</h2>
            <p>Eva Harper AI Fashion</p>
            <p>123 Fashion Street</p>
            <p>12345 Berlin</p>
            <p>Germany</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact</h2>
            <p>Email: contact@evaharper.ai</p>
            <p>Phone: +49 (0) 123 456789</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Represented by</h2>
            <p>Eva Harper GmbH</p>
            <p>Managing Director: [Name]</p>
            <p>Commercial Register: HRB XXXXX</p>
            <p>Registration Court: Amtsgericht Berlin</p>
            <p>VAT ID: DE123456789</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Responsible for Content</h2>
            <p>According to § 55 Abs. 2 RStV:</p>
            <p>[Name]</p>
            <p>Eva Harper GmbH</p>
            <p>123 Fashion Street</p>
            <p>12345 Berlin</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Privacy Policy</h2>

            <h3 className="text-xl font-semibold mt-6 mb-3">1. Data Collection</h3>
            <p>We collect the following information:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Email address</li>
              <li>Name</li>
              <li>Usage data</li>
              <li>Images uploaded for fashion analysis</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2. Purpose of Data Collection</h3>
            <p>Your data is collected for:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Providing personalized fashion recommendations</li>
              <li>Account management</li>
              <li>Communication regarding our services</li>
              <li>Service improvement</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3. Data Processing</h3>
            <p>Your data is processed using:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>AI models for fashion analysis</li>
              <li>Secure cloud storage</li>
              <li>Email service providers</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">4. Your Rights</h3>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Access your personal data</li>
              <li>Correct your personal data</li>
              <li>Delete your personal data</li>
              <li>Object to data processing</li>
              <li>Data portability</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">5. Data Security</h3>
            <p>We implement appropriate security measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.</p>

            <h3 className="text-xl font-semibold mt-6 mb-3">6. Contact for Privacy Concerns</h3>
            <p>For any privacy-related concerns, please contact:</p>
            <p>Email: privacy@evaharper.ai</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Dispute Resolution</h2>
            <p>The European Commission provides a platform for online dispute resolution (OS): 
              <a href="https://ec.europa.eu/consumers/odr" className="text-primary hover:underline">
                https://ec.europa.eu/consumers/odr
              </a>
            </p>
            <p>We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board.</p>
          </section>
        </div>
      </main>
    </div>
  );
}