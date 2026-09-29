import { LiveHero } from "@/components/LiveHero";
import { Studio } from "@/components/Studio";

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="page">
        <header className="mast">
          <p className="wordmark">
            <span className="wordmark__disc" aria-hidden="true" />
            Sunlight
          </p>
          <p className="reading">Your interface, outdoors</p>
        </header>

        <main id="main">
          <section className="hero">
            <LiveHero />
            <p className="hero__lede">
              Accessibility is about circumstances, not only disabilities. Drop in a screenshot and see it the way
              people actually use it: in bed at low brightness, without their glasses, or telling red from green.
            </p>
          </section>

          <Studio />

          <aside className="limits" aria-labelledby="limits-title">
            <h2 id="limits-title" className="label">
              What this can&rsquo;t show you
            </h2>
            <p>
              A screenshot can&rsquo;t show how your layout reflows when someone sets large text on their phone.
              Every condition carries a trust mark so you know how far to rely on it: Measured, Modelled or
              Illustrative.
            </p>
          </aside>
        </main>

        <footer className="foot">
          <p className="reading">
            Sunlight&rsquo;s own interface passes every test it offers. Screenshot this page and run Sunlight through
            Sunlight.
          </p>
          <p className="reading">Type: Optician Sans (OFL), Atkinson Hyperlegible Next and Mono (OFL)</p>
        </footer>
      </div>
    </>
  );
}
