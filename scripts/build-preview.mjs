// Bundles the app into one self-contained HTML page (React included, no
// server, no framework runtime) for sharing a private preview, e.g. as a
// claude.ai Artifact. Output: preview/index.html + preview/sample-screenshot.png.
import { build } from "esbuild";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const out = `${root}preview`;

const result = await build({
  stdin: {
    contents: `
      import { createRoot } from "react-dom/client";
      import Home from "@/app/page";
      createRoot(document.getElementById("sunlight-root")).render(<Home />);
    `,
    loader: "tsx",
    resolveDir: root,
  },
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  alias: { "@": root },
  loader: { ".css": "empty" },
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "error",
  write: false,
});

const css = await readFile(`${root}app/globals.css`, "utf8");
const js = result.outputFiles[0].text.replaceAll("</script", "<\\/script");

await mkdir(out, { recursive: true });
await writeFile(
  `${out}/index.html`,
  `<title>Sunlight</title>
<style>${css}</style>
<div id="sunlight-root"></div>
<script>${js}</script>
`,
);
await copyFile(`${root}public/sample-screenshot.png`, `${out}/sample-screenshot.png`);
console.log(`Wrote ${out}/index.html`);
