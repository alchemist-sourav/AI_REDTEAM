"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useApiClient } from "@/lib/api/useApiClient";

interface Evaluation {
  id: number;
  execution_result_id: number;
  verdict: "pass" | "fail" | "inconclusive";
  risk_level: "low" | "medium" | "high" | "critical";
  explanation: string;
  matched_indicators: string[];
  evaluated_at: string;
}

function EvaluationsPage() {
  const { user } = useAuth();
  const api = useApiClient();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchEvaluations = async () => {
      try {
        const data = await api.get<Evaluation[]>("/evaluations");

        if (mounted) {
          setEvaluations(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          const apiError = err as Error & { status?: number; detail?: string };
          if (apiError.status === 401) {
            setError("Session expired. Please log in again.");
          } else if (apiError.status === 403) {
            setError("You do not have permission to view evaluations.");
          } else {
            setError(apiError.detail || "Failed to fetch evaluations");
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchEvaluations();
    return () => { mounted = false; };
  }, [api]);

  const canView = user?.role === "admin" || user?.role === "analyst";

  return (
    <div className="min-h-screen bg-black-100">
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <h2 className="text-2xl font-bold text-white mb-6">
          Evaluation Center
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {!canView && (
          <p className="text-sm text-gray-500">
            Only admins and analysts can view evaluations.
          </p>
        )}

        {canView && (
          <Card>
            <h3 className="text-lg font-medium text-white mb-4">
              Evaluation List
            </h3>
            {loading && <p className="text-sm text-gray-400">Loading…</p>}
            {!loading && evaluations.length === 0 && (
              <p className="text-sm text-gray-500">No evaluations found</p>
            )}
            {!loading && evaluations.length > 0 && (
              <div className="bg-neutral-900 border border-neutral-800/50 rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-gray-300">
                  <thead>
                    <tr className="border-b border-neutral-800/30">
                      <th className="text-left p-3 text-xs font-medium text-gray-400">Verdict</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-400">Risk Level</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-400">Execution ID</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-400">Evaluated At</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-400">Explanation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluations.map((ev) => (
                      <tr
                        key={ev.id}
                        className="border-b border-neutral-800/30 hover:bg-neutral-800/30 transition-colors"
                      >
                        <td className="p-3">
                          <Badge
                            variant={
                              ev.verdict === "pass"
                                ? "success"
                                : ev.verdict === "fail"
                                  ? "destructive"
                                  : "default"
                            }
                          >
                            {ev.verdict}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={
                              ev.risk_level === "critical" ||
                                ev.risk_level === "high"
                                ? "destructive"
                                : ev.risk_level === "medium"
                                  ? "default"
                                  : "success"
                            }
                          >
                            {ev.risk_level}
                          </Badge>
                        </td>
                        <td className="p-3">{ev.execution_result_id}</td>
                        <td className="p-3">{ev.evaluated_at}</td>
                        <td className="p-3 max-w-xs truncate">
                          {ev.explanation.substring(0, 100)}
                          {ev.explanation.length > 100 ? "…" : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

export default function EvaluationsPageWrapper() {
  return <EvaluationsPage />;
}