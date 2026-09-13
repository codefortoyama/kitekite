#!/usr/bin/env node
/**
 * 富山空港周辺のADS-Bデータを取得し、data/planes.json に保存する。
 * ブラウザから直接叩くとCORS非対応で弾かれるため、GitHub Actions上
 * （サーバー間通信）で定期実行し、静的JSONとして配信する。
 */

import { writeFile } from "node:fs/promises";

const AIRPORT = { lat: 36.6483, lon: 137.1875 };
const RADIUS_NM = 150;
const USER_AGENT = "kitekite/1.0 (+https://github.com/codefortoyama/kitekite)";
const OUTPUT_PATH = "data/planes.json";

const SOURCES = [
  { name: "adsb.fi", url: `https://opendata.adsb.fi/api/v2/lat/${AIRPORT.lat}/lon/${AIRPORT.lon}/dist/${RADIUS_NM}` },
  { name: "adsb.lol", url: `https://api.adsb.lol/v2/point/${AIRPORT.lat}/${AIRPORT.lon}/${RADIUS_NM}` },
];

async function main() {
  for (const src of SOURCES) {
    try {
      const res = await fetch(src.url, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        console.error(`${src.name}: HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      const aircraft = data.ac || data.aircraft || [];
      const output = {
        fetched_at: new Date().toISOString(),
        source: src.name,
        aircraft,
      };
      await writeFile(OUTPUT_PATH, JSON.stringify(output));
      console.log(`OK: ${src.name}, ${aircraft.length} aircraft`);
      return;
    } catch (err) {
      console.error(`${src.name}: ${err}`);
    }
  }
  console.error("all sources failed; leaving existing data/planes.json in place");
  process.exit(1);
}

main();
