import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../utils/AuthContext";
import { getProfile } from "../../service/joinRequests.api";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        let mounted = true;

        const loadProfile = async () => {
            const data = await getProfile();
            if (!mounted) return;
            setProfile(data || null);
        };

        loadProfile();

        return () => {
            mounted = false;
        };
    }, []);

    const handleLogout = async () => {
        try {
            await axios.post(
                "http://localhost:5000/api/auth/logout",
                {},
                { withCredentials: true }
            );
            // redirect to login page
            navigate("/login");
            // optionally, you can also reload the page or reset user state
            window.location.reload(); // ensures App state resets
        } catch (err) {
            console.error("Logout failed:", err);
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
