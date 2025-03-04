import { Link } from "wouter";

export default function ImprintPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12">
        <Link href="/">
          <a className="logo text-2xl text-primary mb-8 inline-block">Eva Harper</a>
        </Link>
        
        <h1 className="text-4xl font-bold mb-8">Legal Notice (Imprint)</h1>
        
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
