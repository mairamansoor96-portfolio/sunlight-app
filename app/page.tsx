import { Studio } from "@/components/Studio";

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="masthead">
        <p className="wordmark">
          <span className="wordmark__sun" aria-hidden="true" />
          Sunlight
        </p>
      </header>

      <main id="main" className="page">
        <section className="hero" aria-labelledby="hero-title">
          <h1 id="hero-title" className="hero__title">
            Looks great on your monitor. <em>Let&rsquo;s go outside.</em>
          </h1>
          <p className="hero__lede">
            Accessibility is about circumstances, not only disabilities. Drop in a screenshot and see it the way people
            actually use it: in bed at 1% brightness, without their glasses, or telling red from green.
          </p>
        </section>

        <Studio />

        <aside className="limits" aria-labelledby="limits-title">
          <h2 id="limits-title" className="limits__title">
            What this can&rsquo;t show you
          </h2>
          <p>
            A screenshot can&rsquo;t show how your layout reflows when someone sets large text on their phone. Every
            condition carries a label so you know how far to trust it: <strong>Measured</strong>,{" "}
            <strong>Modelled</strong> or <strong>Illustrative</strong>.
          </p>
        </aside>
      </main>

      <footer className="footer">
        <p>
          Sunlight&rsquo;s own interface is built to pass every test it offers. Go on: screenshot this page and run
          Sunlight through Sunlight.
        </p>
      </footer>
    </>
  );
}
