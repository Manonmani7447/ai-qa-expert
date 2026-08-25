import { NextRequest, NextResponse } from 'next/server';
import { generateAutomationCode } from '@/lib/services/gemini';

export async function POST(req: NextRequest) {
  try {
    const { testCase, framework } = await req.json();

    if (!testCase || !framework) {
      return NextResponse.json(
        { error: 'Missing testCase or framework parameter.' },
        { status: 400 }
      );
    }

    const codeResult = await generateAutomationCode(testCase, framework);
    return NextResponse.json(codeResult);
  } catch (error: any) {
    console.error('API Error in /api/qa/generate-automation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal AI Server Error during code generation.' },
      { status: 500 }
    );
  }
}