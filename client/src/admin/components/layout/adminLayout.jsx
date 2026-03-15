import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import AdminHeader from "../ui/adminHeader";
import SideBar from "../ui/sideBar";

const SIDEBAR_W = 256;

const AdminLayout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const useFlushContentShell = location.pathname === "/phase-configuration";

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      <header className="z-50 h-16 w-full shrink-0 border-b border-slate-200 bg-white">
        <div className="flex h-full items-center px-4 lg:px-8">
          <AdminHeader onMenuClick={() => setMobileMenuOpen(true)} />
        </div>
      </header>

      {mobileMenuOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
        />
      ) : null}

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex h-full transform flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ width: SIDEBAR_W }}
        >
          <div className="h-full overflow-y-auto scrollbar-hidden">
            <SideBar onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </aside>

        <main
          className={`flex-1 min-w-0 overflow-y-auto ${
            useFlushContentShell ? "bg-[#f6f6f8]" : "bg-slate-50"
          }`}
        >
          <div className="min-h-full w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
