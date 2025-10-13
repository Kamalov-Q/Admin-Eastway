import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { useState } from "react";
import {
  Globe,
  Building2,
  Map,
  Hotel,
  Star,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Tag,
  Ticket,
} from "lucide-react";

export default function Sidebar() {
  const { logout } = useAuthStore();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { path: "/countries", label: "Countries", icon: Globe },
    { path: "/cities", label: "Cities", icon: Building2 },
    { path: "/tours", label: "Tours", icon: Map },
    { path: "/hotels", label: "Hotels", icon: Hotel },
    { path: "/reviews", label: "Reviews", icon: Star },
    { path: "/requests", label: "Requests", icon: FileText },
    { path: "/tour-category", label: "Tour Category", icon: Tag },
    { path: "/hotel-category", label: "Hotel Category", icon: Tag },
    { path: "/tour-tariff", label: "Tour Tariff", icon: Ticket },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside
      className={`${
        isCollapsed ? "w-20" : "w-64"
      } bg-gray-800 text-white transition-all duration-300 flex flex-col relative`}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-700">
        {!isCollapsed && <h2 className="text-xl font-bold">Dashboard</h2>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-700 rounded-lg transition"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                isActive(item.path)
                  ? "bg-indigo-600 text-white"
                  : "hover:bg-gray-700 text-gray-300"
              }`}
              title={isCollapsed ? item.label : ""}
            >
              <Icon size={20} className="flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <Button
          variant="destructive"
          onClick={logout}
          className={`w-full ${isCollapsed ? "px-2" : ""}`}
          title={isCollapsed ? "Logout" : ""}
        >
          <LogOut size={20} className={isCollapsed ? "" : "mr-2"} />
          {!isCollapsed && "Logout"}
        </Button>
      </div>
    </aside>
  );
}
