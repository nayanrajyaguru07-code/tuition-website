import bcrypt from "bcryptjs";
import crypto from "crypto";

// Password hashing and comparison
const hashPassword = async (password) => {
    const saltRounds = bcrypt.genSaltSync(10);
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
}
const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
}

// Token hashing and comparison
const hashToken = (token) => {
    return crypto.createHash("sha256").update(token).digest("hex");
}
const compareToken = (token, hashedToken) => {
    const hashedInputToken = hashToken(token);
    return hashedInputToken === hashedToken;
}

export { hashPassword, comparePassword }