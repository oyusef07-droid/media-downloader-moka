"use strict";

/**
 * ytdlpHelper.js — yt-dlp subprocess wrapper
 * The core engine powering all 14 platform downloaders.
 * Requires yt-dlp installed: pip install yt-dlp
 */

const { execFile } = require("child_process");
const { promisify } = require("util");
const fs   = require("fs");
const path = require("path");

const execFileAsync = promisify(execFile);

// ── Locate yt-dlp binary ────────────────────────────────────────────────────
function getYtdlpBin() {
  const candidates = [
    process.env.YTDLP_PATH,
    "/usr/local/bin/yt-dlp",
    "/usr/bin/yt-dlp",
    path.join(process.env.LOCALAPPDATA || "", "yt-dlp", "yt-dlp.exe"),
    "yt-dlp",
  ].filter(Boolean);

  for (const c of candidates) {
    try {
      if (c.includes("/") || c.includes("\\")) {
        if (fs.existsSync(c)) return c;
      } else {
        return c; // Let the OS resolve it from PATH
      }
    } catch {}
  }
  return "yt-dlp";
}

const YTDLP_BIN = getYtdlpBin();

// ── Base yt-dlp arguments ────────────────────────────────────────────────────
const BASE_ARGS = [
  "--no-check-certificates",
  "--no-playlist",
  "--no-warnings",
  "--socket-timeout", "20",
  // Use Node.js as JS runtime for YouTube (if available)
  "--js-runtimes", process.execPath ? "nodejs:" + process.execPath : "nodejs",
];

// ──────────────────────────────────────────────────────────────────────────────
// Core yt-dlp runner
// ──────────────────────────────────────────────────────────────────────────────
async function ytdlpGetInfo(url, extraArgs = []) {
  const args = [...BASE_ARGS, "--dump-json", ...extraArgs, "--", url];

  let stdout;
  try {
    const result = await execFileAsync(YTDLP_BIN, args, {
      timeout:   30000,
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env, PYTHONUTF8: "1", YTDL_NO_UPDATE: "1" },
    });
    stdout = result.stdout;
  } catch (err) {
    const msg = (err.stderr || err.stdout || err.message || "").toLowerCase();
    if (msg.includes("private video") || msg.includes("sign in"))
      throw new Error("This content is private or requires authentication.");
    if (msg.includes("not available") || msg.includes("removed"))
      throw new Error("This content is no longer available.");
    if (msg.includes("403") || msg.includes("forbidden"))
      throw new Error("Access denied by platform (try adding cookies for private content).");
    throw new Error("yt-dlp: " + (err.stderr || err.message || "extraction failed").split("\n")[0]);
  }

  // Parse JSON — yt-dlp may emit multiple lines for playlists
  const lines = (stdout || "").trim().split("\n").filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    try { return JSON.parse(lines[i]); } catch {}
  }
  throw new Error("yt-dlp returned no parsable JSON output.");
}

// ──────────────────────────────────────────────────────────────────────────────
// Format conversion
// ──────────────────────────────────────────────────────────────────────────────
function mapFormat(fmt) {
  const isVideo = fmt.vcodec && fmt.vcodec !== "none";
  const isAudio = fmt.acodec && fmt.acodec !== "none";
  const height  = fmt.height || 0;
  const abr     = fmt.abr || fmt.tbr || 0;

  if (isVideo) {
    const quality = height >= 720 ? "HD" : "SD";
    const label   = isAudio
      ? `Video (${height || "?"}p)`
      : `Video only (${height || "?"}p)`;
    return { type: "video", url: fmt.url, quality, label, _height: height };
  }
  const kbps = Math.round(abr) || "?";
  return { type: "audio", url: fmt.url, quality: `${kbps}kbps`, label: `Audio (${kbps}kbps)`, _abr: abr };
}

function pickFormats(info) {
  const fmts   = (info.formats || []).filter(f => f.url);
  const output = [];
  const seen   = new Set();

  // Best combined video+audio per resolution
  const combined = fmts
    .filter(f => f.vcodec && f.vcodec !== "none" && f.acodec && f.acodec !== "none")
    .sort((a, b) => (b.height || 0) - (a.height || 0));

  for (const fmt of combined) {
    const h = fmt.height || 0;
    if (seen.has(h)) continue;
    seen.add(h);
    output.push(mapFormat(fmt));
  }

  // If no combined, add best video-only
  if (!combined.length) {
    const bestV = fmts
      .filter(f => f.vcodec && f.vcodec !== "none")
      .sort((a, b) => (b.height || 0) - (a.height || 0))[0];
    if (bestV) output.push(mapFormat(bestV));
  }

  // Best audio-only track
  const bestA = fmts
    .filter(f => (!f.vcodec || f.vcodec === "none") && f.acodec && f.acodec !== "none")
    .sort((a, b) => (b.abr || b.tbr || 0) - (a.abr || a.tbr || 0))[0];
  if (bestA) output.push(mapFormat(bestA));

  // If nothing found, use thumbnail as image
  if (!output.length && info.thumbnails?.length) {
    const thumb = [...info.thumbnails]
      .filter(t => t.url)
      .sort((a, b) => ((b.width || 0) * (b.height || 0)) - ((a.width || 0) * (a.height || 0)))[0];
    if (thumb) output.push({ type: "image", url: thumb.url, quality: "Original", label: "Thumbnail" });
  }

  return output;
}

// ──────────────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────────────
async function extractInfo(url, extraArgs = []) {
  const info = await ytdlpGetInfo(url, extraArgs);

  const thumbnail = (() => {
    if (info.thumbnail) return info.thumbnail;
    const thumbs = (info.thumbnails || []).filter(t => t.url);
    if (!thumbs.length) return "";
    return thumbs.sort((a, b) =>
      ((b.width || 0) * (b.height || 0)) - ((a.width || 0) * (a.height || 0))
    )[0].url;
  })();

  return {
    title:   info.title     || info.description?.substring(0, 100) || "",
    author:  info.uploader  || info.channel || info.creator || "",
    thumbnail,
    formats: pickFormats(info),
  };
}

module.exports = { extractInfo, ytdlpGetInfo, pickFormats };
