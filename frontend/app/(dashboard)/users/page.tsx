"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useApiClient } from "@/lib/api/useApiClient";

interface User {
  id: number;
  email: string;
  role: "admin" | "analyst" | "viewer";
  is_active: boolean;
}

function UsersPage() {
  const { user } = useAuth();
  const api = useApiClient();
  const [users, setUsers] = useState<User[]>([]);
  const [creating, setCreating] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "analyst" | "viewer">("viewer");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchUsers = async () => {
      try {
        const data = await api.get<User[]>("/users");

        if (mounted) {
          setUsers(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          const apiError = err as Error & {
            status?: number;
            detail?: string;
          };

          if (apiError.status === 401) {
            setError("Session expired. Please log in again.");
          } else if (apiError.status === 403) {
            setError("You do not have permission to manage users.");
          } else {
            setError(apiError.detail || "Failed to fetch users");
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchUsers();
    return () => { mounted = false; };
  }, [api]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await api.post<User>("/users", {
        email: newEmail,
        password: newPassword,
        role: newRole,
      });
      setUsers((prev) => [...prev, data]);
      setCreating(false);
      setNewEmail("");
      setNewPassword("");
      setNewRole("viewer");
    } catch (err) {
      const apiError = err as Error & { status?: number; detail?: string };
      setError(apiError.detail || "Failed to create user");
    }
  };

  const handleUpdateRole = async (userId: number, role: string) => {
    try {
      const data = await api.patch<User>(`/users/${userId}/role`, { role });
      setUsers((prev) => prev.map((u) => (u.id === userId ? data : u)));
    } catch (err) {
      const apiError = err as Error & { status?: number; detail?: string };
      setError(apiError.detail || "Failed to update role");
    }
  };

  const handleUpdateStatus = async (userId: number, is_active: boolean) => {
    try {
      const data = await api.patch<User>(`/users/${userId}/status`, { is_active });
      setUsers((prev) => prev.map((u) => (u.id === userId ? data : u)));
    } catch (err) {
      const apiError = err as Error & { status?: number; detail?: string };
      setError(apiError.detail || "Failed to update status");
    }
  };

  const canManage = user?.role === "admin";

  return (
    <div className="min-h-screen bg-black-100">
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <h2 className="text-2xl font-bold text-white mb-6">User Management</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {!canManage && (
          <p className="text-sm text-gray-500">
            Only administrators can manage users.
          </p>
        )}

        {canManage && (
          <div className="mb-6">
            <Button onClick={() => setCreating((v) => !v)}>
              {creating ? "Cancel" : "Create User"}
            </Button>
          </div>
        )}

        {creating && canManage && (
          <Card>
            <h3 className="text-lg font-medium text-white mb-4">
              Create User
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password (min 12 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={12}
              />
              <select
                value={newRole}
                onChange={(e) =>
                  setNewRole(e.target.value as "admin" | "analyst" | "viewer")
                }
                className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-white text-sm"
              >
                <option value="viewer">Viewer</option>
                <option value="analyst">Analyst</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex gap-2">
                <Button type="submit">Create</Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCreating(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        <div className="mt-8">
          <h3 className="text-lg font-medium text-white mb-4">User List</h3>
          {loading && <p className="text-sm text-gray-400">Loading…</p>}
          {!loading && (
            <div className="bg-neutral-900 border border-neutral-800/50 rounded-lg overflow-x-auto">
              <table className="w-full text-sm text-gray-300">
                <thead>
                  <tr className="border-b border-neutral-800/30">
                    <th className="text-left p-3 text-xs font-medium text-gray-400">Email</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-400">Role</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-400">Status</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-neutral-800/30 hover:bg-neutral-800/30 transition-colors"
                    >
                      <td className="p-3 font-medium text-white">
                        {user.email}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            user.role === "admin"
                              ? "destructive"
                              : user.role === "analyst"
                                ? "default"
                                : "success"
                          }
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            user.is_active ? "success" : "destructive"
                          }
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="p-3 flex gap-2">
                        {canManage && (
                          <>
                            <select
                              defaultValue={user.role}
                              onChange={(e) =>
                                handleUpdateRole(user.id, e.target.value)
                              }
                              className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-white"
                            >
                              <option value="viewer">Viewer</option>
                              <option value="analyst">Analyst</option>
                              <option value="admin">Admin</option>
                            </select>
                            <Button
                              size="sm"
                              variant={
                                user.is_active ? "destructive" : "secondary"
                              }
                              onClick={() =>
                                handleUpdateStatus(user.id, !user.is_active)
                              }
                            >
                              {user.is_active ? "Deactivate" : "Activate"}
                            </Button>
                          </>
                        )}
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

export default function UsersPageWrapper() {
  return <UsersPage />;
}