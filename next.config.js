/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    AGENT_API_URL: process.env.AGENT_API_URL || 'http://localhost:3737',
    VENICE_API_KEY: process.env.VENICE_API_KEY || '',
    BANKR_API_KEY: process.env.BANKR_API_KEY || '',
  },
};
module.exports = nextConfig;
// rebuild v2: 2026-04-14 20:50 Tue Apr 14 20:31:57 UTC 2026
