'use client';
import NextLink, { LinkProps as NextLinkProps } from 'next/link';
import { usePathname } from 'next/navigation';
import { AnchorHTMLAttributes, forwardRef, useMemo } from 'react';
import Script from 'next/script';

export type LinkProps = Omit<NextLinkProps, 'href'> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof NextLinkProps> & {
    href: string;
  };

const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ href, children, className, ...props }, ref) => {
    const pathname = usePathname();

    const { isExternalLink, isSameZoneLink, isOtherZoneLink } = useMemo(() => {
      const isExternal = /^(https?:\/\/|mailto:|tel:)/.test(href);

      const getAppName = (path: string) => {
        const segments = path.split('/');
        return segments[1] || '';
      };

      const currentAppName = getAppName(pathname);
      const linkAppName = getAppName(href);

      return {
        isExternalLink: isExternal,
        isSameZoneLink: !isExternal && currentAppName === linkAppName,
        isOtherZoneLink:
          !isExternal && currentAppName !== linkAppName && href.startsWith('/'),
      };
    }, [href, pathname]);

    const speculationRules = useMemo(() => {
      if (isOtherZoneLink) {
        const rules = {
          prefetch: [
            {
              source: 'list',
              eagerness: 'moderate',
              urls: [href],
            },
          ],
          prerender: [
            {
              source: 'list',
              eagerness: 'conservative',
              urls: [href],
            },
          ],
        };
        return JSON.stringify(rules);
      }
      return null;
    }, [href, isOtherZoneLink]);

    if (isExternalLink) {
      return (
        <a
          ref={ref}
          href={href}
          className={className}
          rel="noopener noreferrer"
          target="_blank"
          {...props}
        >
          {children}
        </a>
      );
    }

    if (isSameZoneLink) {
      return (
        <NextLink ref={ref} href={href} className={className} {...props}>
          {children}
        </NextLink>
      );
    }

    return (
      <>
        <a ref={ref} href={href} className={className} {...props}>
          {children}
        </a>
        {speculationRules && (
          <Script
            id={`prefetch-${href}`}
            type="speculationrules"
            dangerouslySetInnerHTML={{ __html: speculationRules }}
          />
        )}
      </>
    );
  }
);

Link.displayName = 'Link';

export default Link;
