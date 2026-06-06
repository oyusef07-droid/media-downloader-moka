"use strict";
const { extractInfo } = require("../ytdlpHelper");
const { httpClient }  = require("../httpHelper");

function extractVimeoId(url) {
  return url.match(/vimeo\.com\/(?:video\/)?(\d+)/i)?.[1] || null;
}

async function fetchVimeo(url) {
  // Primary: yt-dlp (handles public + unlisted)
  try {
    const info = await extractInfo(url);
    if (info.formats.length) return info;
  } catch {}

  // Fallback: Vimeo player config (for unlisted/embedded)
  const videoId = extractVimeoId(url);
  if (!videoId) throw new Error("Vimeo: could not extract video ID.");

  const [oembedRes, configRes] = await Promise.allSettled([
    httpClient.get("https://vimeo.com/api/oembed.json", {
      params: { url: "https://vimeo.com/" + videoId },
    }),
    httpClient.get("https://player.vimeo.com/video/" + videoId + "/config", {
      headers: { Referer: "https://vimeo.com/" },
    }),
  ]);

  const oembed = oembedRes.status === "fulfilled" ? oembedRes.value.data : {};
  const config = configRes.status === "fulfilled" ? configRes.value.data : null;

  const title     = oembed.title         || config?.video?.title          || "";
  const author    = oembed.author_name   || config?.video?.owner?.name    || "";
  const thumbnail = oembed.thumbnail_url || config?.video?.thumbs?.base   || "";
  const formats   = [];

  const progressiveFiles = config?.request?.files?.progressive || [];
  progressiveFiles
    .sort((a, b) => (b.height || 0) - (a.height || 0))
    .forEach(f => {
      if (f.url) formats.push({
        type: "video",
        url: f.url,
        quality: (f.height || 0) >= 720 ? "HD" : "SD",
        label: "Video (" + f.height + "p)",
      });
    });

  if (!formats.length) throw new Error("Vimeo: this video is private or DRM-protected.");
  return { title, author, thumbnail, formats };
}

module.exports = { fetchVimeo };
