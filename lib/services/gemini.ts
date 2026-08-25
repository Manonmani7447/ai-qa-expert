import { GoogleGenAI } from '@google/genai';
import { RequirementInputData, FullQAPackage, ExistingTestReviewResult, AutomationCodeResult } from '../types/qa';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

// Fallback chain to handle 503 (High Demand) capacity limits
const SUPPORTED_GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash'
];

/**
 * Strips markdown fences and extracts pure JSON text.
 */
function cleanAndExtractJson(text: string): string {
  if (!text) return '{}';
  let cleaned = text.replace(/```(?:json)?\s*([\s\S]*?)\s*```/gi, '$1').trim();
  const firstBrace = cleaned.search(/[\{\[]/);
  const lastBrace = cleaned.search(/[\}\]][^\}\]]*$/);
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

/**
 * Normalizes nested JSON string errors from the Google SDK into readable text.
 */
function parseGeminiError(err: any): string {
  if (!err) return 'An unexpected AI error occurred.';
  let message = err.message || String(err);
  try {
    const parsed = JSON.parse(message);
    if (parsed?.error?.message) return parsed.error.message;
    if (parsed?.message) return parsed.message;
  } catch {
    // If it's not JSON, just return the string
  }
  return message;
}

/**
 * Handles model failover.
 */
async function callGeminiWithRetryAndFallback(prompt: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }

  let lastErrorText = '';

  for (const model of SUPPORTED_GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      if (response?.text) {
        return cleanAndExtractJson(response.text);
      }
    } catch (err: any) {
      lastErrorText = parseGeminiError(err);
      console.warn(`[Gemini API] Model ${model} failed: ${lastErrorText}. Trying fallback...`);
      // Immediately try the next model in the array
      continue;
    }
  }

  throw new Error(`AI models are currently experiencing high demand. Please try again in a few seconds. Details: ${lastErrorText}`);
}

export async function processFullQAPipeline(input: RequirementInputData): Promise<FullQAPackage> {
  const prompt = `
Act as a Lead QA Architect. Conduct a deep QA evaluation of this requirement input:

Requirement ID: ${input.requirementId || 'REQ-001'}
Application: ${input.applicationName || 'General Application'}
Module: ${input.moduleName || 'Core Module'}
Domain: ${input.businessDomain || 'Enterprise Software'}

Main Requirement Text:
${input.requirementText}

Acceptance Criteria:
${input.acceptanceCriteria || 'None provided'}

Business Rules:
${input.businessRules || 'None provided'}

Additional Context:
${input.additionalContext || 'None provided'}

Return a single valid JSON object matching this schema strictly without markdown backticks:
{
  "analysis": {
    "actors": ["string"],
    "preconditions": ["string"],
    "inputs": ["string"],
    "outputs": ["string"],
    "businessRules": ["string"],
    "validations": ["string"],
    "processingLogic": ["string"],
    "dependencies": ["string"],
    "integrations": ["string"],
    "errorConditions": ["string"],
    "expectedBehavior": ["string"],
    "postconditions": ["string"]
  },
  "testingDimensions": ["Functional", "Negative", "Boundary", "Integration", "Security"],
  "gaps": [
    {
      "gapId": "GAP-001",
      "area": "Authentication / Limits",
      "gapDescription": "string",
      "riskLevel": "Critical",
      "clarificationQuestion": "string",
      "classification": "Clarification Required"
    }
  ],
  "strategy": {
    "scope": ["string"],
    "outOfScope": ["string"],
    "testingTypesRequired": ["string"],
    "highRiskAreas": ["string"],
    "criticalBusinessFlows": ["string"],
    "recommendedTestData": ["string"],
    "dependencies": ["string"],
    "environmentRequirements": ["string"],
    "regressionImpact": "string",
    "recommendedAutomationStrategy": "string"
  },
  "scenarios": [
    {
      "scenarioId": "SC-001",
      "requirementId": "${input.requirementId || 'REQ-001'}",
      "scenarioTitle": "string",
      "testType": "Functional",
      "riskLevel": "High",
      "priority": "P1",
      "reason": "string",
      "expectedCoverage": "string"
    }
  ],
  "testCases": [
    {
      "testCaseId": "TC-001",
      "requirementId": "${input.requirementId || 'REQ-001'}",
      "scenarioId": "SC-001",
      "title": "string",
      "testType": "Functional",
      "objective": "string",
      "preconditions": ["string"],
      "testData": {"amount": 5000},
      "testSteps": ["Step 1", "Step 2"],
      "expectedResult": "string",
      "priority": "P1",
      "severity": "S1",
      "riskLevel": "High",
      "automationCandidate": "AUTOMATE",
      "automationReason": "string",
      "traceabilityTag": "REQ-001 -> SC-001 -> TC-001",
      "techniqueApplied": "Boundary Value Analysis"
    }
  ],
  "syntheticTestData": {
    "valid": ["string"],
    "invalid": ["string"],
    "boundary": ["string"],
    "malformed": ["string"]
  },
  "qualityScores": [
    {
      "testCaseId": "TC-001",
      "overallScore": 90,
      "breakdown": {
        "traceability": 10,
        "clarity": 9,
        "completeness": 9,
        "testDataQuality": 9,
        "stepsPrecision": 9,
        "expectedResultClarity": 9,
        "automationSuitability": 9
      },
      "feedback": "Clear steps and traceable scope."
    }
  ],
  "coverage": {
    "totalRequirements": 1,
    "coveredRequirements": 1,
    "partiallyCoveredRequirements": 0,
    "uncoveredRequirements": 0,
    "totalScenarios": 1,
    "totalTestCases": 1,
    "coverageBreakdown": { "positive": 50, "negative": 30, "boundary": 20 },
    "matrix": [
      {
        "requirementId": "${input.requirementId || 'REQ-001'}",
        "requirementSummary": "string",
        "scenarioIds": ["SC-001"],
        "testCaseIds": ["TC-001"],
        "coverageStatus": "Full",
        "riskLevel": "High",
        "identifiedGapCount": 1
      }
    ]
  },
  "executiveSummary": {
    "overallRiskRating": "High",
    "readinessScore": 85,
    "keyRecommendations": ["string"]
  }
}
`;

  const responseText = await callGeminiWithRetryAndFallback(prompt);
  try {
    return JSON.parse(responseText) as FullQAPackage;
  } catch (err) {
    throw new Error('Failed to parse AI output into valid JSON.');
  }
}
