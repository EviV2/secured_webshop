const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();
const JWT_PEPPER = process.env.JWT_PEPPER;

const verifyAdmin = (req, res, next) => {
  //req.user pour prévenir d'un crash  (aukaou)
  if (req.user && req.user.role !== "admin") {
    return res.redirect("/");
    //return res.status(403).json({ error: "Access refused. Admins only." });
  }
  next();
};

module.exports = verifyAdmin;
