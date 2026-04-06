#!/usr/bin/env bun
import { build } from "bun";
import { existsSync, mkdirSync, cpSync } from "fs";
import { join } from "path";

// Ensure dist directory exists
if (!existsSync("./dist")) {
  mkdirSync("./dist", { recursive: true });
}

// Build the CLI
const result = await build({
  entrypoints: ["./src/entrypoints/cli.tsx"],
  outdir: "./dist",
  target: "node",
  format: "esm",
  splitting: false,
  sourcemap: "external",
  minify: true,
  external: [
    "@anthropic-ai/sdk",
    "react",
    "react-dom",
    "ink",
    "zod",
    "axios",
    "ws",
    "chalk",
    "glob",
    "diff",
    "semver",
    "keytar",
    "node:*",
    "bun:*"
  ],
  define: {
    "process.env.NODE_ENV": "\"production\"",
  },
});

if (result.success) {
  console.log("✅ Build successful!");
  console.log("📦 Output files:");
  for (const file of result.outputs) {
    console.log(`  - ${file.path}`);
  }
  
  // Copy vendor directory
  if (existsSync("./vendor")) {
    cpSync("./vendor", "./dist/vendor", { recursive: true });
    console.log("📁 Copied vendor directory");
  }
  
  // Create cli.js entry point
  const fs = await import("fs");
  fs.writeFileSync("./dist/cli.js", `#!/usr/bin/env node\nimport "./cli.js";\n`);
  
  console.log("✅ Build complete!");
} else {
  console.error("❌ Build failed:");
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}
