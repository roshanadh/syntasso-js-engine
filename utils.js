require('dotenv').config();

if (!process.env) throw new Error('Environment variable(s) not set.');

module.exports = {
    PORT: process.env.PORT || 8080,
    SECRET_DIVIDER_TOKEN: process.env.SECRET_DIVIDER_TOKEN,
}