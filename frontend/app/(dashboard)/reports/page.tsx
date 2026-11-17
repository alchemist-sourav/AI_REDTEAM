"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useApiClient } from "@/lib/api/useApiClient";

interface ReportSummary {
  total_tests: number;
  evaluated: number;
  unevaluated: number;
  passed: number;
  failed: number;
  inconclusive: number;
  evaluation_coverage: number;
  conclusive_coverage: number;
}

interface ReportRiskAssessment {
  overall_score: number | null;
  risk_classification: "low" | "moderate" | "high" | "critical" | "unrated";
  severity_distribution: {
    low: number;
    moderate: number;
    high: number;
    critical: number;
  };
}

interface ReportFinding {
  test_name: string;
  attack_category: string;
  test_severity: string;
  execution_status: string;
  verdict: string | null;
  risk_level: string | null;
  explanation: string | null;
  matched_indicators: string[];
  model_response: string | null;
  executed_at: string;
}

interface SecurityReport {
  batch_id: string;
  generated_at: string;
  target_id: number;
  target_name: string;
  provider: string;
  model_id: string;
  summary: ReportSummary;
  risk_assessment: ReportRiskAssessment;
  findings: ReportFinding[];
}

const riskColor: Record<string, string> = {
  critical: "text-red-500",
  high: "text-red-400",
  moderate: "text-amber-400",
  low: "text-green-400",
  unrated: "text-gray-400",
};

function ReportsPage() {
  const { user, token } = useAuth();
  const api = useApiClient();
  const [batchId, setBatchId] = useState("");
  const [report, setReport] = useState<SecurityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canView = user?.role === "admin" || user?.role === "analyst" || user?.role === "viewer";

  const fetchReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId.trim()) return;
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const data = await api.get<SecurityReport>(`/reports/${encodeURIComponent(batchId.trim())}`);
      setReport(data);
    } catch (err) {
      const apiError = err as Error & { status?: number; detail?: string };
      if (apiError.status === 401) {
        setError("Session expired. Please log in again.");
      } else if (apiError.status === 403) {
        setError("You do not have permission to view reports.");
      } else {
        setError(apiError.detail || "Failed to fetch report");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format: "json" | "pdf") => {
    if (!report) return;
    try {
      const res = await fetch(
        `/api/v1/reports/${encodeURIComponent(report.batch_id)}/export/${format}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: `Failed to export ${format.toUpperCase()}` }));
        throw new Error(err.detail);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `security_report_${report.batch_id}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError((err as Error).message || `Error downloading ${format.toUpperCase()} report`);
    }
  };

  return (
    <div className="min-h-screen bg-black-100">
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <h2 className="text-2xl font-bold text-white mb-6">Security Reports</h2>

        {!canView && (
          <p className="text-sm text-gray-500 mb-6">
            Only admins, analysts, and viewers can view reports.
          </p>
        )}

        {canView && (
          <>
            <Card>
              <h3 className="text-lg font-medium text-white mb-4">
                Generate Report
              </h3>
              <form onSubmit={fetchReport} className="flex gap-4">
                <Input
                  placeholder="Batch ID"
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  required
                />
                <Button type="submit" disabled={loading || !batchId.trim()}>
                  {loading ? "Loading…" : "Generate"}
                </Button>
              </form>
            </Card>

            {error && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {report && (
              <div className="mt-8 space-y-6">
                {/* Header */}
                <Card>
                  <h3 className="text-lg font-medium text-white mb-4">
                    Report: {report.batch_id}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <p className="text-xs text-gray-400 uppercase">Target</p>
                      <p className="font-semibold text-white">{report.target_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase">Provider</p>
                      <p className="font-semibold text-white">{report.provider}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase">Model</p>
                      <p className="font-semibold text-white">{report.model_id}</p>
                    </div>
                  </div>

                  {/* Summary metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-neutral-900 border border-neutral-800/50 rounded-lg p-4">
                      <p className="text-xs text-gray-400 uppercase">Total Tests</p>
                      <p className="text-xl font-bold text-white">
                        {report.summary.total_tests}
                      </p>
                    </div>
                    <div className="bg-neutral-900 border border-green-500/30 rounded-lg p-4">
                      <p className="text-xs text-gray-400 uppercase">Passed</p>
                      <p className="text-xl font-bold text-green-400">
                        {report.summary.passed}
                      </p>
                    </div>
                    <div className="bg-neutral-900 border border-red-500/30 rounded-lg p-4">
                      <p className="text-xs text-gray-400 uppercase">Failed</p>
                      <p className="text-xl font-bold text-red-400">
                        {report.summary.failed}
                      </p>
                    </div>
                    <div className="bg-neutral-900 border border-neutral-800/50 rounded-lg p-4">
                      <p className="text-xs text-gray-400 uppercase">Coverage</p>
                      <p className="text-xl font-bold text-white">
                        {report.summary.evaluation_coverage}%
                      </p>
                    </div>
                  </div>

                  {/* Risk classification */}
                  <div className="mt-4 p-4 bg-neutral-900 border border-neutral-800/50 rounded-lg">
                    <p className="text-xs text-gray-400 uppercase mb-1">
                      Risk Classification
                    </p>
                    <p
                      className={`text-2xl font-bold ${riskColor[report.risk_assessment.risk_classification]}`}
                    >
                      {report.risk_assessment.risk_classification.toUpperCase()}
                    </p>
                    {report.risk_assessment.overall_score !== null && (
                      <p className="text-sm text-gray-400 mt-1">
                        Score: {report.risk_assessment.overall_score.toFixed(2)}
                      </p>
                    )}
                  </div>
                </Card>

                {/* Findings */}
                <Card>
                  <h3 className="text-lg font-medium text-white mb-4">Findings</h3>
                  {report.findings.length === 0 ? (
                    <p className="text-sm text-gray-500">No findings recorded</p>
                  ) : (
                    <div className="space-y-4">
                      {report.findings.map((finding, index) => (
                        <div
                          key={index}
                          className="border-t border-neutral-800/30 pt-4 first:border-0 first:pt-0"
                        >
                          <p className="font-medium text-white mb-2">
                            {finding.test_name}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <Badge variant="default">{finding.attack_category}</Badge>
                            <Badge variant="default">{finding.test_severity}</Badge>
                            <Badge
                              variant={
                                finding.verdict === "pass"
                                  ? "success"
                                  : finding.verdict === "fail"
                                  ? "destructive"
                                  : "default"
                              }
                            >
                              {finding.verdict ?? "not evaluated"}
                            </Badge>
                            {finding.risk_level && (
                              <Badge
                                variant={
                                  finding.risk_level === "high" ||
                                  finding.risk_level === "critical"
                                    ? "destructive"
                                    : finding.risk_level === "low"
                                    ? "success"
                                    : "default"
                                }
                              >
                                {finding.risk_level}
                              </Badge>
                            )}
                          </div>
                          {finding.explanation && (
                            <p className="text-xs text-gray-400">
                              {finding.explanation.substring(0, 200)}
                              {finding.explanation.length > 200 ? "…" : ""}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Executed: {finding.executed_at}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Export */}
                <div className="flex gap-4">
                  <Button onClick={() => handleDownload("json")}>
                    Export JSON
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleDownload("pdf")}
                  >
                    Export PDF
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ReportsPageWrapper() {
  return <ReportsPage />;
}