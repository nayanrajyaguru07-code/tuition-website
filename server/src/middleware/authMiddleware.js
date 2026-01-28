import { verifyToken } from "../utils/jwt.js";

const authMiddleware = (req, res, next) => {
  try {
    // 1️⃣ Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // 2️⃣ Verify token
    const decoded = verifyToken(token);

    // 3️⃣ Check for Super Admin (Hardcoded Check)
    // We check id == 1 (loose equality) to handle if it comes as number 1 or string "1"
    const isSuperAdmin =
      decoded.id == 1 && decoded.email === "admin@tuition.com";

    // 4️⃣ Attach decoded payload + isSuperAdmin flag to request
    req.user = {
      ...decoded,
      isSuperAdmin: isSuperAdmin, // true or false
    };

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default authMiddleware;
