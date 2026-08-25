#!/usr/bin/env node
/**
 * Upload das faixas do Vibes & Meditations para o bucket PRIVADO `vibes`.
 *
 * Fonte: deliverables/vibes-audio/*.mp3 (fora do git — ver .gitignore)
 * Destino: bucket `vibes`, caminho tracks/<slug>.mp3 — o mesmo `src`
 *          declarado em src/lib/vibes-catalog.ts.
 *
 * Pré-requisitos:
 *   1. Migration 20260825_vibes_audio.sql aplicada (cria o bucket)
 *   2. NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente
 *      (.env, .env.local ou exportadas no shell)
 *
 * Uso:  node scripts/upload-vibes-audio.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = join(ROOT, "deliverables", "vibes-audio");
const BUCKET = "vibes";
const PREFIX = "tracks";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !serviceKey) {
  console.error(
    "❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes.\n" +
      "   Copie de Supabase > Settings > API Keys para .env.local"
  );
  process.exit(1);
}

if (!existsSync(SOURCE_DIR)) {
  console.error(`❌ Pasta não encontrada: ${SOURCE_DIR}`);
  process.exit(1);
}

const files = readdirSync(SOURCE_DIR).filter((f) => f.endsWith(".mp3"));
if (files.length === 0) {
  console.error(`❌ Nenhum .mp3 em ${SOURCE_DIR}`);
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

let failures = 0;
for (const file of files.sort()) {
  const path = `${PREFIX}/${file}`;
  const body = readFileSync(join(SOURCE_DIR, file));
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, body, { contentType: "audio/mpeg", upsert: true });

  if (error) {
    failures++;
    console.error(`❌ ${path}: ${error.message}`);
  } else {
    console.log(`✅ ${path} (${Math.round(body.length / 1024)} KB)`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} upload(s) falharam.`);
  process.exit(1);
}
console.log(`\n🎧 ${files.length} faixas no bucket privado '${BUCKET}'.`);
