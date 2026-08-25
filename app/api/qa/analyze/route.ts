// app/api/analyze/route.ts (Next.js App Router)
import { NextResponse } from 'next/server';
import { processFullQAPipeline } from '@/lib/services/gemini';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await processFullQAPipeline(body);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API Route Error]:', error);
    // Always return JSON format on error
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
