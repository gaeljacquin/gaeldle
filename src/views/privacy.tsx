export default function Privacy() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex-1">
        <div className="container max-w-4xl py-6 lg:py-10">
          <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:gap-8">
            <div className="flex-1 space-y-4">
              <h1 className="inline-block font-heading text-4xl tracking-tight lg:text-5xl">
                Privacy Policy
              </h1>
              <p className="text-xl text-muted-foreground">Last updated: 2024.09.02</p>
            </div>
          </div>
          {/* <Separator className="my-4 md:my-6" /> */}
          <>
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <section>
                <h2>Introduction</h2>
                <p>
                  At Gaeldle, we are committed to protecting your privacy and ensuring you have a
                  positive experience on our website. This policy outlines our practices concerning
                  the collection, use, and sharing of your information.
                </p>
              </section>
              <section>
                <h2>1. Information We Collect</h2>
                <p>We may collect information in the following ways: </p>
                <ul>
                  <li>Information you provide to us directly when using our services.</li>
                  <li>
                    Information we collect automatically through cookies and similar technologies.
                  </li>
                  <li>Information we receive from third-party authentication services.</li>
                </ul>
                <p>This information may include:</p>
                <ul>
                  <li>Email address (when signing in through third-party services).</li>
                  <li>User name or ID associated with your third-party account.</li>
                  <li>Usage data and preferences.</li>
                  <li>Device and browser information.</li>
                </ul>
              </section>
              <section>
                <h2>2. How We Use Your Information</h2>
                <p>We may use your information for purposes including: </p>
                <ul>
                  <li>Providing and improving our services</li>
                  <li>Communicating with you about our services</li>
                  <li>Personalizing your experience</li>
                  <li>Analyzing usage patterns to improve our website</li>
                  <li>Displaying personalized advertisements</li>
                  <li>Managing your account and ensuring secure authentication</li>
                </ul>
              </section>
              <section>
                <h2>3. Cookies and Advertising</h2>
                <p>
                  We may use cookies and similar tracking technologies to track activity on our
                  website and hold certain information. Cookies are files with a small amount of
                  data which may include an anonymous unique identifier.
                </p>
                <p>
                  We may use cookies for advertising purposes. This means that we may use
                  information collected through cookies to show you targeted advertisements on our
                  website or on third-party websites.
                </p>
                <p>
                  You can instruct your browser to refuse all cookies or to indicate when a cookie
                  is being sent. However, if you do not accept cookies, you may not be able to use
                  some portions of our service.
                </p>
              </section>
              <section>
                <h2>4. Third-Party Authentication Services</h2>
                <p>
                  We may offer the option to sign in using third-party authentication services. When
                  you choose to sign in using a third-party service, we may receive and store
                  certain information from that service, such as your email address, user name, or
                  user ID associated with that account.
                </p>
                <p>
                  The information we receive depends on your settings with the third-party service
                  and their privacy policy. We use this information for account management,
                  communication purposes, and to enhance your user experience on Gaeldle.
                </p>
                <p>
                  Please note that while we protect the information we receive, we do not control
                  the privacy practices of these third-party services. We encourage you to review
                  the privacy policies of any third-party service you use to sign in to Gaeldle.
                </p>
              </section>
              <section>
                <h2>5. Data Storage and Security</h2>
                <p>
                  We implement a variety of security measures to maintain the safety of your
                  personal information. However, no method of transmission over the Internet, or
                  method of electronic storage is 100% secure.
                </p>
              </section>
              <section>
                <h2>6. Changes to This Privacy Policy</h2>
                <p>
                  We may update our Privacy Policy from time to time. We will notify you of any
                  changes by posting the new Privacy Policy on this page and updating the &quot;Last
                  Updated&quot; date.
                </p>
              </section>
              <section>
                <h2>7. Contact Us</h2>
                <p>
                  If you have any questions about this Privacy Policy, please contact us at: contact
                  [at] gaeljacquin [dot] com
                </p>
              </section>
            </div>
          </>
        </div>
      </div>
    </div>
  );
}
