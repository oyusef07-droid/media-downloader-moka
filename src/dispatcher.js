const { detectPlatform, resolveShortUrl } = require("./platformDetector");

const handlers = {
  youtube:     () => require("./platforms/youtube").fetchYouTube,
  instagram:   () => require("./platforms/instagram").fetchInstagram,
  tiktok:      () => require("./platforms/tiktok").fetchTikTok,
  twitter:     () => require("./platforms/twitter").fetchTwitter,
  facebook:    () => require("./platforms/facebook").fetchFacebook,
  reddit:      () => require("./platforms/reddit").fetchReddit,
  pinterest:   () => require("./platforms/pinterest").fetchPinterest,
  linkedin:    () => require("./platforms/linkedin").fetchLinkedIn,
  threads:     () => require("./platforms/threads").fetchThreads,
  telegram:    () => require("./platforms/telegram").fetchTelegram,
  snapchat:    () => require("./platforms/snapchat").fetchSnapchat,
  twitch:      () => require("./platforms/twitch").fetchTwitch,
  vimeo:       () => require("./platforms/vimeo").fetchVimeo,
  soundcloud:  () => require("./platforms/soundcloud").fetchSoundCloud,
};

function buildSuccessResponse(url, platform, result) {
  return {
    success: true,
    data: {
      title:     result.title     || "",
      author:    result.author    || "",
      thumbnail: result.thumbnail || "",
      sourceUrl: url,
      platform,
      formats:   result.formats   || [],
    },
  };
}

async function dispatch(url) {
  if (!url || typeof url !== "string") throw new Error("A valid URL is required.");
  try { new URL(url); } catch { throw new Error("Invalid URL: " + url); }

  // Try to detect platform first, if not detected, resolve short URL and try again
  let platform = detectPlatform(url);
  let resolvedUrl = url;

  if (!platform) {
    resolvedUrl = await resolveShortUrl(url);
    platform = detectPlatform(resolvedUrl);
  }

  if (!platform) throw new Error("Unsupported platform. Supported: " + Object.keys(handlers).join(", "));

  const handler = handlers[platform]();
  const TIMEOUT_MS = 30000;
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Request timed out after 30s")), TIMEOUT_MS)
  );
  const result = await Promise.race([handler(resolvedUrl), timeoutPromise]);
  return buildSuccessResponse(resolvedUrl, platform, result);
}

module.exports = { dispatch };
