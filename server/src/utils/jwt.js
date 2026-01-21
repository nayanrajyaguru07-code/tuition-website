import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
}

// Generate token
const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, /*{ expiresIn: '1d' }*/);
};

// Verify and decode token
const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (err) {
        // Token invalid or expired
        return null;
    }
};

export { generateToken, verifyToken }