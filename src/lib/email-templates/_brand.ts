// Brand tokens shared by all auth email templates.
// Keep in sync with src/styles.css.

export const BRAND = {
  name: 'ArqHub',
  primary: '#4B6241',
  primaryDark: '#3B4E33',
  ink: '#0A0A0A',
  inkMuted: '#525252',
  text: '#1F1F1F',
  textSoft: '#737373',
  surface: '#FAFAF9',
  border: '#ECECEA',
  borderStrong: '#D6D6D3',
  accent: '#EEF2E8',
  logoUrl:
    'https://arqhub.world/media/logo-a.png',
  siteUrl: 'https://arqhub.world',
} as const

const fontStack =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'

export const styles = {
  main: {
    backgroundColor: '#FFFFFF',
    fontFamily: fontStack,
    margin: 0,
    padding: '40px 16px',
    color: BRAND.text,
  },
  container: {
    maxWidth: '520px',
    margin: '0 auto',
    backgroundColor: '#FFFFFF',
    border: `1px solid ${BRAND.border}`,
    borderRadius: '14px',
    overflow: 'hidden',
  },
  header: {
    padding: '28px 32px 0',
    textAlign: 'left' as const,
  },
  logo: {
    height: '32px',
    width: 'auto',
    display: 'block',
  },
  body: {
    padding: '24px 32px 8px',
  },
  eyebrow: {
    fontSize: '11px',
    lineHeight: 1,
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    color: BRAND.primary,
    fontWeight: 600,
    margin: '0 0 14px',
  },
  h1: {
    fontFamily: fontStack,
    fontSize: '24px',
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
    fontWeight: 600,
    color: BRAND.ink,
    margin: '0 0 16px',
  },
  text: {
    fontSize: '15px',
    lineHeight: 1.6,
    color: BRAND.text,
    margin: '0 0 20px',
  },
  link: {
    color: BRAND.primary,
    textDecoration: 'underline',
    fontWeight: 500,
  },
  buttonWrap: {
    padding: '8px 0 24px',
  },
  button: {
    backgroundColor: BRAND.primary,
    color: '#FFFFFF',
    fontSize: '15px',
    fontWeight: 600,
    borderRadius: '10px',
    padding: '13px 24px',
    textDecoration: 'none',
    display: 'inline-block',
  },
  code: {
    display: 'inline-block',
    fontFamily: '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '28px',
    fontWeight: 600,
    letterSpacing: '0.3em',
    color: BRAND.ink,
    backgroundColor: BRAND.accent,
    border: `1px solid ${BRAND.border}`,
    padding: '14px 22px',
    borderRadius: '10px',
    margin: '0 0 24px',
  },
  hr: {
    border: 'none',
    borderTop: `1px solid ${BRAND.border}`,
    margin: '8px 32px',
  },
  footer: {
    padding: '20px 32px 28px',
    fontSize: '12px',
    lineHeight: 1.5,
    color: BRAND.textSoft,
  },
  footerStrong: {
    color: BRAND.ink,
    fontWeight: 600,
    textDecoration: 'none',
  },
} as const
