import { NextResponse } from 'next/server';
import { processFullQAPipeline } from '@/lib/services/gemini';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.requirementText || body.requirementText.trim() === '') {
      return NextResponse.json(
        { error: 'Requirement text is required.' },
        { status: 400 }
      );
    }

    const result = await processFullQAPipeline(body);
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('[API Error /api/qa/analyze]:', error);

    // Final safety net: Ensure the error string is clean before sending to client
    let cleanErrorMessage = error?.message || 'An error occurred while processing the requirement.';
    try {
      const parsed = JSON.parse(cleanErrorMessage);
      cleanErrorMessage = parsed?.error?.message || parsed?.message || cleanErrorMessage;
    } catch {
      // Ignore if it's already a clean string
    }

    return NextResponse.json(
      { error: cleanErrorMessage },
      { status: 500 }
    );
  }
}
