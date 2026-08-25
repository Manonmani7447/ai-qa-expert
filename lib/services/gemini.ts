import { GoogleGenAI } from '@google/genai';
import { RequirementInputData, FullQAPackage, ExistingTestReviewResult, AutomationCodeResult } from '../types/qa';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

// Fallback chain for capacity limits (503 / 429)
const SUPPORTED_GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-2.5-pro'
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
 * Normalizes error messages into clean readable text instead of nested JSON strings.
 */
function parseErrorMessage(err: any): string {
  if (!err) return 'An unexpected error occurred.';
  let message = err.message || String(err);
  
  try {
    const parsed = JSON.parse(message);
    if (parsed?.error?.message) return parsed.error.message;
    if (parsed?.message) return parsed.message;
  } catch {
    // Keep raw string if it's not JSON
  }
  
  return message;
}

/**
 * Handles model failover and retries on 503 (High Demand) or 429 (Rate Limit).
 */
async function callGeminiWithRetryAndFallback(prompt: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }

  let lastErrorText = '';

  for (const model of SUPPORTED_GEMINI_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
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
        lastErrorText = parseErrorMessage(err);
        console.warn(`[Gemini Engine] Model ${model} (Attempt ${attempt}) error: ${lastErrorText}`);

        const isTransient = lastErrorText.includes('503') || 
                            lastErrorText.includes('high demand') || 
                            lastErrorText.includes('UNAVAILABLE') || 
                            lastErrorText.includes('429');

        // If high demand spike, wait briefly before retrying or switching models
        if (isTransient && attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
          continue;
        }
        
        // Break to next model on failure
        break;
      }
    }
  }

  throw new Error(`AI model experiencing high demand. Please try again in a few moments. (${lastErrorText})`);
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

export async function reviewExistingTests(requirementText: string, existingTestsContent: string): Promise<ExistingTestReviewResult> {
  const prompt = `
Compare existing test cases against requirement text:
Requirement: ${requirementText}
Existing Tests: ${existingTestsContent}

Return valid JSON:
{
  "findings": [{"existingTestCase": "TC_01", "findingType": "Missing Edge Case", "finding": "string", "risk": "High", "recommendation": "Rewrite"}],
  "duplicates": [{"primaryTestCase": "TC_01", "duplicateTestCases": ["TC_03"], "similarityReason": "Overlap", "action": "Merge"}]
}
`;

  const responseText = await callGeminiWithRetryAndFallback(prompt);
  return JSON.parse(responseText) as ExistingTestReviewResult;
}

export async function generateAutomationCode(testCase: any, framework: string): Promise<AutomationCodeResult> {
  const prompt = `
Generate executable ${framework} test code for:
${JSON.stringify(testCase, null, 2)}

Return valid JSON:
{
  "targetFramework": "${framework}",
  "testCaseId": "${testCase.testCaseId}",
  "code": "// Executable automated code string",
  "setupInstructions": "npm install @playwright/test"
}
`;

  const responseText = await callGeminiWithRetryAndFallback(prompt);
  return JSON.parse(responseText) as AutomationCodeResult;
}
