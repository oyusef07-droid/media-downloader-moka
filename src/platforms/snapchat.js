"use strict";
const { extractInfo } = require("../ytdlpHelper");
const { httpClient }  = require("../httpHelper");
const { load }        = require("cheerio");

async function fetchSnapchat(url) {
  // Primary: yt-dlp (handles Snapchat Spotlight)
  try {
    const info = await extractInfo(url);
    if (info.formats.length) return info;
  } catch {}

  // Fallback: og meta scraping
  const res = await httpClient.get(url, { headers: { Accept: "text/html" } });
  const $   = load(res.data);
  const title     = $("meta[property=\"og:title\"]").attr("content") || "";
  const thumbnail = $("meta[property=\"og:image\"]").attr("content") || "";
  const videoUrl  = $("meta[property=\"og:video\"]").attr("content") || "";
  const formats   = [];
  if (videoUrl) formats.push({ type: "video", url: videoUrl, quality: "Original", label: "Video" });
  if (thumbnail) formats.push({ type: "image", url: thumbnail, quality: "Original", label: "Thumbnail" });
  if (!formats.length) throw new Error("Snapchat: no media found in this post.");
  return { title, author: "", thumbnail, formats };
}

module.exports = { fetchSnapchat };
