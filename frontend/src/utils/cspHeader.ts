const API_URL = process.env.VITE_BACKEND_URL || 'http://localhost:5000';
const SET_CSP = process.env.VITE_SET_CSP;

const getCspHeader = () => {
  const isDev = process.env.NODE_ENV === 'development';
  const domain = API_URL.replace(/^https?:\/\//, '');

  const connectSrc = isDev
    ? `connect-src 'self' http://localhost:* https://localhost:*`
    : `connect-src 'self' ${API_URL} wss://${domain} https://*.s3.amazonaws.com https://*.s3.*.amazonaws.com`;

  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self'";

  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https://avatars.githubusercontent.com https://loremflickr.com https://*.cloudfront.net data: https://*.s3.amazonaws.com https://*.s3.*.amazonaws.com",
      "font-src 'self' https://fonts.googleapis.com data:",
      connectSrc,
      "frame-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "object-src 'none'"
    ].join('; ')
  };
};


export const cspHeader = SET_CSP === 'yes' ? getCspHeader() : {};
  