const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();
const JWT_PEPPER = process.env.JWT_PEPPER;

const verifyToken = (req, res, next) => {
  const token = req.cookies ? req.cookies.jwt : null;

  if (!token) {
    //Si l'user na pas de token on l'envoie se connecter avec une alerte
    return res.send(`
    <script>
        alert("Veuillez vous connecter pour voir votre profile.");
        window.location.href = "/login";
    </script>
`);
  }

  try {
    const decoded = jwt.verify(token, JWT_PEPPER);
    req.user = decoded;
    next();
  } catch (err) {
    return res
      .status(403)
      .json({ error: "Token invalide ou expiré. Veuillez vous reconnecter." });
  }
};

module.exports = verifyToken;
