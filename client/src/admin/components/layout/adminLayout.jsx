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
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-50 h-16 w-full border-b border-slate-200 bg-white">
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
          <div className="h-full overflow-y-auto">
            <SideBar onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </aside>

        <main
          className={`flex-1 min-w-0 overflow-y-auto ${
            useFlushContentShell ? "bg-[#f6f6f8] p-6 lg:p-10" : "bg-slate-50 p-4 lg:p-8"
          }`}
        >
          <div className="mx-auto w-full max-w-7xl">
            {useFlushContentShell ? (
              children
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-6">
                {children}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
