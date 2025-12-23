import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const envPath = path.join(repoRoot, ".env");
// Load .env if present; environment variables still take precedence.
dotenv.config({ path: envPath, override: false });

function readEnv(name) {
  return String(process.env[name] ?? "").trim();
}

function parseBool(value, fallback = false) {
  if (value == null || value === "") return fallback;
  const v = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(v)) return true;
  if (["0", "false", "no", "n", "off"].includes(v)) return false;
  return fallback;
}

const allowEmpty = parseBool(readEnv("ALLOW_EMPTY_RUNTIME_CONFIG"), false);

const runtimeConfig = {
  firebase: {
    apiKey: readEnv("FIREBASE_API_KEY"),
    authDomain: readEnv("FIREBASE_AUTH_DOMAIN"),
    projectId: readEnv("FIREBASE_PROJECT_ID"),
    storageBucket: readEnv("FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: readEnv("FIREBASE_MESSAGING_SENDER_ID"),
    appId: readEnv("FIREBASE_APP_ID"),
    measurementId: readEnv("FIREBASE_MEASUREMENT_ID"),
  },
  app: {
    googleAuth: {
      clientId: readEnv("GOOGLE_OAUTH_CLIENT_ID"),
      scope: "https://www.googleapis.com/auth/calendar",
    },
    devMode: parseBool(readEnv("APP_DEV_MODE"), false),
  },
};

const required = [
  "FIREBASE_API_KEY",
  "FIREBASE_AUTH_DOMAIN",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_STORAGE_BUCKET",
  "FIREBASE_MESSAGING_SENDER_ID",
  "FIREBASE_APP_ID",
  "GOOGLE_OAUTH_CLIENT_ID",
];

const missing = required.filter((k) => !readEnv(k));
if (missing.length && !allowEmpty) {
  // Keep this non-fatal to avoid breaking CI/builds without secrets.
  console.warn(
    `[runtime-config] Missing environment variables: ${missing.join(", ")}`,
  );
  console.warn(
    "[runtime-config] Fill in .env (see .env.example) or set ALLOW_EMPTY_RUNTIME_CONFIG=true to silence this warning.",
  );
}

const outPath = path.join(repoRoot, "public", "runtime-config.json");
await fs.mkdir(path.dirname(outPath), { recursive: true });
await fs.writeFile(outPath, JSON.stringify(runtimeConfig, null, 2) + "\n", {
  encoding: "utf8",
});

console.log(`[runtime-config] Wrote ${path.relative(repoRoot, outPath)}`);
