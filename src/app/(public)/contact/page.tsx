import { ContactForm } from "@/features/contact/components/contact-form";

export const metadata = {
  title: "Contact Us",
  description:
    "Send a message to Saugatuck Douglas Garden Club leadership regarding membership, Garden Walk tickets, or community plantings.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      <div className="text-center space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          We&apos;d Love to Hear From You
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground">Contact Us</h1>
        <p className="max-w-xl mx-auto text-base text-muted-foreground">
          Have inquiries about club activities, Garden Walk advance tickets, community plantings, or
          joining as a new member?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-serif text-lg font-bold text-foreground">Mailing Address</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Saugatuck Douglas Garden Club
              <br />
              P.O. Box 1011
              <br />
              Douglas, MI 49406
            </p>
          </div>

          <div>
            <h3 className="font-serif text-lg font-bold text-foreground">Connect Online</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Follow our community garden updates, blooming highlights, and volunteer workbee
              announcements:
            </p>
            <a
              href="https://www.facebook.com/profile.php?id=100064728277239"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-xs text-primary font-semibold hover:underline mt-2"
            >
              <span>Facebook Page &rarr;</span>
            </a>
          </div>

          <div className="border-t border-border pt-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">501(c)(3) Nonprofit</p>
            <p className="mt-1">
              All donations and Garden Walk ticket proceeds support community beautification and
              youth horticultural scholarships.
            </p>
          </div>
        </div>

        <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
