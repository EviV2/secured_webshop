const bcrypt = require("bcrypt");
const db = require("../config/db");
const dotenv = require("dotenv");

dotenv.config();
const PEPPER = process.env.PEPPER;

module.exports = {
  // ----------------------------------------------------------
  // POST /api/auth/login
  // ----------------------------------------------------------
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
      }

      const query = "SELECT * FROM users WHERE email = ?";
      const [users] = await db.promise().query(query, [email]);

      if (users.length === 0) {
        return res.status(401).json({ error: "Identifiants invalides" });
      }

      const user = users[0];
      const passwordWithPepper = password + PEPPER;
      const match = await bcrypt.compare(passwordWithPepper, user.password);

      if (!match) {
        return res.status(401).json({ error: "Identifiants invalides" });
      }

      return res.redirect("/");
    } catch (err) {
      console.error("Erreur Login:", err);
      return res.status(500).json({ error: "Erreur serveur interne" });
    }
  },

  // ----------------------------------------------------------
  // POST /api/auth/register
  // ----------------------------------------------------------
  register: async (req, res) => {
    try {
      const { username, email, adresse, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: "Données manquantes" });
      }

      const passwordWithPepper = password + PEPPER;
      const hashedPassword = await bcrypt.hash(passwordWithPepper, 10);

      const query =
        "INSERT INTO users (username, email, password, address) VALUES (?, ?, ?, ?)";
      const [results] = await db
        .promise()
        .query(query, [username, email, hashedPassword, adresse]);

      console.log(`Utilisateur créé : ${username} (ID: ${results.insertId})`);

      return res.redirect("/login");
    } catch (err) {
      console.error("Erreur Register:", err);
      return res.status(500).json({ error: "Impossible de créer le compte" });
    }
  },
};
