const axios = require("axios");

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

const httpClient = axios.create({
  timeout: 20000,
  headers: { "User-Agent": randomUA(), "Accept-Language": "en-US,en;q=0.9" },
  maxRedirects: 10,
});

httpClient.interceptors.request.use((config) => {
  config.headers["User-Agent"] = randomUA();
  return config;
});

module.exports = { httpClient, randomUA };
