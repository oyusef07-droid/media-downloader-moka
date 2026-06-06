"use strict";
const { extractInfo } = require("../ytdlpHelper");

async function fetchYouTube(url) {
  // yt-dlp is the most reliable YouTube extractor — handles all anti-bot measures
  return extractInfo(url, [
    "--extractor-args", "youtube:player_client=web,mweb",
  ]);
}

module.exports = { fetchYouTube };
