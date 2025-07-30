import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
    const role = localStorage.getItem("role"); // Get role from local storage

    if (!role || !allowedRoles.includes(role)) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
