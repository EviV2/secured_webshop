const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();
const verifyAdmin = (req, res, next) => {
  //req.user pour prévenir d'un crash  (aukaou)
  if (req.user && req.user.role !== "admin") {
    return res.status(403).json({ error: "Access refused. Admins only." });
  }
  next();
};

module.exports = verifyAdmin;
