"use strict";
const { extractInfo } = require("../ytdlpHelper");
const { httpClient }  = require("../httpHelper");
const { load }        = require("cheerio");

async function fetchPinterest(url) {
  // Primary: yt-dlp (handles Pinterest videos)
  try {
    const info = await extractInfo(url);
    if (info.formats.length) return info;
  } catch {}

  // Fallback 1: Pinterest oEmbed API
  try {
    const res = await httpClient.get("https://www.pinterest.com/oembed.json", { params: { url } });
    if (res.data?.thumbnail_url) {
      return {
        title: res.data.title || "", author: res.data.author_name || "",
        thumbnail: res.data.thumbnail_url,
        formats: [{ type: "image", url: res.data.thumbnail_url, quality: "Original", label: "Image 1" }],
      };
    }
  } catch {}

  // Fallback 2: Scrape og:image
  const pageRes = await httpClient.get(url, { headers: { Accept: "text/html" } });
  const $ = load(pageRes.data);
  const ogImage = $("meta[property=\"og:image\"]").attr("content");
  const ogTitle = $("meta[property=\"og:title\"]").attr("content") || "";
  if (ogImage) {
    return {
      title: ogTitle, author: "", thumbnail: ogImage,
      formats: [{ type: "image", url: ogImage, quality: "Original", label: "Image 1" }],
    };
  }
  throw new Error("Pinterest: could not extract media from this pin.");
}

module.exports = { fetchPinterest };
