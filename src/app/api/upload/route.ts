import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { ensureViewer } from '@/lib/auth';

// Issues short-lived tokens so the browser can upload template images and
// logos straight to Vercel Blob (bypassing the serverless request size limit).
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // Guests may upload too (that's how they try the app); this starts their guest session.
        await ensureViewer();
        return {
          allowedContentTypes: ['image/png', 'image/jpeg', 'image/webp'],
          maximumSizeInBytes: 20 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
