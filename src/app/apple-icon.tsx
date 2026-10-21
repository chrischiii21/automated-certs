import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// Home-screen icon for iOS: the Certify ribbon mark, matching app/icon.svg.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1c1b18' }}>
        <svg width="112" height="112" viewBox="0 0 24 24" fill="none" stroke="#f6f5f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" />
          <circle cx="12" cy="8" r="6" />
        </svg>
      </div>
    ),
    size,
  );
}
