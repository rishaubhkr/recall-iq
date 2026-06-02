import type { NextConfig } from "next";

// next-pwa v5 uses webpack — disable PWA in dev to allow Turbopack
const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-Frame-Options",        value: "SAMEORIGIN" },  // was DENY — Clerk needs iframes
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",     value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",

      // Scripts: self + Clerk CDN + Cloudflare Turnstile CAPTCHA + Google reCAPTCHA
      [
        "script-src",
        "'self'",
        "'unsafe-eval'",
        "'unsafe-inline'",
        "https://clerk.accounts.dev",
        "https://*.clerk.accounts.dev",
        "https://*.clerk.com",               // Clerk hosted JS
        "https://challenges.cloudflare.com", // Turnstile CAPTCHA
        "https://www.google.com",            // reCAPTCHA fallback
        "https://www.gstatic.com",           // reCAPTCHA assets
        "https://recaptcha.net",             // reCAPTCHA alternate domain
      ].join(" "),

      // Styles: Google Fonts + jsdelivr (KaTeX)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",

      // Fonts
      "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",

      // Images: Clerk avatars + Google user profile pictures
      [
        "img-src",
        "'self'",
        "data:",
        "blob:",
        "https://img.clerk.com",
        "https://*.googleusercontent.com",   // Google SSO profile photos
        "https://www.gstatic.com",           // Google icons in SSO button
        "https://lh3.googleusercontent.com",
      ].join(" "),

      // Network connections: Convex WS + Clerk API
      [
        "connect-src",
        "'self'",
        "https://*.convex.cloud",
        "wss://*.convex.cloud",
        "https://*.clerk.accounts.dev",
        "https://clerk.io",
        "https://api.clerk.com",
        "https://*.clerk.com",
        "https://challenges.cloudflare.com", // Turnstile token submission
        "https://www.google.com",            // reCAPTCHA verify
      ].join(" "),

      // Frames: Clerk account portal + Turnstile CAPTCHA + reCAPTCHA
      [
        "frame-src",
        "https://*.clerk.accounts.dev",
        "https://accounts.clerk.com",
        "https://challenges.cloudflare.com", // ← was missing — caused the bug
        "https://www.google.com",            // reCAPTCHA iframe
        "https://recaptcha.net",             // reCAPTCHA alternate
      ].join(" "),

      // Workers: Cloudflare Turnstile uses a service worker
      "worker-src 'self' blob: https://challenges.cloudflare.com",
    ].join("; "),
  },
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
];

const baseConfig: NextConfig = {
  turbopack: {}, // silence Turbopack warning
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

let exportConfig: NextConfig = baseConfig;

if (isProd) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const withPWA = require("next-pwa");
  exportConfig = withPWA({
    dest: "public",
    register: true,
    skipWaiting: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.convex\.cloud\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "convex-api",
          expiration: { maxEntries: 50, maxAgeSeconds: 300 },
        },
      },
    ],
  })(baseConfig);
}

export default exportConfig;
