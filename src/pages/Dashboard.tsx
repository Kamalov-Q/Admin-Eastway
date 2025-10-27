import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Outlet } from "react-router-dom";
import WelcomeSplash from "@/components/ui/welcome-splash";

export default function Dashboard() {
  const [showSplash, setShowSplash] = useState(
    typeof window !== "undefined" &&
      sessionStorage.getItem("eastway_show_welcome") === "1"
  );

  useEffect(() => {
    if (showSplash) {
      sessionStorage.removeItem("eastway_show_welcome");
    }
  }, [showSplash]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <WelcomeSplash open={showSplash} onClose={() => setShowSplash(false)} />

      <Sidebar />

      <main className="relative flex-1 p-6">
        <Header />
        <Outlet />
      </main>
    </div>
  );
}
