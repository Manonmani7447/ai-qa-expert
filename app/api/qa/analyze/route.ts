import { NextRequest, NextResponse } from 'next/server';
import { processFullQAPipeline } from '@/lib/services/gemini';
import { RequirementInputData } from '@/lib/types/qa';

export async function POST(req: NextRequest) {
  try {
    const body: RequirementInputData = await req.json();

    if (!body.requirementText || body.requirementText.trim().length < 10) {
      return NextResponse.json(
        { error: 'Requirement text is required and must be at least 10 characters long.' },
        { status: 400 }
      );
    }

    const result = await processFullQAPipeline(body);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error in /api/qa/analyze:', error);
    return NextResponse.json(
      { error: error.message || 'Internal AI Server Error during QA analysis.' },
      { status: 500 }
    );
  }
}