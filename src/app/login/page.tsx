import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

// Wrapper Server Component pra envolver o LoginForm em Suspense — necessário
// porque LoginForm usa useSearchParams() (Next.js exige Suspense boundary).
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-graphite-50">
      <div className="w-full max-w-md bg-white border border-graphite-200 rounded-xl shadow-md p-8 h-[420px]" />
    </main>
  );
}
