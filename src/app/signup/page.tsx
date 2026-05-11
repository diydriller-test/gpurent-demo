"use client";

import { Suspense } from "react";
import { SiteNav } from "@/components/SiteNav";
import { SignupForm } from "@/components/SignupForm";

function SignupPageInner() {
  return (
    <div className="min-h-screen bg-grid-pattern flex flex-col">
      <SiteNav />
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/5 bg-surface/80 p-8 shadow-xl backdrop-blur-sm">
            <SignupForm />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageInner />
    </Suspense>
  );
}
