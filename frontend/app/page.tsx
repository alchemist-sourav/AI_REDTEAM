import { redirect } from "next/navigation";

// Root page — always redirect to /login.
// The login page redirects to /dashboard on successful auth.
export default function RootPage() {
  redirect("/login");
}
