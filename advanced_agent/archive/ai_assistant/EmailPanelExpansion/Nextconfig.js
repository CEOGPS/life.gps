// Next.js config
/** @type {import('next').NextConfig} */
module.exports = {
  swcMinify: true,
  images: { domains: ["yourdomain.com"] },
  compiler: { removeConsole: process.env.NODE_ENV === "production" },
};
