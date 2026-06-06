"use strict";
const { httpClient } = require("../httpHelper");
const { load }       = require("cheerio");

async function fetchTelegram(url) {
  // Telegram embeds work via t.me/s/ path (public channels only)
  const embedUrl = url
    .replace(/t\.me\/s\//, "t.me/s/")  // already correct
    .replace(/t\.me\/(?!s\/)/, "t.me/s/");  // convert t.me/X to t.me/s/X

  const res = await httpClient.get(embedUrl, { headers: { Accept: "text/html" } });
  const $   = load(res.data);

  const title  = $("meta[property=\"og:description\"]").attr("content") || "";
  const author = $(".tgme_channel_info_header_title").first().text().trim() || "";
  let thumbnail = "";
  const formats = [];

  // Video sources
  $("video source, video[src]").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src");
    if (src && src.startsWith("http")) {
      formats.push({
        type: "video",
        url: src,
        quality: "Original",
        label: "Video " + (formats.filter(f => f.type === "video").length + 1),
      });
    }
  });

  // og:video fallback
  const ogVideo = $("meta[property=\"og:video\"]").attr("content");
  if (ogVideo && !formats.some(f => f.url === ogVideo)) {
    formats.push({ type: "video", url: ogVideo, quality: "Original", label: "Video" });
  }

  // og:image
  const ogImage = $("meta[property=\"og:image\"]").attr("content");
  if (ogImage) {
    thumbnail = ogImage;
    if (!formats.some(f => f.url === ogImage)) {
      formats.push({ type: "image", url: ogImage, quality: "Original", label: "Image 1" });
    }
  }

  if (!formats.length) throw new Error("Telegram: no media found. Only public channel posts are supported.");
  return { title, author, thumbnail, formats };
}

module.exports = { fetchTelegram };
