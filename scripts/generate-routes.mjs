import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const problemsPath = join(root, "src", "data", "problems.ts");
const outPath = join(root, "public", "codora-routes.json");

const TABS = [
  "/",
  "/home",
  "/learn",
  "/practice",
  "/ide",
  "/profile",
  "/challenges",
  "/library",
  "/progress",
  "/settings",
  "/community",
  "/onboarding",
];

const source = readFileSync(problemsPath, "utf8");
const ids = [...source.matchAll(/id:\s*"(problem-[\w-]+)"/g)].map((m) => m[1]);
const unique = [...new Set(ids)].sort();

const routes = {
  version: 1,
  tabs: TABS,
  problems: unique,
  lessons: unique.map((id) => `/learn/${id}`),
  practice: unique.map((id) => `/practice/${id}`),
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(routes, null, 2) + "\n");
console.log(
  `codora-routes.json: ${TABS.length} tabs, ${unique.length} problems ` +
    `(${routes.lessons.length} lessons, ${routes.practice.length} practice routes)`
);