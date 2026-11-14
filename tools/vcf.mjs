#!/usr/bin/env node
/**
 * Generates assets/constantino-edes.vcf from data/site.json — the JSON is the
 * single source of truth for contact data; the vCard is a build artifact.
 *
 * Usage: node tools/vcf.mjs [output-path]
 * Writes to assets/constantino-edes.vcf by default (pass a path to write to
 * dist/assets instead).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const out = process.argv[2] ?? "assets/constantino-edes.vcf";
const root = new URL("..", import.meta.url).pathname;
const site = JSON.parse(readFileSync(resolve(root, "data/site.json"), "utf8"));

const { profile, links } = site;
const emailLink = links.find((l) => l.url.startsWith("mailto:"));
const email = emailLink ? emailLink.url.replace(/^mailto:/, "") : "";
const [first = "", ...rest] = profile.name.split(" ");
const last = rest.pop() ?? "";
const card = [
  "BEGIN:VCARD",
  "VERSION:3.0",
  `N:${last};${first};;;`,
  `FN:${profile.name}`,
  `TITLE:${profile.role}`,
  ...(profile.org ? [`ORG:${profile.org}`] : []),
  `EMAIL;TYPE=INTERNET:${email}`,
  `TEL;TYPE=CELL,VOICE:${profile.phone ?? ""}`,
  `URL:${profile.url ?? "https://hi.constantinoedes.dev"}`,
  "END:VCARD",
  "", // trailing newline so the file ends cleanly
].join("\r\n");

mkdirSync(dirname(resolve(out)), { recursive: true });
writeFileSync(out, card);
console.log(`  vcf written to ${out}`);
