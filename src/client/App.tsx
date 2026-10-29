import React, { Suspense, lazy } from "react";
import { Route, Switch, Link } from "wouter";
import OnboardingPage from "@/app/page";

const AdminLoginPage = lazy(() => import("@/app/admin/login/page"));
const AdminPage = lazy(() => import("@/client/pages/AdminPage"));
const ApiDocsPage = lazy(() => import("@/app/api-docs/page"));
const PlayLabGamePage = lazy(() => import("@/client/pages/PlayLabGamePage"));
const GameExitPage = lazy(() => import("@/client/pages/GameExitPage"));

function RouteLoadingFallback() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#fff9e9] text-[#173d31]">
      <div className="text-center text-sm font-black">Memuat halaman...</div>
    </main>
  );
}

function RootPageRouter() {
  const hasGameParams =
    typeof window !== "undefined" &&
    (window.location.search.includes("bootstrap=") ||
      window.location.search.includes("sessionId=") ||
      window.location.search.includes("token="));

  if (hasGameParams) {
    return <PlayLabGamePage />;
  }

  return <OnboardingPage />;
}

export function App() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Switch>
        <Route path="/" component={RootPageRouter} />
        <Route path="/admin/login" component={AdminLoginPage} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/playlab" component={PlayLabGamePage} />
        <Route path="/playlab/piring-sehat" component={PlayLabGamePage} />
        <Route path="/game" component={PlayLabGamePage} />
        <Route path="/game/piring-sehat" component={PlayLabGamePage} />
        <Route path="/minigame" component={PlayLabGamePage} />
        <Route path="/exit" component={GameExitPage} />
        <Route path="/api-docs" component={ApiDocsPage} />
        <Route path="/docs" component={ApiDocsPage} />
        <Route>
          <main className="min-h-screen flex flex-col items-center justify-center bg-[#fff9e9] p-6 text-center text-[#173d31]">
            <h1 className="display-font text-3xl font-black">
              Halaman Tidak Ditemukan (404)
            </h1>
            <p className="mt-2 text-sm font-bold">
              Rute yang kamu tuju belum tersedia.
            </p>
            <Link
              href="/"
              className="game-button mt-6 rounded-2xl bg-[#247a4d] px-5 py-2.5 text-sm font-black text-white"
            >
              Kembali ke Beranda
            </Link>
          </main>
        </Route>
      </Switch>
    </Suspense>
  );
}
