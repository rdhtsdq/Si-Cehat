import React, { Suspense, lazy } from "react";
import { Route, Switch, Link } from "wouter";
import OnboardingPage from "@/app/page";

const AvatarPage = lazy(() => import("@/app/avatar/page"));
const ChildPage = lazy(() => import("@/app/child/page"));
const ChatPage = lazy(() => import("@/app/chat/page"));
const GuardianLoginPage = lazy(() => import("@/app/parent/login/page"));
const ParentPage = lazy(() => import("@/app/parent/page"));
const AdminLoginPage = lazy(() => import("@/app/admin/login/page"));
const AdminPage = lazy(() => import("@/client/pages/AdminPage"));
const ApiDocsPage = lazy(() => import("@/app/api-docs/page"));
const PlayLabGamePage = lazy(() => import("@/client/pages/PlayLabGamePage"));

function RouteLoadingFallback() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#fff9e9] text-[#173d31]">
      <div className="text-center text-sm font-black">Memuat halaman...</div>
    </main>
  );
}

export function App() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Switch>
        <Route path="/" component={OnboardingPage} />
        <Route path="/avatar" component={AvatarPage} />
        <Route path="/child" component={ChildPage} />
        <Route path="/chat" component={ChatPage} />
        <Route path="/parent/login" component={GuardianLoginPage} />
        <Route path="/parent" component={ParentPage} />
        <Route path="/admin/login" component={AdminLoginPage} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/playlab" component={PlayLabGamePage} />
        <Route path="/playlab/piring-sehat" component={PlayLabGamePage} />
        <Route path="/game/piring-sehat" component={PlayLabGamePage} />
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
