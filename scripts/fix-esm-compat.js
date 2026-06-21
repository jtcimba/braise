#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

// Several CJS build artifacts require string-width and wrap-ansi using require(),
// but the hoisted top-level versions are ESM-only (string-width@5+, wrap-ansi@8+).
// Node <22 cannot require() ESM modules, causing the Xcode archive build to fail.
// Patch these files to use the *-cjs aliases (CJS-compatible versions) instead.
const patches = [
  {
    file: 'node_modules/cliui/build/index.cjs',
    replacements: [
      [/require\('string-width'\)/g, "require('string-width-cjs')"],
      [/require\('wrap-ansi'\)/g, "require('wrap-ansi-cjs')"],
    ],
  },
  {
    file: 'node_modules/wrap-ansi-cjs/index.js',
    replacements: [
      [/require\('string-width'\)/g, "require('string-width-cjs')"],
    ],
  },
  {
    file: 'node_modules/yargs/build/index.cjs',
    replacements: [
      [/require\("string-width"\)/g, 'require("string-width-cjs")'],
    ],
  },
];

for (const {file, replacements} of patches) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    continue;
  }
  const original = fs.readFileSync(filePath, 'utf8');
  let patched = original;
  for (const [pattern, replacement] of replacements) {
    patched = patched.replace(pattern, replacement);
  }
  if (patched !== original) {
    fs.writeFileSync(filePath, patched);
    console.log(`postinstall: patched ${file}`);
  }
}
