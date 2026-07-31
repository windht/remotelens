/// <reference types="vite/client" />

import '@fontsource-variable/geist'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/600.css'

import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { SiteFooter } from '~/components/site-footer'
import { SiteHeader } from '~/components/site-header'
import appCss from '~/styles/app.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content:
          'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=yes',
      },
      {
        name: 'theme-color',
        content: '#17211D',
      },
      {
        name: 'application-name',
        content: 'RemoteLens',
      },
      {
        name: 'robots',
        content:
          'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
      },
      {
        name: 'googlebot',
        content:
          'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
      },
      {
        property: 'og:site_name',
        content: 'RemoteLens',
      },
      {
        property: 'og:locale',
        content: 'en_US',
      },
      {
        name: 'twitter:card',
        content: 'summary',
      },
      {
        title: 'RemoteLens — Remote jobs with source evidence',
      },
      {
        name: 'description',
        content:
          'A clean remote developer-job index for humans and AI agents. No ads, no login, and your CV stays local.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      {
        rel: 'icon',
        href: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        rel: 'icon',
        href: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        rel: 'apple-touch-icon',
        href: '/apple-touch-icon.png',
        sizes: '180x180',
      },
      { rel: 'manifest', href: '/site.webmanifest' },
    ],
  }),
  notFoundComponent: () => (
    <main className="narrow-shell py-24" id="main-content" tabIndex={-1}>
      <p className="eyebrow">404 / not found</p>
      <h1 className="mt-4">This index entry does not exist.</h1>
      <p className="lede mt-8">
        Check the address or return to the structured job index.
      </p>
      <a
        className="text-pine mt-8 inline-flex min-h-11 items-center"
        href="/jobs"
      >
        Browse remote jobs
      </a>
    </main>
  ),
  errorComponent: ({ error }) => (
    <main className="narrow-shell py-24" id="main-content" tabIndex={-1}>
      <p className="eyebrow">Request error</p>
      <h1 className="mt-4">RemoteLens could not render this page.</h1>
      <p className="lede mt-8">
        {error instanceof Error
          ? error.message
          : 'Try the request again from the public index.'}
      </p>
    </main>
  ),
  component: RootLayout,
})

function RootLayout() {
  return (
    <RootDocument>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <SiteHeader />
      <Outlet />
      <SiteFooter />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
