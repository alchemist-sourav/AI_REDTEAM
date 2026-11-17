"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Loader2,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertCircle,
  Clock,
  Target,
} from "lucide-react";
import { useApiClient } from "@/lib/api/useApiClient";

interface AnalyticsData {
  overview: {
    total_targets: number;
    total_test_cases: number;
    total_executions: number;
    total_evaluations: number;
    unevaluated: number;
    passed: number;
    failed: number;
    inconclusive: number;
    evaluation_coverage: number;
    conclusive_coverage: number;
  };
  category_breakdown: Array<{
    category: string;
    total_tests: number;
    evaluated: number;
    passed: number;
    failed: number;
    inconclusive: number;
  }>;
  target_performance: Array<{
    target_id: number;
    target_name: string;
    provider: string;
    model_id: string;
    total_executions: number;
    evaluated: number;
    passed: number;
    failed: number;
    inconclusive: number;
    evaluation_coverage: number;
    failure_rate: number;
  }>;
  risk_trends: Array<{
    date: string;
    total_executions: number;
    evaluated: number;
    passed: number;
    failed: number;
    inconclusive: number;
  }>;
}

export default function DashboardPage() {
  const api = useApiClient();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchDashboard = async () => {
      try {
        const result = await api.get<AnalyticsData>("/analytics/dashboard");

        if (mounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          const apiError = err as Error & { status?: number; detail?: string };
          if (apiError.status === 401) {
            router.replace("/login");
            return;
          }
          setError(apiError.detail || "Failed to fetch dashboard");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchDashboard();
    return () => { mounted = false; };
  }, [api, router]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen p-8 text-red-400">Error: {error}</div>
    );
  if (!data)
    return (
      <div className="min-h-screen p-8 text-gray-400">No data available</div>
    );

  const { overview, category_breakdown, target_performance, risk_trends } =
    data;

  const pieColors = ["#22C55E", "#EF4444", "#6B7280"];

  return (
    <div className="min-h-screen bg-black-100">
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <h2 className="text-2xl font-bold text-white mb-6">Dashboard</h2>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-neutral-900 border border-neutral-800/50 rounded-lg p-6 flex items-center gap-4 hover:border-red-500/50 transition-colors">
            <Target className="w-6 h-6 text-red-400" />
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">
                Total Targets
              </p>
              <p className="text-2xl font-bold text-white">
                {overview.total_targets}
              </p>
            </div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800/50 rounded-lg p-6 flex items-center gap-4 hover:border-green-500/50 transition-colors">
            <Clock className="w-6 h-6 text-green-400" />
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">
                Total Executions
              </p>
              <p className="text-2xl font-bold text-white">
                {overview.total_executions}
              </p>
            </div>
          </div>
          <div className="bg-neutral-900 border border-green-500/30 rounded-lg p-6 flex items-center gap-4">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">
                Passed
              </p>
              <p className="text-2xl font-bold text-green-400">
                {overview.passed}
              </p>
            </div>
          </div>
          <div className="bg-neutral-900 border border-red-500/30 rounded-lg p-6 flex items-center gap-4">
            <XCircle className="w-6 h-6 text-red-400" />
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">
                Failed
              </p>
              <p className="text-2xl font-bold text-red-400">
                {overview.failed}
              </p>
            </div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800/50 rounded-lg p-6 flex items-center gap-4">
            <TrendingUp className="w-6 h-6 text-amber-400" />
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">
                Eval Coverage
              </p>
              <p className="text-2xl font-bold text-white">
                {overview.evaluation_coverage}%
              </p>
            </div>
          </div>
          <div className="bg-neutral-900 border border-red-500/30 rounded-lg p-6 flex items-center gap-4">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">
                Critical Risks
              </p>
              <p className="text-2xl font-bold text-red-400">
                {overview.failed}
              </p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Execution Trends */}
          <div className="bg-neutral-900 border border-neutral-800/50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-4">
              Execution Trends
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={risk_trends}
                margin={{ top: 20, right: 30, left: 0, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#9CA3AF", fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#171717",
                    border: "1px solid #404040",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total_executions"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          <div className="bg-neutral-900 border border-neutral-800/50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-4">
              Category Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={category_breakdown}
                  dataKey="evaluated"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                >
                  {category_breakdown.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={pieColors[index % pieColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#171717",
                    border: "1px solid #404040",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Target Performance */}
        <div className="bg-neutral-900 border border-neutral-800/50 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-medium text-white mb-4">
            Target Performance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={target_performance}
              margin={{ top: 20, right: 30, left: 0, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis
                dataKey="target_name"
                tick={{ fill: "#9CA3AF", fontSize: 12 }}
                angle={-45}
                textAnchor="end"
              />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#171717",
                  border: "1px solid #404040",
                }}
              />
              <Line
                type="monotone"
                dataKey="total_executions"
                stroke="#22C55E"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}