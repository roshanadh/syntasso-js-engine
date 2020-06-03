require("dotenv").config();

if (!process.env) throw new Error("Environment variable(s) not set.");

module.exports = {
  PORT: process.env.PORT || 8080,
  LIVE_SERVER_PORT: process.env.LIVE_SERVER_PORT,
  SECRET_DIVIDER_TOKEN: process.env.SECRET_DIVIDER_TOKEN,
  SECRET_SESSION_KEY: process.env.SECRET_SESSION_KEY,
};
