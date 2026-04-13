/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // For GitHub Pages deployment - update this with your repo name
  basePath: process.env.NODE_ENV === "production" ? "/byggesak-chatbot" : "",
  assetPrefix:
    process.env.NODE_ENV === "production" ? "/byggesak-chatbot/" : "",
};

module.exports = nextConfig;
