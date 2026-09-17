// src/pages/Terms.jsx
import SEO from "@/components/SEO";

export default function Terms() {
  return (
    <>
      <SEO
        title="Terms of Service"
        description="AniVault terms of service — the rules for using our anime tracking, discovery, and streaming platform."
      />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black sm:text-4xl">Terms of Service</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Last updated:{" "}
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <div className="prose prose-invert mt-8 max-w-none prose-headings:font-bold prose-headings:text-text-primary prose-p:text-text-secondary prose-li:text-text-secondary prose-a:text-brand">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using AniVault ("the Service"), you agree to be
            bound by these Terms. If you do not agree, do not use the Service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            AniVault is a web application for anime discovery, tracking, and
            streaming. Anime metadata is provided by AniList. Streaming sources
            are embedded from third-party providers and are not hosted by
            AniVault.
          </p>

          <h2>3. User Accounts</h2>
          <p>
            You are responsible for maintaining the security of your account and
            password. You must be at least 13 years old to use the Service.
          </p>

          <h2>4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any illegal purpose</li>
            <li>
              Attempt to gain unauthorized access to any part of the Service
            </li>
            <li>Scrape, crawl, or automate access beyond normal usage</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Upload malicious content or spam</li>
          </ul>

          <h2>5. User Content</h2>
          <p>
            You retain ownership of reviews, lists, and other content you
            create. By posting content, you grant AniVault a non-exclusive
            license to display it on the platform. You are responsible for
            ensuring your content does not infringe on third-party rights.
          </p>

          <h2>6. Third-Party Content</h2>
          <p>
            AniVault does not host anime video content. All streaming is
            provided by third-party embeds. We are not responsible for the
            availability, legality, or content of third-party services.
          </p>

          <h2>7. Disclaimer</h2>
          <p>
            The Service is provided "as is" without warranty of any kind.
            AniVault is not liable for any damages arising from use of the
            Service.
          </p>

          <h2>8. Changes to Terms</h2>
          <p>
            We may update these Terms at any time. Continued use of the Service
            constitutes acceptance of the updated Terms.
          </p>

          <h2>9. Contact</h2>
          <p>
            For questions about these Terms, contact us at{" "}
            <a href="mailto:saadasimmalik@gmail.com">saadasimmalik@gmail.com</a>
            .
          </p>
        </div>
      </div>
    </>
  );
}
