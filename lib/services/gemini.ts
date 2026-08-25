import { GoogleGenAI } from '@google/genai';
import { RequirementInputData, FullQAPackage, ExistingTestReviewResult, AutomationCodeResult } from '../types/qa';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

// Priority list of verified, active Gemini API models
const SUPPORTED_GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite'
];

/**
 * Extracts and cleans JSON text from model responses.
 */
function cleanAndExtractJson(text: string): string {
  if (!text) return '{}';
  
  // Strip markdown code fences (e.g., ```json ... ```)
  let cleaned = text.replace(/```(?:json)?\s*([\s\S]*?)\s*```/gi, '$1').trim();
  
  // Extract JSON object or array bounds if extra text exists
  const firstBrace = cleaned.search(/[\{\[]/);
  const lastBrace = cleaned.search(/[\}\]][^\}\]]*$/);
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  return cleaned;
}

/**
 * Executes a prompt against Google Gemini with retries and model fallbacks.
 */
async function callGeminiWithRetryAndFallback(prompt: string, maxRetriesPerModel = 2): Promise<string> {
  let lastError: any = null;

  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables.');
  }

  for (const model of SUPPORTED_GEMINI_MODELS) {
    for (let attempt = 1; attempt <= maxRetriesPerModel; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        if (response.text) {
          return cleanAndExtractJson(response.text);
        }
      } catch (error: any) {
        lastError = error;
        const statusCode = error?.status || error?.code || 500;
        const errorMessage = error?.message || '';

        // Model not found (404) -> Skip immediately to next model
        if (statusCode === 404 || errorMessage.includes('404') || errorMessage.includes('not found')) {
          console.warn(`[Gemini API] Model ${model} returned 404. Skipping to next model...`);
          break;
        }

        const isTransientError = statusCode === 503 || statusCode === 429 || errorMessage.includes('503');

        // Exponential backoff retry for rate limits or server load spikes
        if (isTransientError && attempt < maxRetriesPerModel) {
          const delayMs = Math.pow(2, attempt) * 1000;
          console.warn(`[Gemini API] ${model} returned ${statusCode}. Retrying in ${delayMs / 1000}s...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        console.warn(`[Gemini API] Model ${model} failed (${errorMessage || statusCode}). Trying next model...`);
        break;
      }
    }
  }

  throw new Error(`Gemini execution failed: ${lastError?.message || 'All models unavailable'}`);
}

export async function processFullQAPipeline(input: RequirementInputData): Promise<FullQAPackage> {
  const prompt = `
You are a Lead QA Architect & Test Automation Specialist. Perform a rigorous, deep QA evaluation of the following requirement input.

Requirement Meta:
- ID: ${input.requirementId || 'REQ-001'}
- Application: ${input.applicationName || 'General Application'}
- Module: ${input.moduleName || 'Core Module'}
- Domain: ${input.businessDomain || 'Enterprise Software'}

Main Requirement Text:
${input.requirementText}

Acceptance Criteria:
${input.acceptanceCriteria || 'None provided'}

Business Rules:
${input.businessRules || 'None provided'}

Additional Context:
${input.additionalContext || 'None provided'}

Return a valid JSON object matching this schema strictly without markdown backticks:
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
  "testingDimensions": ["Functional", "Negative", "Boundary", "Integration", "API", "UI", "Security", "Performance"],
  "gaps": [
    {
      "gapId": "GAP-001",
      "area": "Authentication / Error Handling / Boundary",
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
    "regressionImpact": ["string"],
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
      "testType": "Negative / Boundary / Functional",
      "objective": "string",
      "preconditions": ["string"],
      "testData": {"param": "value"},
      "testSteps": ["Step 1", "Step 2"],
      "expectedResult": "Detailed expected outcome",
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
      "overallScore": 92,
      "breakdown": {
        "traceability": 10,
        "clarity": 9,
        "completeness": 9,
        "testDataQuality": 9,
        "stepsPrecision": 10,
        "expectedResultClarity": 9,
        "automationSuitability": 10
      },
      "feedback": "Clear step precision and high automation capability."
    }
  ],
  "coverage": {
    "totalRequirements": 1,
    "coveredRequirements": 1,
    "partiallyCoveredRequirements": 0,
    "uncoveredRequirements": 0,
    "totalScenarios": 1,
    "totalTestCases": 1,
    "coverageBreakdown": {
      "positive": 40,
      "negative": 30,
      "boundary": 15,
      "businessRule": 10,
      "integration": 5,
      "security": 0
    },
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
    throw new Error(`Failed to parse AI response as JSON: ${responseText.slice(0, 100)}...`);
  }
}

export async function reviewExistingTests(requirementText: string, existingTestsContent: string): Promise<ExistingTestReviewResult> {
  const prompt = `
Analyze the provided existing test cases against the business requirement.
Identify duplicate tests, redundant tests, missing edge cases, poorly written steps, and gaps in risk coverage.

Requirement Context:
${requirementText}

Existing Test Suite Content:
${existingTestsContent}

Return JSON without backticks:
{
  "findings": [
    {
      "existingTestCase": "TC_OLD_01",
      "findingType": "Duplicate / Missing Scenario / Poorly Written",
      "finding": "string",
      "risk": "High",
      "recommendation": "Rewrite"
    }
  ],
  "duplicates": [
    {
      "primaryTestCase": "TC_OLD_01",
      "duplicateTestCases": ["TC_OLD_05"],
      "similarityReason": "Exact overlap in validation logic",
      "action": "Remove"
    }
  ]
}
`;

  const responseText = await callGeminiWithRetryAndFallback(prompt);
  try {
    return JSON.parse(responseText) as ExistingTestReviewResult;
  } catch (err) {
    throw new Error(`Failed to parse test review JSON: ${responseText.slice(0, 100)}...`);
  }
}

export async function generateAutomationCode(
  testCase: any,
  framework: 'Playwright (TS)' | 'Cypress (TS)' | 'PyTest (Python)' | 'Selenium (Java)'
): Promise<AutomationCodeResult> {
  const prompt = `
Generate production-ready end-to-end automation test code for the following test case:

Target Framework: ${framework}
Test Case Details:
${JSON.stringify(testCase, null, 2)}

Provide structured implementation code following page object model patterns where appropriate, with assertions, error catching, and test data setup.

Return JSON without backticks:
{
  "targetFramework": "${framework}",
  "testCaseId": "${testCase.testCaseId}",
  "code": "executable test code string",
  "setupInstructions": "instructions on dependencies and runner execution"
}
`;

  const responseText = await callGeminiWithRetryAndFallback(prompt);
  try {
    return JSON.parse(responseText) as AutomationCodeResult;
  } catch (err) {
    throw new Error(`Failed to parse automation code JSON: ${responseText.slice(0, 100)}...`);
  }
}
