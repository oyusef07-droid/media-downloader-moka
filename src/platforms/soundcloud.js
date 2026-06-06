"use strict";
const { extractInfo } = require("../ytdlpHelper");
const { httpClient }  = require("../httpHelper");

async function fetchSoundCloud(url) {
  // Primary: yt-dlp (reliable for SoundCloud)
  try {
    const info = await extractInfo(url);
    if (info.formats.length) return info;
  } catch {}

  // Fallback: SoundCloud public API
  const KNOWN_CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID || "a3e059563d7fd3372b49b37f00a00bcf";
  let title = "", author = "", thumbnail = "";

  try {
    const oembed = await httpClient.get("https://soundcloud.com/oembed", {
      params: { url, format: "json" },
    });
    title     = oembed.data?.title        || "";
    author    = oembed.data?.author_name  || "";
    thumbnail = oembed.data?.thumbnail_url|| "";
  } catch {}

  const res = await httpClient.get("https://api-v2.soundcloud.com/resolve", {
    params: { url, client_id: KNOWN_CLIENT_ID },
  });
  const track = res.data;
  if (!title)     title     = track.title                                              || "";
  if (!author)    author    = track.user?.username                                    || "";
  if (!thumbnail) thumbnail = (track.artwork_url || "").replace("-large", "-t500x500");

  const formats = [];
  for (const tc of track.media?.transcodings || []) {
    if (!tc.url) continue;
    try {
      const streamRes = await httpClient.get(tc.url, { params: { client_id: KNOWN_CLIENT_ID } });
      const streamUrl = streamRes.data?.url;
      if (streamUrl) {
        const quality = tc.quality === "hq" ? "256kbps" : "128kbps";
        formats.push({ type: "audio", url: streamUrl, quality, label: "Audio (" + quality + ")" });
      }
    } catch {}
  }

  if (!formats.length) throw new Error("SoundCloud: could not extract audio stream.");
  return { title, author, thumbnail, formats };
}

module.exports = { fetchSoundCloud };
