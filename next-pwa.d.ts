declare module 'next-pwa' {
  import { NextConfig } from 'next';

  interface PWAConfig {
    dest?: string;
    public?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean | (() => boolean);
    buildExcludes?: string[];
    fallbacks?: Record<string, string>;
  }

  function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;

  export default withPWA;
}
