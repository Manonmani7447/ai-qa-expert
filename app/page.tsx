'use client';

import React, { useState } from 'react';
import { 
  FileText, AlertTriangle, ShieldCheck, Cpu, Code2, 
  Layers, Search, Sparkles, RefreshCw
} from 'lucide-react';
import { FullQAPackage, RequirementInputData, ExistingTestReviewResult, AutomationCodeResult } from '@/lib/types/qa';

export default function AIQAExpertDashboard() {
  const [activeTab, setActiveTab] = useState<'input' | 'gaps' | 'strategy' | 'scenarios' | 'cases' | 'review' | 'automation'>('input');
  const [loading, setLoading] = useState(false);
  const [inputData, setInputData] = useState<RequirementInputData>({
    requirementId: 'REQ-2026-001',
    applicationName: 'FinTech Payment Portal',
    moduleName: 'Instant Fund Transfer',
    businessDomain: 'Banking & Payments',
    requirementText: 'Users should be able to transfer money up to $10,000 per day to any registered account using 2-Factor Authentication (2FA). Transfers over $5,000 require secondary manager approval. System must reject transactions if account balance is insufficient or if daily threshold is breached.',
    acceptanceCriteria: '1. Transfer fails if amount > available balance.\n2. 2FA pin is mandated before transaction dispatch.\n3. Transfers > $5,000 status set to PENDING_APPROVAL.',
    businessRules: 'Daily limit: $10,000. Approval threshold: $5,000. Operating hours: 24/7.',
    additionalContext: 'Target SLA response time for API is < 200ms.'
  });

  const [qaResult, setQaResult] = useState<FullQAPackage | null>(null);
  const [existingTestsText, setExistingTestsText] = useState('');
  const [reviewResult, setReviewResult] = useState<ExistingTestReviewResult | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const [selectedTestCaseForAutomation, setSelectedTestCaseForAutomation] = useState<string>('');
  const [selectedFramework, setSelectedFramework] = useState<'Playwright (TS)' | 'Cypress (TS)' | 'PyTest (Python)' | 'Selenium (Java)'>('Playwright (TS)');
  const [automationResult, setAutomationResult] = useState<AutomationCodeResult | null>(null);
  const [automationLoading, setAutomationLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/qa/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputData),
      });
      const data = await res.json();
      if (res.ok) {
        setQaResult(data);
        setActiveTab('gaps');
      } else {
        alert(data.error || 'Analysis failed');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewExisting = async () => {
    if (!existingTestsText) return alert('Please enter or paste existing test cases.');
    setReviewLoading(true);
    try {
      const res = await fetch('/api/qa/review-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirementText: inputData.requirementText,
          existingTestsContent: existingTestsText,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviewResult(data);
      } else {
        alert(data.error || 'Review failed');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleGenerateAutomation = async () => {
    if (!qaResult || !selectedTestCaseForAutomation) return alert('Select a test case first.');
    const tc = qaResult.testCases.find(t => t.testCaseId === selectedTestCaseForAutomation);
    if (!tc) return;

    setAutomationLoading(true);
    try {
      const res = await fetch('/api/qa/generate-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testCase: tc,
          framework: selectedFramework,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAutomationResult(data);
      } else {
        alert(data.error || 'Generation failed');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    } finally {
      setAutomationLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <header className="border-b border-slate-800 bg-slate-950/80 sticky top-0 z-50 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              AI QA Expert
              <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full">v1.0 Pro</span>
            </h1>
            <p className="text-xs text-slate-400">Intelligent Test Engineering Assistant — From Requirement to Test Automation</p>
          </div>
        </div>

        {qaResult && (
          <div className="flex items-center space-x-4 bg-slate-900 px-4 py-2 rounded-lg border border-slate-800">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Readiness Score</span>
              <span className="text-sm font-semibold text-emerald-400">{qaResult.executiveSummary.readinessScore}/100</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Overall Risk</span>
              <span className={`text-sm font-semibold ${qaResult.executiveSummary.overallRiskRating === 'Critical' ? 'text-red-400' : 'text-amber-400'}`}>
                {qaResult.executiveSummary.overallRiskRating}
              </span>
            </div>
          </div>
        )}
      </header>

      <div className="flex">
        <aside className="w-64 border-r border-slate-800 bg-slate-950 p-4 space-y-1 min-h-[calc(100vh-73px)]">
          {[
            { id: 'input', label: '1. Requirement Input', icon: FileText },
            { id: 'gaps', label: '2. Gap Analysis', icon: AlertTriangle, disabled: !qaResult },
            { id: 'strategy', label: '3. Strategy & Scenarios', icon: Layers, disabled: !qaResult },
            { id: 'cases', label: '4. Test Cases & Quality', icon: ShieldCheck, disabled: !qaResult },
            { id: 'review', label: '5. Existing Test Review', icon: Search },
            { id: 'automation', label: '6. Code Automation', icon: Code2, disabled: !qaResult },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                disabled={tab.disabled}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : tab.disabled
                    ? 'text-slate-600 cursor-not-allowed'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        <main className="flex-1 p-8 max-w-7xl mx-auto space-y-6">
          {activeTab === 'input' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Requirement Capture</h2>
                  <p className="text-sm text-slate-400">Provide user stories, acceptance criteria, or business rules for AI assessment.</p>
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {loading ? 'Analyzing Requirement...' : 'Execute Analysis'}
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Req ID</label>
                  <input
                    type="text"
                    value={inputData.requirementId}
                    onChange={(e) => setInputData({ ...inputData, requirementId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Application</label>
                  <input
                    type="text"
                    value={inputData.applicationName}
                    onChange={(e) => setInputData({ ...inputData, applicationName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Module</label>
                  <input
                    type="text"
                    value={inputData.moduleName}
                    onChange={(e) => setInputData({ ...inputData, moduleName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Business Domain</label>
                  <input
                    type="text"
                    value={inputData.businessDomain}
                    onChange={(e) => setInputData({ ...inputData, businessDomain: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Requirement Description *</label>
                <textarea
                  rows={4}
                  value={inputData.requirementText}
                  onChange={(e) => setInputData({ ...inputData, requirementText: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:border-indigo-500 outline-none"
                  placeholder="Paste main user story or technical requirement..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Acceptance Criteria</label>
                  <textarea
                    rows={4}
                    value={inputData.acceptanceCriteria}
                    onChange={(e) => setInputData({ ...inputData, acceptanceCriteria: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Business Rules & SLAs</label>
                  <textarea
                    rows={4}
                    value={inputData.businessRules}
                    onChange={(e) => setInputData({ ...inputData, businessRules: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gaps' && qaResult && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-semibold text-white">Requirement Gap Analysis</h2>
                <p className="text-sm text-slate-400">Identified ambiguities, missing validations, and clarification questions prior to test creation.</p>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-xs text-slate-400 uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-3">Gap ID</th>
                      <th className="p-3">Area</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Risk Level</th>
                      <th className="p-3">Classification</th>
                      <th className="p-3">Clarification Question</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                    {qaResult.gaps.map((gap, i) => (
                      <tr key={i} className="hover:bg-slate-800/50">
                        <td className="p-3 font-mono text-xs text-indigo-400">{gap.gapId}</td>
                        <td className="p-3 font-medium">{gap.area}</td>
                        <td className="p-3 text-slate-300">{gap.gapDescription}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            gap.riskLevel === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {gap.riskLevel}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-slate-400">{gap.classification}</td>
                        <td className="p-3 text-xs italic text-slate-400">{gap.clarificationQuestion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'strategy' && qaResult && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-semibold text-white">Test Strategy & Scenarios</h2>
                <p className="text-sm text-slate-400">Generated high-level coverage areas and targeted functional/non-functional test scenarios.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div>
                  <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Scope of Testing</h3>
                  <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                    {qaResult.strategy.scope.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Critical Business Flows</h3>
                  <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                    {qaResult.strategy.criticalBusinessFlows.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-xs text-slate-400 uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-3">Scenario ID</th>
                      <th className="p-3">Title</th>
                      <th className="p-3">Test Type</th>
                      <th className="p-3">Risk</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                    {qaResult.scenarios.map((sc, i) => (
                      <tr key={i} className="hover:bg-slate-800/50">
                        <td className="p-3 font-mono text-xs text-indigo-400">{sc.scenarioId}</td>
                        <td className="p-3 font-medium text-white">{sc.scenarioTitle}</td>
                        <td className="p-3 text-xs">{sc.testType}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            sc.riskLevel === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {sc.riskLevel}
                          </span>
                        </td>
                        <td className="p-3 text-xs font-bold">{sc.priority}</td>
                        <td className="p-3 text-xs text-slate-400">{sc.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'cases' && qaResult && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-semibold text-white">Detailed Executable Test Cases</h2>
                <p className="text-sm text-slate-400">Precision test cases generated with explicit steps, synthetic test data, and quality scoring.</p>
              </div>

              <div className="space-y-4">
                {qaResult.testCases.map((tc, idx) => {
                  const score = qaResult.qualityScores.find(q => q.testCaseId === tc.testCaseId);
                  return (
                    <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-5 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-indigo-400 font-bold">{tc.testCaseId}</span>
                            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{tc.testType}</span>
                            <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded">
                              {tc.techniqueApplied}
                            </span>
                          </div>
                          <h3 className="text-base font-semibold text-white mt-1">{tc.title}</h3>
                        </div>

                        {score && (
                          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-right">
                            <span className="text-xs text-slate-400 block">Quality Score</span>
                            <span className="text-sm font-bold text-emerald-400">{score.overallScore} / 100</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-md">
                        <div>
                          <span className="font-semibold text-slate-400 block mb-1">Preconditions:</span>
                          <ul className="list-disc list-inside space-y-0.5">
                            {tc.preconditions.map((p, pIdx) => (
                              <li key={pIdx}>{p}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-400 block mb-1">Test Data Parameters:</span>
                          <pre className="font-mono text-[11px] text-indigo-300">{JSON.stringify(tc.testData, null, 2)}</pre>
                        </div>
                      </div>

                      <div>
                        <span className="text-xs font-semibold text-slate-400 block mb-1">Execution Steps:</span>
                        <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1">
                          {tc.testSteps.map((step, sIdx) => (
                            <li key={sIdx}>{step}</li>
                          ))}
                        </ol>
                      </div>

                      <div className="bg-emerald-950/20 border border-emerald-900/30 p-2.5 rounded text-xs">
                        <span className="font-semibold text-emerald-400 block mb-0.5">Expected Result:</span>
                        <p className="text-slate-300">{tc.expectedResult}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'review' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-semibold text-white">Existing Test Suite Review</h2>
                <p className="text-sm text-slate-400">Upload or paste existing test suites to perform duplicate detection, quality audits, and gap detection.</p>
              </div>

              <div className="space-y-4">
                <textarea
                  rows={5}
                  value={existingTestsText}
                  onChange={(e) => setExistingTestsText(e.target.value)}
                  placeholder="Paste existing test cases (CSV, Markdown, or raw steps)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 outline-none focus:border-indigo-500"
                />

                <button
                  onClick={handleReviewExisting}
                  disabled={reviewLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  {reviewLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Audit Existing Tests
                </button>
              </div>

              {reviewResult && (
                <div className="space-y-4">
                  <h3 className="text-md font-semibold text-white">Audit Findings</h3>
                  <div className="overflow-x-auto rounded-lg border border-slate-800">
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead className="bg-slate-950 text-xs text-slate-400 uppercase border-b border-slate-800">
                        <tr>
                          <th className="p-3">Test Case</th>
                          <th className="p-3">Finding Type</th>
                          <th className="p-3">Audit Details</th>
                          <th className="p-3">Risk</th>
                          <th className="p-3">Recommendation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                        {reviewResult.findings.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-3 font-mono text-xs text-indigo-400">{item.existingTestCase}</td>
                            <td className="p-3 font-medium text-xs">{item.findingType}</td>
                            <td className="p-3 text-xs text-slate-300">{item.finding}</td>
                            <td className="p-3 text-xs">{item.risk}</td>
                            <td className="p-3 text-xs font-semibold text-indigo-400">{item.recommendation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'automation' && qaResult && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-semibold text-white">Automation Code Generator</h2>
                <p className="text-sm text-slate-400">Convert candidates directly into framework-compliant test code.</p>
              </div>

              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <label className="text-xs text-slate-400 block mb-1">Select Test Case Candidate</label>
                  <select
                    value={selectedTestCaseForAutomation}
                    onChange={(e) => setSelectedTestCaseForAutomation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 outline-none"
                  >
                    <option value="">-- Choose Candidate --</option>
                    {qaResult.testCases.map((tc) => (
                      <option key={tc.testCaseId} value={tc.testCaseId}>
                        {tc.testCaseId} - {tc.title} ({tc.automationCandidate})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Target Framework</label>
                  <select
                    value={selectedFramework}
                    onChange={(e) => setSelectedFramework(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 outline-none"
                  >
                    <option value="Playwright (TS)">Playwright (TS)</option>
                    <option value="Cypress (TS)">Cypress (TS)</option>
                    <option value="PyTest (Python)">PyTest (Python)</option>
                    <option value="Selenium (Java)">Selenium (Java)</option>
                  </select>
                </div>

                <button
                  onClick={handleGenerateAutomation}
                  disabled={automationLoading || !selectedTestCaseForAutomation}
                  className="mt-5 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  {automationLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Code2 className="w-4 h-4" />}
                  Generate Script
                </button>
              </div>

              {automationResult && (
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-xs font-mono text-indigo-400">Generated Code ({automationResult.targetFramework})</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(automationResult.code)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Copy Code
                    </button>
                  </div>
                  <pre className="font-mono text-xs bg-slate-900 p-4 rounded text-emerald-300 overflow-x-auto">
                    {automationResult.code}
                  </pre>
                  <div className="text-xs text-slate-400">
                    <span className="font-semibold text-slate-300 block mb-1">Runner Instructions:</span>
                    {automationResult.setupInstructions}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}