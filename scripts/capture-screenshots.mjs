import { chromium } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const BASE = "http://localhost:3000";
const EMAIL = process.env.CAPTURE_EMAIL;
const PASSWORD = process.env.CAPTURE_PASSWORD;
const OUT = "docs/screenshots";

const shots = [
  { name: "worker-dashboard", path: "/worker/dashboard", fullPage: true },
  { name: "worker-worklog-form", path: "/worker/work-logs/new" },
  { name: "worker-payroll", path: "/worker/payroll?year=2026&month=7", fullPage: true },
  { name: "worker-calendar", path: "/worker/mypage", fullPage: true, settle: 1200 },
];

if (!EMAIL || !PASSWORD) throw new Error("CAPTURE_EMAIL / CAPTURE_PASSWORD 없음");

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  locale: "ko-KR",
  timezoneId: "Asia/Seoul",
});
const page = await ctx.newPage();

await page.goto(`${BASE}/login`);
await page.fill('input[type="email"]', EMAIL);
await page.fill('input[type="password"]', PASSWORD);
await page.click('button[type="submit"]');
await page.waitForURL(/\/(worker|admin)\//, { timeout: 15000 });

for (const s of shots) {
  await page.goto(`${BASE}${s.path}`);
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(s.settle ?? 500);
  await page.screenshot({ path: `${OUT}/${s.name}.png`, fullPage: !!s.fullPage });
  console.log(`OK ${s.name}.png`);
}

await browser.close();
