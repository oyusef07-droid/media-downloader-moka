"use strict";
const { extractInfo } = require("../ytdlpHelper");
const { httpClient }  = require("../httpHelper");

const GQL_URL       = "https://gql.twitch.tv/gql";
const GQL_CLIENT_ID = "kimne78kx3ncx6brgo4mv6wki5h1ko";

function extractClipSlug(url) { return url.match(/twitch\.tv\/(?:[^/]+\/)?clip\/([^?/]+)/i)?.[1] || null; }
function extractVodId(url)    { return url.match(/twitch\.tv\/videos\/(\d+)/i)?.[1] || null; }

async function fetchTwitch(url) {
  // Primary: yt-dlp for VODs and clips
  try {
    const info = await extractInfo(url);
    if (info.formats.length) return info;
  } catch {}

  // Fallback GQL for clips
  const clipSlug = extractClipSlug(url);
  if (clipSlug) {
    const body = [{
      operationName: "VideoAccessToken_Clip",
      variables: { slug: clipSlug },
      extensions: { persistedQuery: { version: 1, sha256Hash: "36b89d2507fce29e5ca551df756d27c1cfe079e2609642b4390aa4c35796eb11" } },
    }];
    const res = await httpClient.post(GQL_URL, body, {
      headers: { "Client-Id": GQL_CLIENT_ID, "Content-Type": "application/json" },
    });
    const clip = res.data?.[0]?.data?.clip;
    if (!clip) throw new Error("Twitch: clip not found.");
    const sig = clip.playbackAccessToken?.signature || "";
    const tok = encodeURIComponent(clip.playbackAccessToken?.value || "");
    const formats = (clip.videoQualities || [])
      .sort((a, b) => parseInt(b.quality) - parseInt(a.quality))
      .map(q => ({
        type: "video",
        url: q.sourceURL + "?sig=" + sig + "&token=" + tok,
        quality: parseInt(q.quality) >= 720 ? "HD" : "SD",
        label: "Video (" + q.quality + "p)",
      }));
    return { title: clip.title || "", author: clip.broadcaster?.displayName || "", thumbnail: clip.thumbnailURL || "", formats };
  }

  // VOD HLS stream
  const vodId = extractVodId(url);
  if (vodId) {
    return {
      title: "", author: "", thumbnail: "",
      formats: [{ type: "video", url: "https://usher.twitchapps.com/vod/" + vodId + ".m3u8?allow_source=true", quality: "HD", label: "VOD (HLS Stream)" }],
    };
  }

  throw new Error("Twitch: URL must be a clip or VOD link.");
}

module.exports = { fetchTwitch };
