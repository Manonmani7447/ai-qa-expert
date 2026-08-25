export interface RequirementInputData {
  requirementId?: string;
  applicationName?: string;
  moduleName?: string;
  businessDomain?: string;
  requirementText: string;
  acceptanceCriteria?: string;
  businessRules?: string;
  additionalContext?: string;
}

export interface RequirementComponentAnalysis {
  actors: string[];
  preconditions: string[];
  inputs: string[];
  outputs: string[];
  businessRules: string[];
  validations: string[];
  processingLogic: string[];
  dependencies: string[];
  integrations: string[];
  errorConditions: string[];
  expectedBehavior: string[];
  postconditions: string[];
}

export interface GapAnalysisItem {
  gapId: string;
  area: string;
  gapDescription: string;
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  clarificationQuestion: string;
  classification: 'Confirmed Requirement' | 'Assumption' | 'Clarification Required';
}

export interface TestStrategy {
  scope: string[];
  outOfScope: string[];
  testingTypesRequired: string[];
  highRiskAreas: string[];
  criticalBusinessFlows: string[];
  recommendedTestData: string[];
  dependencies: string[];
  environmentRequirements: string[];
  regressionImpact: string[];
  recommendedAutomationStrategy: string;
}

export interface TestScenario {
  scenarioId: string;
  requirementId: string;
  scenarioTitle: string;
  testType: string;
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  reason: string;
  expectedCoverage: string;
}

export interface ExecutableTestCase {
  testCaseId: string;
  requirementId: string;
  scenarioId: string;
  title: string;
  testType: string;
  objective: string;
  preconditions: string[];
  testData: Record<string, string>;
  testSteps: string[];
  expectedResult: string;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  severity: 'S1' | 'S2' | 'S3' | 'S4';
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  automationCandidate: 'AUTOMATE' | 'POSSIBLY AUTOMATE' | 'MANUAL';
  automationReason: string;
  traceabilityTag: string;
  techniqueApplied: 'Equivalence Partitioning' | 'Boundary Value Analysis' | 'Decision Table' | 'State Transition' | 'Pairwise' | 'Error Guessing' | 'Risk-Based';
}

export interface QAQualityScore {
  testCaseId: string;
  overallScore: number;
  breakdown: {
    traceability: number;
    clarity: number;
    completeness: number;
    testDataQuality: number;
    stepsPrecision: number;
    expectedResultClarity: number;
    automationSuitability: number;
  };
  feedback: string;
}

export interface CoverageAnalysis {
  totalRequirements: number;
  coveredRequirements: number;
  partiallyCoveredRequirements: number;
  uncoveredRequirements: number;
  totalScenarios: number;
  totalTestCases: number;
  coverageBreakdown: {
    positive: number;
    negative: number;
    boundary: number;
    businessRule: number;
    integration: number;
    security: number;
  };
  matrix: TraceabilityRow[];
}

export interface TraceabilityRow {
  requirementId: string;
  requirementSummary: string;
  scenarioIds: string[];
  testCaseIds: string[];
  coverageStatus: 'Full' | 'Partial' | 'None';
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  identifiedGapCount: number;
}

export interface FullQAPackage {
  analysis: RequirementComponentAnalysis;
  testingDimensions: string[];
  gaps: GapAnalysisItem[];
  strategy: TestStrategy;
  scenarios: TestScenario[];
  testCases: ExecutableTestCase[];
  syntheticTestData: Record<string, string[]>;
  qualityScores: QAQualityScore[];
  coverage: CoverageAnalysis;
  executiveSummary: {
    overallRiskRating: 'Critical' | 'High' | 'Medium' | 'Low';
    readinessScore: number;
    keyRecommendations: string[];
  };
}

export interface ExistingTestReviewResult {
  findings: Array<{
    existingTestCase: string;
    findingType: 'Duplicate' | 'Redundant' | 'Missing Scenario' | 'Incorrect' | 'Outdated' | 'Poorly Written' | 'Missing Edge Case';
    finding: string;
    risk: 'Critical' | 'High' | 'Medium' | 'Low';
    recommendation: 'Keep' | 'Merge' | 'Remove' | 'Rewrite';
  }>;
  duplicates: Array<{
    primaryTestCase: string;
    duplicateTestCases: string[];
    similarityReason: string;
    action: 'Keep' | 'Merge' | 'Remove' | 'Rewrite';
  }>;
}

export interface AutomationCodeResult {
  targetFramework: 'Playwright (TS)' | 'Cypress (TS)' | 'PyTest (Python)' | 'Selenium (Java)';
  testCaseId: string;
  code: string;
  setupInstructions: string;
}