"use strict";
const { extractInfo } = require("../ytdlpHelper");
const { httpClient }  = require("../httpHelper");

async function fetchTikTok(url) {
  // Primary: yt-dlp (handles TikTok well, no watermark via tikwm fallback)
  try {
    const info = await extractInfo(url);
    if (info.formats.length) return info;
  } catch {}

  // Fallback: tikwm API (no-watermark HD)
  const res = await httpClient.get(
    "https://www.tikwm.com/api/?url=" + encodeURIComponent(url) + "&hd=1"
  );
  const d = res.data?.data;
  if (!d?.play) throw new Error("TikTok: could not extract media.");

  const formats = [];
  if (d.hdplay || d.play) {
    formats.push({
      type: "video",
      url: d.hdplay || d.play,
      quality: d.hdplay ? "HD" : "SD",
      label: "Video (" + (d.hdplay ? "HD" : "SD") + " • No Watermark)",
    });
  }
  if (d.music) formats.push({ type: "audio", url: d.music, quality: "Original", label: "Audio" });
  if (Array.isArray(d.images)) {
    d.images.forEach((img, i) =>
      formats.push({ type: "image", url: img, quality: "Original", label: "Image " + (i + 1) })
    );
  }
  return { title: d.title || "", author: d.author?.nickname || "", thumbnail: d.cover || "", formats };
}

module.exports = { fetchTikTok };
