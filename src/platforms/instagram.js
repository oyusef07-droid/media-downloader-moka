"use strict";
const { extractInfo } = require("../ytdlpHelper");

async function fetchInstagram(url) {
  // Primary: yt-dlp (handles Reels, Posts, Stories)
  const extraArgs = [];
  if (process.env.INSTAGRAM_COOKIES_FILE) {
    extraArgs.push("--cookies", process.env.INSTAGRAM_COOKIES_FILE);
  }

  try {
    const info = await extractInfo(url, extraArgs);
    if (info.formats && info.formats.length) return info;
  } catch {}

  // Fallback: try with different extractor args
  try {
    const info = await extractInfo(url, ["--extractor-args", "instagram:api_type=graphql", ...extraArgs]);
    if (info.formats && info.formats.length) return info;
  } catch {}

  // Last fallback: try nayan-media-downloader if available
  try {
    const nayan = require("nayan-media-downloader");
    const data = await nayan.instagramDownloader(url);
    if (data?.data?.length) {
      const formats = data.data.map((item, i) => ({
        type: item.type === "video" ? "video" : "image",
        url: item.url,
        quality: "HD",
        label: (item.type === "video" ? "Video " : "Image ") + (i + 1),
      }));
      return { title: "", author: data.username || "", thumbnail: "", formats };
    }
  } catch {}

  throw new Error("Instagram: could not extract media.");
}

module.exports = { fetchInstagram };
