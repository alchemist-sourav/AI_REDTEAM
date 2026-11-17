"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";

function DashboardLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black-100 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Verifying session…</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <MainLayout userRole={user.role} userEmail={user.email}>
      {children}
    </MainLayout>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutInner>{children}</DashboardLayoutInner>;
}