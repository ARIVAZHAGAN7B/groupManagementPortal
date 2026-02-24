import StudentHeader from "../ui/studentHeader";
import SideBar from "../ui/sideBar";

const SIDEBAR_W = 256;

const StudentLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-50 h-16 w-full border-b border-slate-200 bg-white">
        <div className="flex h-full items-center px-4 lg:px-8">
          <StudentHeader />
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <aside
          className="hidden shrink-0 flex-col border-r border-slate-200 bg-white lg:flex"
          style={{ width: SIDEBAR_W }}
        >
          <div className="h-full overflow-y-auto">
            <SideBar />
          </div>
        </aside>

        <main className="flex-1 min-w-0 overflow-y-auto bg-slate-50 p-4 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
