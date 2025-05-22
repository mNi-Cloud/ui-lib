import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
 
const nextConfig: NextConfig = {
    assetPrefix: "/service-static",
    output: 'standalone',
}; 
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);