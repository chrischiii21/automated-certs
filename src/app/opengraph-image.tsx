import { ImageResponse } from 'next/og';
import { SITE } from '@/lib/site';

export const alt = `${SITE.name}: verified certificates only your participants can claim`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Social share card for the landing page.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#1c1b18', color: '#f6f5f1', padding: 72, position: 'relative' }}>
        <div style={{ position: 'absolute', right: -120, top: -160, width: 560, height: 560, borderRadius: 9999, background: 'rgba(51,70,211,0.55)', filter: 'blur(90px)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 640 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 36, fontWeight: 700 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: '#f6f5f1', color: '#1c1b18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800 }}>C</div>
            {SITE.name}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.08 }}>Certificates only your real participants can claim.</div>
            <div style={{ fontSize: 28, marginTop: 24, color: 'rgba(246,245,241,0.7)' }}>Upload a design · add your list · share one link</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 48, marginTop: 70, width: 380, height: 270, background: '#fbf8ef', borderRadius: 16, border: '10px solid #b08d3c', alignItems: 'center', justifyContent: 'center', color: '#2b2a26', transform: 'rotate(4deg)' }}>
          <div style={{ fontSize: 26, letterSpacing: 4, fontWeight: 700 }}>CERTIFICATE</div>
          <div style={{ fontSize: 14, marginTop: 10, color: '#6b6860' }}>PROUDLY PRESENTED TO</div>
          <div style={{ fontSize: 34, marginTop: 14, fontStyle: 'italic', color: '#1f5c33' }}>Juan Dela Cruz</div>
          <div style={{ width: 240, height: 2, background: '#b08d3c', marginTop: 8 }} />
          <div style={{ display: 'flex', marginTop: 18, fontSize: 14, color: '#15803d', fontWeight: 700 }}>VERIFIED PARTICIPANT</div>
        </div>
      </div>
    ),
    size,
  );
}
