"use strict";
const { extractInfo } = require("../ytdlpHelper");

async function fetchFacebook(url) {
  // Primary: yt-dlp (handles public Facebook videos)
  const extraArgs = [];
  if (process.env.FACEBOOK_COOKIES_FILE) {
    extraArgs.push("--cookies", process.env.FACEBOOK_COOKIES_FILE);
  }

  try {
    const info = await extractInfo(url, extraArgs);
    if (info.formats && info.formats.length) return info;
  } catch {}

  // Fallback: resolve share URL and try again
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    clearTimeout(timeout);
    const resolvedUrl = res.url;
    if (resolvedUrl !== url) {
      const info = await extractInfo(resolvedUrl, extraArgs);
      if (info.formats && info.formats.length) return info;
    }
  } catch {}

  throw new Error("Facebook: could not extract video.");
}

module.exports = { fetchFacebook };
