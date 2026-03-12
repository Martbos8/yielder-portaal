/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        // Catch all frontend routes — serve the static HTML
        source: "/:path((?!api|auth|_next).*)",
        destination: "/index.html",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com",
              "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://images.icecat.biz https://resource.logitech.com https://www.jabra.com https://adoption.microsoft.com https://cdsassets.apple.com https://upload.wikimedia.org https://cdn.worldvectorlogo.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
            ].join("; ") + ";",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
