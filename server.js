import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

// ========================================================
//  Setup
// ========================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// ========================================================
//  Serve static site from /public
// ========================================================
app.use(express.static(path.join(__dirname, "public"))); // serves index.html etc.

// ========================================================
//  Full Repo List (exact same as your HTML)
// ========================================================
const repos = [
  "https://raw.githubusercontent.com/WhySooooFurious/Ultimate-Sideloading-Guide/refs/heads/main/raw-files/app-repo.json",
  "https://esign.yyyue.xyz/app.json",
  "https://raw.githubusercontent.com/vizunchik/AltStoreRus/master/apps.json",
  "https://qnblackcat.github.io/AltStore/apps.json",
  "https://randomblock1.com/altstore/apps.json",
  "https://wuxu1.github.io/wuxu-complete-plus.json",
  "https://ipa.cypwn.xyz/cypwn.json",
  "https://driftywinds.github.io/AltStore/apps.json",
  "https://hann8n.github.io/JackCracks/MovieboxPro.json",
  "https://raw.githubusercontent.com/TheNightmanCodeth/chromium-ios/master/altstore-source.json",
  "https://repository.apptesters.org/",
  "https://aio.yippee.rip/repo.json",
  "https://community-apps.sidestore.io/sidecommunity.json",
  "https://raw.githubusercontent.com/arichornloverALT/arichornloveralt.github.io/main/apps2.json",
  "https://raw.githubusercontent.com/arichornloveralt/arichornloveralt.github.io/main/apps.json",
  "https://raw.githubusercontent.com/lo-cafe/winston-altstore/main/apps.json",
  "https://qingsongqian.github.io/all.html",
  "https://tiny.one/SpotC",
  "https://theodyssey.dev/altstore/odysseysource.json",
  "https://provenance-emu.com/apps.json",
  "https://ish.app/altstore.json",
  "https://raw.githubusercontent.com/Balackburn/YTLitePlusAltstore/main/apps.json",
  "https://raw.githubusercontent.com/whoeevee/EeveeSpotify/swift/repo.json",
  "https://altstore.oatmealdome.me/",
  "https://alts.lao.sb/",
  "https://xitrix.github.io/iTorrent/AltStore.json",
  "https://driftywinds.github.io/repos/esign.json",
  "https://github.com/khcrysalis/Feather/raw/main/app-repo.json",
  "https://appstore.nabzclan.vip/repos/altstore.php",
  "https://flyinghead.github.io/flycast-builds/altstore.json",
  "https://alt.crystall1ne.dev/",
  "https://apps.sidestore.io/",
  "https://repos.yattee.stream/alt/apps.json",
  "https://alt.thatstel.la/",
  "https://repo.ethsign.fyi"
];

// ========================================================
//   Fetch helpers
// ========================================================
async function fetchWithTimeout(url, timeout = 7000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        // Nabzclan and similar Cloudflare-protected sites expect real browser headers
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
        "Accept":
          "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://appstore.nabzclan.vip/",
        "Origin": "https://appstore.nabzclan.vip",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Connection": "keep-alive",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin"
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const txt = await res.text();
    try {
      return JSON.parse(txt);
    } catch {
      const cleaned = txt.trim().replace(/^[^{\[]+/, "").replace(/[^}\]]+$/, "");
      return JSON.parse(cleaned);
    }
  } finally {
    clearTimeout(id);
  }
}

async function fetchRepo(url) {
  const suffixes = [
    "", "/apps.json", "/app.json", "/repo.json", "/altstore.json",
    "/index.json", "/packages.json", "/app-repo.json", "/alt.json", "/altstore.php"
  ];
  for (const s of suffixes) {
    try {
      const data = await fetchWithTimeout(url.replace(/\/+$/, "") + s);
      if (data && (data.apps?.length || Array.isArray(data.apps))) {
        return { url, data };
      }
    } catch {}
  }
  return null;
}

// ========================================================
//   Cache + API
// ========================================================
let cache = { data: null, timestamp: 0 };

app.get("/api/repos", async (req, res) => {
  if (cache.data && Date.now() - cache.timestamp < 1000 * 60 * 30) {
    return res.json(cache.data);
  }

  const concurrency = 20;
  const results = [];
  let i = 0;
  async function worker() {
    while (i < repos.length) {
      const idx = i++;
      const url = repos[idx];
      const r = await fetchRepo(url);
      results[idx] = r;
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  const valid = results.filter(Boolean);

  cache = { data: valid, timestamp: Date.now() };
  res.json(valid);
});

// ========================================================
//  ✅ Catch-all fallback so / and other paths load the site
// ========================================================
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ========================================================
//   Start server
// ========================================================
app.listen(PORT, () => {
  console.log(`🚀 Choco Milky Backend+Frontend running on port ${PORT}`);
});
