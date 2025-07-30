const jwt = require("jsonwebtoken");
const User = require("../model/User"); // Adjust the path if necessary
const { logSecurityEvent } = require("./activityLogger");

// Protect middleware to check if user is logged in
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            // Extract and verify the token
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch the user from the database without the password
            req.user = await User.findById(decoded.id).select("-password");

            if (!req.user) {
                await logSecurityEvent('UNAUTHORIZED_ACCESS', null, req, `Token valid but user not found: ${decoded.id}`, 'HIGH');
                return res.status(404).json({ message: "User not found" });
            }

            next(); // User is authenticated, proceed
        } catch (error) {
            console.error("JWT verification failed:", error.message);
            await logSecurityEvent('UNAUTHORIZED_ACCESS', null, req, `JWT verification failed: ${error.message}`, 'HIGH');
            return res.status(401).json({ message: "Not authorized, token failed" });
        }
    } else {
        await logSecurityEvent('UNAUTHORIZED_ACCESS', null, req, 'No authorization token provided', 'MEDIUM');
        return res.status(401).json({ message: "Not authorized, no token" });
    }
};

// Middleware to check if user is a staff member
const staff = (req, res, next) => {
    if (req.user && req.user.role === "staff") {
        next(); // User is staff, proceed
    } else {
        logSecurityEvent('ACCESS_DENIED', req.user, req, 'Staff access required but user is not staff', 'MEDIUM');
        res.status(403).json({ message: "Access denied, staff only" });
    }
};

module.exports = { protect, staff };
