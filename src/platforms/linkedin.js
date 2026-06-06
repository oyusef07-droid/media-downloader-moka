"use strict";
const { extractInfo } = require("../ytdlpHelper");

async function fetchLinkedIn(url) {
  // LinkedIn requires authentication for most content.
  // Cookies must be set via LINKEDIN_COOKIES_FILE env var.
  const extraArgs = [];
  if (process.env.LINKEDIN_COOKIES_FILE) {
    extraArgs.push("--cookies", process.env.LINKEDIN_COOKIES_FILE);
  }
  try {
    const info = await extractInfo(url, extraArgs);
    if (info.formats.length) return info;
    throw new Error("LinkedIn: no downloadable media found.");
  } catch (err) {
    if (err.message.includes("login") || err.message.includes("sign in") || err.message.includes("authentication")) {
      throw new Error("LinkedIn: this content requires authentication. Set LINKEDIN_COOKIES_FILE in your .env file.");
    }
    throw err;
  }
}

module.exports = { fetchLinkedIn };
