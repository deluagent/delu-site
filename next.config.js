/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    AGENT_API_URL: process.env.AGENT_API_URL || 'http://localhost:3737',
    VENICE_API_KEY: process.env.VENICE_API_KEY || '',
    BANKR_API_KEY: process.env.BANKR_API_KEY || '',
  },
};
module.exports = nextConfig;
