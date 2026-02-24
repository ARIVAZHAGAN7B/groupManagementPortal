// src/layouts/AdminLayout.jsx
import AdminHeader from "../ui/adminHeader";
import SideBar from "../ui/sideBar";

const SIDEBAR_W = 260;

const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Full-width Header */}
      <header className="w-full bg-white border-b sticky top-0 z-50">
        <div className="px-6 h-16 flex items-center">
          <AdminHeader />
        </div>
      </header>

      {/* Body: Sidebar + Content */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside
          className="bg-gray-100 border-r shrink-0"
          style={{ width: SIDEBAR_W }}
        >
          <div className="h-full overflow-y-auto">
            <SideBar />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-y-auto p-6">
          <div className="mx-auto w-full max-w-7xl">
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
