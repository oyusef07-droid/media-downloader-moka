"use strict";
const { extractInfo }  = require("../ytdlpHelper");
const { httpClient }   = require("../httpHelper");

function normalizeRedditUrl(url) {
  const u = new URL(url);
  u.search = "";
  let p = u.pathname.endsWith("/") ? u.pathname : u.pathname + "/";
  return "https://www.reddit.com" + p + ".json";
}

async function fetchReddit(url) {
  // Primary: yt-dlp (handles Reddit video + gallery)
  try {
    const info = await extractInfo(url);
    if (info.formats.length) return info;
  } catch {}

  // Fallback: Reddit JSON API
  const jsonUrl = normalizeRedditUrl(url);
  const res = await httpClient.get(jsonUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; downloader/1.0)" },
  });
  const post = res.data?.[0]?.data?.children?.[0]?.data;
  if (!post) throw new Error("Reddit: could not parse post data.");

  const title = post.title || "";
  const author = post.author || "";
  let thumbnail = post.thumbnail || "";
  if (["self", "default", "nsfw", "spoiler"].includes(thumbnail)) thumbnail = "";
  const formats = [];

  if (post.is_video && post.media?.reddit_video?.fallback_url) {
    const vid = post.media.reddit_video;
    formats.push({
      type: "video",
      url: vid.fallback_url,
      quality: (vid.height || 0) >= 720 ? "HD" : "SD",
      label: "Video (" + (vid.height || "?") + "p)",
    });
  }

  if (post.is_gallery && post.media_metadata) {
    let idx = 1;
    for (const meta of Object.values(post.media_metadata)) {
      if (meta.status !== "valid" || !meta.s?.u) continue;
      const imgUrl = meta.s.u.replace(/&amp;/g, "&");
      if (!thumbnail) thumbnail = imgUrl;
      formats.push({ type: "image", url: imgUrl, quality: "Original", label: "Image " + idx++ });
    }
  }

  if (!formats.length && post.url) {
    const ext = post.url.split(".").pop().toLowerCase().split("?")[0];
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
      formats.push({ type: "image", url: post.url, quality: "Original", label: "Image 1" });
    }
  }

  if (!formats.length) throw new Error("Reddit: no downloadable media found in this post.");
  return { title, author, thumbnail, formats };
}

module.exports = { fetchReddit };
