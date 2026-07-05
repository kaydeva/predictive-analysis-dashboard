import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import AnimatedPage from "./components/AnimatedPage";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const MachineDetails = lazy(() => import("./pages/MachineDetails"));
const AlertsCenter = lazy(() => import("./pages/AlertsCenter"));
const Analytics = lazy(() => import("./pages/Analytics"));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin absolute inset-0 opacity-50" style={{ animationDirection: "reverse" }} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/10 via-gray-950 to-gray-950 pointer-events-none" />
      <Navbar />
      <main className="relative z-10 pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<AnimatedPage><Dashboard /></AnimatedPage>} />
            <Route path="/machine/:id" element={<AnimatedPage><MachineDetails /></AnimatedPage>} />
            <Route path="/alerts" element={<AnimatedPage><AlertsCenter /></AnimatedPage>} />
            <Route path="/analytics" element={<AnimatedPage><Analytics /></AnimatedPage>} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
