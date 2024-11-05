import { Separator } from "@/components/ui/separator";

export default function Tos() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex-1">
        <div className="container max-w-4xl py-6 lg:py-10">
          <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:gap-8">
            <div className="flex-1 space-y-4">
              <h1 className="inline-block font-heading text-4xl tracking-tight lg:text-5xl">
                Terms of Service
              </h1>
              <p className="text-xl text-muted-foreground">
                Last updated: 2024.09.02
              </p>
            </div>
          </div>
          <Separator className="my-4 md:my-6" />
          <>
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <section>
                <h2>Introduction</h2>
                <p>
                  Welcome to Gaeldle (&quot;Company&quot;, &quot;we&quot;,
                  &quot;our&quot;, &quot;us&quot;). By accessing or using our
                  website and services, you agree to be bound by these Terms of
                  Service (&quot;Terms&quot;). If you disagree with any part of
                  these Terms, you may not use our service.
                </p>
              </section>
              <section>
                <h2>1. Acceptance of Terms</h2>
                <p>
                  By using Gaeldle, you agree to these Terms and our Privacy
                  Policy. If you are using the service on behalf of an
                  organization, you agree to these Terms on behalf of that
                  organization.
                </p>
              </section>
              <section>
                <h2>2. Description of Service</h2>
                <p>
                  Gaeldle is a daily online game where users attempt to guess
                  the name of a game based on their cover image or related
                  artwork that have been pixelated.
                </p>
              </section>
              <section>
                <h2>3. User Accounts</h2>
                <ul>
                  <li>
                    3.1. You may be required to create an account to access
                    certain features of Gaeldle.
                  </li>
                  <li>
                    3.2. You are responsible for maintaining the confidentiality
                    of your account information.
                  </li>
                  <li>
                    3.3. You are responsible for all activities that occur under
                    your account.
                  </li>
                </ul>
              </section>
              <section>
                <h2>4. User Conduct</h2>
                <p>You agree not to:</p>
                <ul>
                  <li>
                    Use the service for any unlawful purpose or in violation of
                    these Terms.
                  </li>
                  <li>
                    Attempt to gain unauthorized access to any part of the
                    service.
                  </li>
                  <li>
                    Interfere with or disrupt the service or servers connected
                    to the service.
                  </li>
                  <li>
                    Share solutions or spoilers in a manner that ruins the
                    experience for other users.
                  </li>
                </ul>
              </section>
              <section>
                <h2>5. Intellectual Property</h2>
                <ul>
                  <li>
                    5.1. The content, organization, graphics, design, and other
                    matters related to Gaeldle are protected under applicable
                    copyrights and other proprietary laws.
                  </li>
                  <li>
                    5.2. Any trademarks, service marks, and logos appearing on
                    Gaeldle are the property of their respective owners. Their
                    presence on Gaeldle does not imply any affiliation with or
                    endorsement by Gaeldle unless explicitly stated.
                  </li>
                  <li>
                    5.3. The images used on Gaeldle are the property of their
                    respective copyright holders. These images are used for
                    educational and entertainment purposes under fair use
                    principles. Gaeldle does not claim ownership of these
                    images.
                  </li>
                  <li>
                    5.4. Users acknowledge that the images and any trademarks
                    appearing on the site are protected by copyright and
                    trademark laws and are only to be viewed as part of gameplay
                    on Gaeldle. Any reproduction, distribution, or use of these
                    images or trademarks outside of normal gameplay is strictly
                    prohibited.
                  </li>
                  <li>
                    5.5. Gaeldle respects the intellectual property rights of
                    others. If you believe that any content on our site
                    infringes upon your copyright or trademark rights, please
                    contact us at contact [at] gaeljacquin [dot] com with
                    details of the alleged infringement.
                  </li>
                </ul>
              </section>
              <section>
                <h2>6. Limitation of Liability</h2>
                <p>
                  To the fullest extent permitted by law, Gaeldle shall not be
                  liable for any indirect, incidental, special, consequential,
                  or punitive damages resulting from your access to or use of,
                  or inability to access or use, the service.
                </p>
              </section>
              <section>
                <h2>7. Changes to Terms</h2>
                <p>
                  We reserve the right to modify these Terms at any time. We
                  will provide notice of significant changes by posting a notice
                  on our homepage.
                </p>
              </section>
              <section>
                <h2>8. Termination</h2>
                <p>
                  We reserve the right to terminate or suspend your account and
                  access to the service at our sole discretion, without notice,
                  for conduct that we believe violates these Terms or is harmful
                  to other users, us, or third parties, or for any other reason.
                </p>
              </section>
              <section>
                <h2>9. Governing Law</h2>
                <p>
                  The validity, construction, and application of the Agreement
                  will be governed by the internal laws of the Province of
                  Ontario, excluding its conflict of laws provisions.
                </p>
              </section>
              <section>
                <h2>10. Contact Information</h2>
                <p>
                  For any questions about these Terms, please contact us at
                  contact [at] gaeljacquin [dot] com
                </p>
              </section>
              <p>
                By using Gaeldle, you acknowledge that you have read,
                understood, and agree to be bound by these Terms of Service.
              </p>
            </div>
          </>
        </div>
      </div>
    </div>
  );
}
