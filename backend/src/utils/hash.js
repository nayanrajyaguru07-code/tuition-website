const bcrypt = require('bcrypt');

const hashPassword = async (password) => {
    return bcrypt.hash(password, 10);
};

const comparePassword = async (plain, hash) => {
    return bcrypt.compare(plain, hash);
};

module.exports = { hashPassword, comparePassword }