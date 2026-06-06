"use strict";
const { extractInfo } = require("../ytdlpHelper");
const { httpClient }  = require("../httpHelper");
const { load }        = require("cheerio");

async function fetchThreads(url) {
  // Primary: yt-dlp
  try {
    const info = await extractInfo(url);
    if (info.formats.length) return info;
  } catch {}

  // Fallback: og meta scraping
  const res = await httpClient.get(url, { headers: { Accept: "text/html" } });
  const $ = load(res.data);
  const title     = $("meta[property=\"og:title\"]").attr("content") || "";
  const thumbnail = $("meta[property=\"og:image\"]").attr("content") || "";
  const videoUrl  = $("meta[property=\"og:video\"]").attr("content") || "";
  const formats   = [];
  if (videoUrl) formats.push({ type: "video", url: videoUrl, quality: "Original", label: "Video" });
  if (thumbnail && !videoUrl) formats.push({ type: "image", url: thumbnail, quality: "Original", label: "Image 1" });
  if (!formats.length) throw new Error("Threads: could not extract media from this post.");
  return { title, author: "", thumbnail, formats };
}

module.exports = { fetchThreads };
