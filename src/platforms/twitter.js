"use strict";
const { extractInfo } = require("../ytdlpHelper");
const { httpClient }  = require("../httpHelper");

function extractTweetId(url) {
  return url.match(/(?:twitter\.com|x\.com)\/[^/]+\/status\/(\d+)/i)?.[1] || null;
}

async function fetchTwitter(url) {
  // Primary: yt-dlp
  try {
    const info = await extractInfo(url);
    if (info.formats.length) return info;
  } catch {}

  // Fallback: fxtwitter public API
  const tweetId = extractTweetId(url);
  if (!tweetId) throw new Error("Twitter: could not parse tweet ID.");

  const res = await httpClient.get("https://api.fxtwitter.com/status/" + tweetId);
  const tweet = res.data?.tweet;
  if (!tweet) throw new Error("Twitter: could not extract media.");

  const formats = [];
  let thumbnail = tweet.author?.avatar_url || "";

  (tweet.media?.videos || []).forEach((vid) => {
    const variants = [...(vid.variants || [])].sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
    variants.forEach((v, i) => {
      if (!v.url) return;
      if (!thumbnail && vid.thumbnail_url) thumbnail = vid.thumbnail_url;
      formats.push({ type: "video", url: v.url, quality: i === 0 ? "HD" : "SD", label: "Video (" + (i === 0 ? "HD" : "SD") + ")" });
    });
  });

  (tweet.media?.photos || []).forEach((p, i) => {
    if (!p.url) return;
    if (!thumbnail) thumbnail = p.url;
    formats.push({ type: "image", url: p.url + "?format=jpg&name=orig", quality: "Original", label: "Image " + (i + 1) });
  });

  if (!formats.length) throw new Error("Twitter: no media in this tweet.");
  return { title: tweet.text || "", author: tweet.author?.name || "", thumbnail, formats };
}

module.exports = { fetchTwitter };
