/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@wallet/openapi-client"]
};

export default nextConfig;
