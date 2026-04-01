import { useNavigate } from "react-router-dom";
import { useGetProfileQuery } from "../../store/api/sharedApi";
import { useAuth } from "../../utils/AuthContext";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { data: profile } = useGetProfileQuery(
        { userId: user?.userId },
        { skip: !user?.userId }
    );

    const handleLogout = async () => {
        try {
            await logout?.();
            // redirect to login page
            navigate("/login");
        } catch (_err) {
            alert("Failed to logout. Please try again.");
        }
    };


    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
            <p className="text-gray-600 mb-3">
                Welcome back, <span className="font-semibold">{profile?.name || user?.name || "Admin"}</span>
            </p>
            <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            >
                Logout
            </button>
            <p>Welcome to the admin dashboard! Here you can manage users, groups, and view reports.</p>
        </div>
    )
}

export default AdminDashboard;
