"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useApiClient } from "@/lib/api/useApiClient";

interface AttackTestCase {
  id: number;
  name: string;
  category: string;
  severity: string;
  is_active: boolean;
}

interface ExecutionResult {
  id: number;
  batch_id: string;
  target_id: number;
  test_case_id: number;
  status: string;
  model_response: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  error_message: string | null;
  executed_at: string;
}

function ExecutionsPage() {
  const { user } = useAuth();
  const api = useApiClient();
  const [executions, setExecutions] = useState<ExecutionResult[]>([]);
  const [testCases, setTestCases] = useState<AttackTestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedTestCases, setSelectedTestCases] = useState<number[]>([]);
  const [targetId, setTargetId] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      try {
        const [tcRes, execRes] = await Promise.all([
          api.get<AttackTestCase[]>("/test-cases"),
          api.get<ExecutionResult[]>("/executions"),
        ]);
        if (mounted) {
          setTestCases(tcRes);
          setExecutions(execRes);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          const apiError = err as Error & { status?: number; detail?: string };
          if (apiError.status === 401) {
            setError("Session expired. Please log in again.");
          } else {
            setError(apiError.detail || "Error loading data");
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAll();
    return () => { mounted = false; };
  }, [api]);

  const handleCreateExecution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId || selectedTestCases.length === 0) return;
    setCreating(true);
    try {
      const res = await api.post<{ results: ExecutionResult[] }>("/executions/", {
        target_id: Number(targetId),
        test_case_ids: selectedTestCases,
      });
      const newResults: ExecutionResult[] = res.results ?? [];
      setExecutions((prev) => [...newResults, ...prev]);
      setSelectedTestCases([]);
      setTargetId("");
    } catch (err) {
      const apiError = err as Error & { status?: number; detail?: string };
      setError(apiError.detail || "Failed to create execution");
    } finally {
      setCreating(false);
    }
  };

  const canCreate = user?.role === "admin" || user?.role === "analyst";

  return (
    <div className="min-h-screen bg-black-100">
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <h2 className="text-2xl font-bold text-white mb-6">Execution Center</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Execution Form */}
        {canCreate && (
          <Card>
            <h3 className="text-lg font-medium text-white mb-4">
              Execute Attack Batch
            </h3>
            <form onSubmit={handleCreateExecution} className="space-y-4">
              <Input
                placeholder="Target ID"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                required
              />
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Select Test Cases
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {testCases.map((tc) => (
                    <label
                      key={tc.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTestCases.includes(tc.id)}
                        onChange={() =>
                          setSelectedTestCases((prev) =>
                            prev.includes(tc.id)
                              ? prev.filter((id) => id !== tc.id)
                              : [...prev, tc.id]
                          )
                        }
                        className="rounded border-gray-600"
                      />
                      <span className="text-sm text-white">
                        {tc.name} ({tc.category})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <Button
                type="submit"
                disabled={creating || selectedTestCases.length === 0}
              >
                Execute Batch ({selectedTestCases.length} test cases)
              </Button>
            </form>
          </Card>
        )}

        {/* Execution History */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-white mb-4">
            Execution History
          </h3>
          {loading && <p className="text-sm text-gray-400">Loading…</p>}
          {!loading && executions.length === 0 && (
            <p className="text-sm text-gray-500">No executions found</p>
          )}
          {!loading && executions.length > 0 && (
            <div className="bg-neutral-900 border border-neutral-800/50 rounded-lg overflow-x-auto">
              <table className="w-full text-sm text-gray-300">
                <thead>
                  <tr className="border-b border-neutral-800/30">
                    <th className="text-left p-3 text-xs font-medium text-gray-400">Batch ID</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-400">Target</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-400">Test Case</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-400">Status</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-400">Executed At</th>
                  </tr>
                </thead>
                <tbody>
                  {executions.map((exec) => (
                    <tr
                      key={exec.id}
                      className="border-b border-neutral-800/30 hover:bg-neutral-800/30 transition-colors"
                    >
                      <td className="p-3 font-medium text-white">
                        {exec.batch_id}
                      </td>
                      <td className="p-3">{exec.target_id}</td>
                      <td className="p-3">{exec.test_case_id}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            exec.status === "success"
                              ? "success"
                              : exec.status === "failed"
                                ? "destructive"
                                : "default"
                          }
                        >
                          {exec.status}
                        </Badge>
                      </td>
                      <td className="p-3">{exec.executed_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!canCreate && (
            <p className="mt-4 text-sm text-gray-500">
              Only admins and analysts can create executions.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ExecutionsPageWrapper() {
  return <ExecutionsPage />;
}