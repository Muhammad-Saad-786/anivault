// src/pages/DMCA.jsx
import SEO from "@/components/SEO";

export default function DMCA() {
  return (
    <>
      <SEO
        title="DMCA / Copyright"
        description="How to submit a DMCA takedown notice for content on AniVault."
      />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black sm:text-4xl">DMCA Notice</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Last updated:{" "}
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <div className="prose prose-invert mt-8 max-w-none prose-headings:font-bold prose-headings:text-text-primary prose-p:text-text-secondary prose-li:text-text-secondary prose-a:text-brand">
          <h2>AniVault's Position on Copyright</h2>
          <p>
            AniVault respects intellectual property rights. We do not host,
            upload, or store any anime video content on our servers.
          </p>

          <h2>How Streaming Works</h2>
          <p>
            AniVault embeds video players from independent third-party services.
            All video content is delivered by these third parties directly to
            your browser. We do not have access to, control over, or knowledge
            of the video files being streamed.
          </p>

          <h2>Filing a DMCA Notice</h2>
          <p>
            If you are a copyright owner or authorized agent and believe that
            content accessible via AniVault infringes your copyright, you may
            submit a DMCA notice to{" "}
            <a href="mailto:dmca@anivault.app">dmca@anivault.app</a>.
          </p>

          <p>Your notice must include:</p>
          <ol>
            <li>
              A physical or electronic signature of the copyright owner or
              authorized agent.
            </li>
            <li>
              Identification of the copyrighted work claimed to have been
              infringed.
            </li>
            <li>
              Identification of the material that is claimed to be infringing,
              including a URL so we can locate it.
            </li>
            <li>Your contact information (address, telephone, email).</li>
            <li>
              A statement that you have a good-faith belief that the use is not
              authorized by the copyright owner, its agent, or the law.
            </li>
            <li>
              A statement, under penalty of perjury, that the information in
              your notice is accurate and that you are authorized to act on
              behalf of the copyright owner.
            </li>
          </ol>

          <h2>What We Can Do</h2>
          <p>
            Because we do not host the content, the most effective action is
            contacting the third-party providers directly. However, we will:
          </p>
          <ul>
            <li>
              Remove any links or embeds that a valid DMCA notice identifies
            </li>
            <li>
              Cease any embedding of a provider that repeatedly violates
              copyright
            </li>
            <li>Cooperate fully with legitimate copyright investigations</li>
          </ul>

          <h2>Counter-Notices</h2>
          <p>
            If you believe your content was mistakenly removed, you may submit a
            counter-notice to the same address with equivalent detail.
          </p>

          <h2>Contact</h2>
          <p>
            DMCA agent:{" "}
            <a href="mailto:saadasimmalik@gmail.com">saadasimmalik@gmail.com</a>
          </p>
        </div>
      </div>
    </>
  );
}
