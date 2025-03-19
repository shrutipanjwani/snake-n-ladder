/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    REACT_APP_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  }
}

export default nextConfig 