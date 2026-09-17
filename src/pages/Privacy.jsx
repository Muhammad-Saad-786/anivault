// src/pages/Privacy.jsx
import SEO from "@/components/SEO";

export default function Privacy() {
  return (
    <>
      <SEO
        title="Privacy Policy"
        description="How AniVault handles your data — minimal collection, no ads, no tracking pixels."
      />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Last updated:{" "}
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <div className="prose prose-invert mt-8 max-w-none prose-headings:font-bold prose-headings:text-text-primary prose-p:text-text-secondary prose-li:text-text-secondary prose-a:text-brand">
          <h2>1. What We Collect</h2>
          <ul>
            <li>
              <strong>Account information:</strong> email address, username, and
              (optionally) display name and avatar. Provided by you or by Google
              OAuth if you sign in that way.
            </li>
            <li>
              <strong>Activity data:</strong> anime you track, episodes watched,
              ratings, reviews, lists, and follows.
            </li>
            <li>
              <strong>Technical data:</strong> IP address, browser user agent,
              and basic request logs for security and abuse prevention.
            </li>
          </ul>

          <h2>2. What We Don't Do</h2>
          <ul>
            <li>We do not sell your data to third parties</li>
            <li>We do not serve ads or use ad networks</li>
            <li>We do not use tracking pixels from social networks</li>
            <li>
              We do not use cookies beyond those required for authentication
            </li>
          </ul>

          <h2>3. Analytics</h2>
          <p>
            We use{" "}
            <a
              href="https://umami.is"
              target="_blank"
              rel="noopener noreferrer"
            >
              Umami
            </a>{" "}
            — a privacy-friendly, cookie-less analytics service. It collects
            aggregate page views and does not identify individual users.
          </p>

          <h2>4. Data Storage</h2>
          <p>
            Your data is stored on{" "}
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Supabase
            </a>{" "}
            (Postgres) with encryption at rest. Authentication is handled by
            Supabase Auth.
          </p>

          <h2>5. Third-Party Services</h2>
          <ul>
            <li>
              <strong>AniList</strong> — provides anime metadata (public data)
            </li>
            <li>
              <strong>Supabase</strong> — database, auth, and file storage
            </li>
            <li>
              <strong>Vercel</strong> — hosting and delivery
            </li>
            <li>
              <strong>Umami Cloud</strong> — privacy-friendly analytics
            </li>
            <li>
              <strong>OpenRouter</strong> — AI model provider for the AI
              assistant
            </li>
          </ul>

          <h2>6. Your Rights</h2>
          <p>You can:</p>
          <ul>
            <li>Export all your data from your account settings</li>
            <li>Delete your account at any time (all data is removed)</li>
            <li>Unsubscribe from all communications</li>
          </ul>

          <h2>7. Children's Privacy</h2>
          <p>
            AniVault is not intended for children under 13. We do not knowingly
            collect data from children under 13.
          </p>

          <h2>8. Changes</h2>
          <p>
            We may update this policy periodically. Material changes will be
            announced via the app.
          </p>

          <h2>9. Contact</h2>
          <p>
            Privacy questions? Email{" "}
            <a href="mailto:privacy@anivault.app">privacy@anivault.app</a>.
          </p>
        </div>
      </div>
    </>
  );
}
