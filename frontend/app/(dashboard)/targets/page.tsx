"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useApiClient } from "@/lib/api/useApiClient";

interface Target {
  id: number;
  name: string;
  provider: string;
  model_id: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

function TargetsPage() {
  const { user } = useAuth();
  const api = useApiClient();
  const [targets, setTargets] = useState<Target[]>([]);
  const [newTarget, setNewTarget] = useState({
    name: "",
    provider: "",
    model_id: "",
    description: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchTargets = async () => {
      try {
        const data = await api.get<Target[]>("/targets");

        if (mounted) {
          setTargets(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          const apiError = err as Error & { status?: number; detail?: string };
          if (apiError.status === 401) {
            setError("Session expired. Please log in again.");
          } else {
            setError(apiError.detail || "Failed to fetch targets");
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchTargets();
    return () => { mounted = false; };
  }, [api]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const data = await api.post<Target>("/targets", {
        name: newTarget.name,
        provider: newTarget.provider,
        model_id: newTarget.model_id,
        description: newTarget.description || null,
      });
      setTargets((prev) => [data, ...prev]);
      setNewTarget({ name: "", provider: "", model_id: "", description: "" });
      setSuccess(`Target "${data.name}" created successfully.`);
    } catch (err) {
      const apiError = err as Error & { status?: number; detail?: string };
      setError(apiError.detail || "Failed to create target");
    }
  };

  const filteredTargets = targets.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.model_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCreate = user?.role === "admin" || user?.role === "analyst";

  return (
    <div className="min-h-screen bg-black-100">
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <h2 className="text-2xl font-bold text-white mb-6">Targets</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm">
            {success}
          </div>
        )}

        {/* Search */}
        <div className="mb-4">
          <Input
            placeholder="Search by name, provider, or model…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Create Form — admin and analyst only */}
        {canCreate && (
          <Card>
            <h3 className="text-lg font-medium text-white mb-4">
              Create Target
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                placeholder="Target Name"
                value={newTarget.name}
                onChange={(e) =>
                  setNewTarget({ ...newTarget, name: e.target.value })
                }
                required
                minLength={2}
                maxLength={150}
              />
              <Input
                placeholder="Provider (e.g. groq)"
                value={newTarget.provider}
                onChange={(e) =>
                  setNewTarget({ ...newTarget, provider: e.target.value })
                }
                required
                minLength={2}
                maxLength={50}
              />
              <Input
                placeholder="Model ID (e.g. openai/gpt-4)"
                value={newTarget.model_id}
                onChange={(e) =>
                  setNewTarget({ ...newTarget, model_id: e.target.value })
                }
                required
                minLength={2}
                maxLength={150}
              />
              <Input
                placeholder="Description (optional)"
                value={newTarget.description}
                onChange={(e) =>
                  setNewTarget({ ...newTarget, description: e.target.value })
                }
              />
              <Button type="submit">
                Create Target
              </Button>
            </form>
          </Card>
        )}

        {!canCreate && (
          <p className="mb-4 text-sm text-gray-500">
            Only admins and analysts can create targets.
          </p>
        )}

        {/* Targets Table */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-white mb-4">Target List</h3>
          {loading && <p className="text-sm text-gray-400">Loading…</p>}
          {!loading && filteredTargets.length === 0 && !error && (
            <p className="text-sm text-gray-500">No targets found.</p>
          )}
          {!loading && filteredTargets.length > 0 && (
            <div className="bg-neutral-900 border border-neutral-800/50 rounded-lg overflow-x-auto">
              <table className="w-full text-sm text-gray-300">
                <thead>
                  <tr className="border-b border-neutral-800/30">
                    <th className="text-left p-3 text-xs font-medium text-gray-400">Name</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-400">Provider</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-400">Model</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-400">Description</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-400">Status</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-400">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTargets.map((target) => (
                    <tr
                      key={target.id}
                      className="border-b border-neutral-800/30 hover:bg-neutral-800/30 transition-colors"
                    >
                      <td className="p-3 font-medium text-white">{target.name}</td>
                      <td className="p-3">{target.provider}</td>
                      <td className="p-3 font-mono text-xs">{target.model_id}</td>
                      <td className="p-3 max-w-xs truncate text-gray-400">
                        {target.description ?? "—"}
                      </td>
                      <td className="p-3">
                        <Badge variant={target.is_active ? "success" : "destructive"}>
                          {target.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="p-3 text-gray-400">
                        {new Date(target.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TargetsPageWrapper() {
  return <TargetsPage />;
}