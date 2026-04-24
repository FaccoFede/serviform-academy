import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['192.168.1.78'],
  reactCompiler: true,
  transpilePackages: ['jspdf'],
};

export default nextConfig;
