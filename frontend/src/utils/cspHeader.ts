// const API_URL = process.env.VITE_API_URL || 'http://localhost:5000';
const SET_CSP = process.env.VITE_SET_CSP;

const getCspHeader = () => {
  const isDev = process.env.NODE_ENV === 'development';

  const connectSrc = isDev
    ? `connect-src 'self' * ws: wss:`
    : "connect-src 'self' https://your-api.com wss://your-api.com";

  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self'";

  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      connectSrc,
      "frame-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "object-src 'none'"
    ].join('; ')
  };
};


export const cspHeader = SET_CSP === 'yes' ? getCspHeader() : {};
  