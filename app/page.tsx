import { Studio } from "@/components/Studio";

/** The hero is set as an eye chart: each line smaller, with its Snellen acuity in the margin. */
const CHART = [
  { text: "Looks", acuity: "20/200" },
  { text: "great on", acuity: "20/100" },
  { text: "your monitor", acuity: "20/50" },
  { text: "Let’s go outside", acuity: "20/20" },
];

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
          <section className="hero" aria-labelledby="hero-title">
            <h1 id="hero-title" className="chart">
              <span className="visually-hidden">Looks great on your monitor. Let&rsquo;s go outside.</span>
              {CHART.map((line) => (
                <span key={line.acuity} className="chart__line" aria-hidden="true">
                  <span className="chart__text">{line.text}</span>
                  <span className="chart__acuity">{line.acuity}</span>
                </span>
              ))}
            </h1>
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
