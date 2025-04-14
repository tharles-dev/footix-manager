/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "ssl.gstatic.com",
      "lh3.googleusercontent.com",
      "avatars.githubusercontent.com",
      "platform-lookaside.fbsbx.com",
      "firebasestorage.googleapis.com",
      "storage.googleapis.com",
      "supabase.co",
      "supabase.in",
      "supabase.com",
      "localhost",
      "127.0.0.1",
    ],
  },
  // ... existing code ...
};

module.exports = nextConfig;
