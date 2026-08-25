import { NextRequest, NextResponse } from 'next/server';
import { reviewExistingTests } from '@/lib/services/gemini';

export async function POST(req: NextRequest) {
  try {
    const { requirementText, existingTestsContent } = await req.json();

    if (!existingTestsContent) {
      return NextResponse.json(
        { error: 'Existing tests content is required.' },
        { status: 400 }
      );
    }

    const review = await reviewExistingTests(requirementText || '', existingTestsContent);
    return NextResponse.json(review);
  } catch (error: any) {
    console.error('API Error in /api/qa/review-tests:', error);
    return NextResponse.json(
      { error: error.message || 'Internal AI Server Error during test review.' },
      { status: 500 }
    );
  }
}