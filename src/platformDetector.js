const PLATFORM_PATTERNS = [
  { name: "youtube",    regex: /(?:youtube\.com|youtu\.be)/i },
  { name: "instagram",  regex: /instagram\.com/i },
  { name: "tiktok",    regex: /(?:tiktok\.com|vt\.tiktok\.com)/i },
  { name: "twitter",   regex: /(?:twitter\.com|x\.com)/i },
  { name: "facebook",  regex: /(?:facebook\.com|fb\.watch|fb\.com)/i },
  { name: "reddit",    regex: /reddit\.com/i },
  { name: "pinterest", regex: /(?:pinterest\.(?:com|co\.uk|ca|au|fr|de)|pin\.it)/i },
  { name: "linkedin",  regex: /linkedin\.com/i },
  { name: "threads",   regex: /threads\.net/i },
  { name: "telegram",  regex: /t\.me/i },
  { name: "snapchat",  regex: /(?:snapchat\.com|story\.snapchat\.com)/i },
  { name: "twitch",    regex: /twitch\.tv/i },
  { name: "vimeo",     regex: /vimeo\.com/i },
  { name: "soundcloud",regex: /(?:soundcloud\.com|on\.soundcloud\.com)/i },
];

// Resolve short URLs (pin.it, on.soundcloud.com, fb.watch, etc.)
async function resolveShortUrl(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    clearTimeout(timeout);
    return res.url || url;
  } catch {
    return url;
  }
}

function detectPlatform(url) {
  try {
    const normalized = url.trim().toLowerCase();
    for (const { name, regex } of PLATFORM_PATTERNS) {
      if (regex.test(normalized)) return name;
    }
    return null;
  } catch { return null; }
}

module.exports = { detectPlatform, resolveShortUrl };
