import { Link, useLocation } from "react-router-dom";
import { Activity, LayoutDashboard, Cpu, Radio, Database, BookOpen, Menu, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/devices", label: "Devices", icon: Cpu },
  { to: "/sensors", label: "Sensors", icon: Radio },
  { to: "/readings", label: "Data Logs", icon: Database },
  { to: "/integration", label: "Integration", icon: BookOpen },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <span className="font-bold text-sm">WSN IoT</span>
        </div>
        <button onClick={() => setOpen(!open)} className="p-2 text-muted-foreground">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {open && (
        <nav className="px-4 py-2 bg-card border-b border-border space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
