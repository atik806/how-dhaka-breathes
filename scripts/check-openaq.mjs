// Verifies OPENAQ_API_KEY and lists OpenAQ monitoring locations near Dhaka.
// Run: npm run openaq:check   (reads the key from .env.local)

const key = process.env.OPENAQ_API_KEY?.trim();
if (!key) {
  console.error("OPENAQ_API_KEY is empty. Paste your key into .env.local (see README).");
  process.exit(1);
}

const DHAKA = "23.8103,90.4125";
const url = `https://api.openaq.org/v3/locations?coordinates=${DHAKA}&radius=25000&limit=100`;
const res = await fetch(url, { headers: { "X-API-Key": key } });

if (res.status === 401) {
  console.error(
    "401 Unauthorized: the key was rejected. Re-copy it from explore.openaq.org/account.",
  );
  process.exit(1);
}
if (!res.ok) {
  console.error(`OpenAQ responded ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const { results } = await res.json();
console.log(`Key OK. ${results.length} OpenAQ locations within 25 km of Dhaka:\n`);
for (const loc of results) {
  const pm25 = loc.sensors?.some((s) => s.parameter?.name === "pm25") ? "PM2.5" : "     ";
  const last = loc.datetimeLast?.local?.slice(0, 10) ?? "never";
  console.log(
    `${String(loc.id).padStart(8)}  ${pm25}  last data ${last}  ${loc.name}` +
      (loc.provider?.name ? `  (${loc.provider.name})` : ""),
  );
}
