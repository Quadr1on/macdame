/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Google OAuth avatars
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      // Product photos uploaded through /admin into the product-images bucket
      { protocol: 'https', hostname: 'dzfynmkoqtlsesasutge.supabase.co' },
    ],
  },
};

export default nextConfig;
