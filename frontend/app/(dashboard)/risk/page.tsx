"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useApiClient } from "@/lib/api/useApiClient";

interface RiskAssessment {
  batch_id: string;
  total_execution_results: number;
  total_evaluations: number;
  unevaluated: number;
  passed: number;
  failed: number;
  inconclusive: number;
  scored_evaluations: number;
  evaluation_coverage: number;
  conclusive_coverage: number;
  overall_score: number | null;
  risk_classification: "low" | "moderate" | "high" | "critical" | "unrated";
  severity_distribution: Record<string, number>;
}

const riskClassColor: Record<string, string> = {
  critical: "text-red-500",
  high: "text-red-400",
  moderate: "text-amber-400",
  low: "text-green-400",
  unrated: "text-gray-400",
};

function RiskAssessmentPage() {
  const { user } = useAuth();
  const api = useApiClient();
  const [batchId, setBatchId] = useState("");
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canView = user?.role === "admin" || user?.role === "analyst";

  const fetchRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId.trim()) return;
    setLoading(true);
    setError(null);
    setRisk(null);
    try {
      const data = await api.get<RiskAssessment>(
        `/evaluations/batch/${encodeURIComponent(batchId.trim())}/risk`
      );
      setRisk(data);
    } catch (err) {
      const apiError = err as Error & { status?: number; detail?: string };
      if (apiError.status === 401) {
        setError("Session expired. Please log in again.");
      } else if (apiError.status === 403) {
        setError("You do not have permission to view risk assessments.");
      } else {
        setError(apiError.detail || "Failed to fetch risk assessment");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!canView) {
    return (
      <div className="min-h-screen bg-black-100">
        <div className="max-w-[1600px] mx-auto px-6 py-6">
          <h2 className="text-2xl font-bold text-white mb-6">Risk Assessment</h2>
          <p className="text-sm text-gray-500">
            Only admins and analysts can view risk assessments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black-100">
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <h2 className="text-2xl font-bold text-white mb-6">Risk Assessment</h2>

        <Card>
          <h3 className="text-lg font-medium text-white mb-4">
            Look Up Batch Risk
          </h3>
          <form onSubmit={fetchRisk} className="flex gap-4">
            <Input
              placeholder="Batch ID"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              required
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Loading…" : "Fetch Risk"}
            </Button>
          </form>
        </Card>

        {error && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {risk && (
          <>
            <Card>
              <h3 className="text-lg font-medium text-white mb-4">
                Risk Overview
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">
                    Overall Score
                  </p>
                  <p
                    className={`text-3xl font-bold ${riskClassColor[risk.risk_classification]}`}
                  >
                    {risk.overall_score !== null
                      ? risk.overall_score.toFixed(2)
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">
                    Classification
                  </p>
                  <p
                    className={`text-2xl font-bold ${riskClassColor[risk.risk_classification]}`}
                  >
                    {risk.risk_classification.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">
                    Total Executions
                  </p>
                  <p className="text-xl font-bold text-white">
                    {risk.total_execution_results}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">
                    Conclusive Coverage
                  </p>
                  <p className="text-xl font-bold text-white">
                    {risk.conclusive_coverage}%
                  </p>
                </div>
              </div>
            </Card>

            {/* Severity distribution — rendered from whatever keys the backend returns */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {Object.entries(risk.severity_distribution).map(([level, count]) => (
                <div
                  key={level}
                  className="bg-neutral-900 border border-neutral-800/50 rounded-lg p-6"
                >
                  <p className="text-xs text-gray-400 uppercase tracking-wider">
                    {level}
                  </p>
                  <p
                    className={`text-3xl font-bold ${riskClassColor[level] ?? "text-gray-300"}`}
                  >
                    {count}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-neutral-900 border border-neutral-800/50 rounded-lg p-6">
                <p className="text-xs text-gray-400 uppercase">Passed</p>
                <p className="text-2xl font-bold text-green-400">{risk.passed}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800/50 rounded-lg p-6">
                <p className="text-xs text-gray-400 uppercase">Failed</p>
                <p className="text-2xl font-bold text-red-400">{risk.failed}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800/50 rounded-lg p-6">
                <p className="text-xs text-gray-400 uppercase">Inconclusive</p>
                <p className="text-2xl font-bold text-amber-400">{risk.inconclusive}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800/50 rounded-lg p-6">
                <p className="text-xs text-gray-400 uppercase">Unevaluated</p>
                <p className="text-2xl font-bold text-gray-400">{risk.unevaluated}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function RiskAssessmentPageWrapper() {
  return <RiskAssessmentPage />;
}