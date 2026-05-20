const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const dotenv = require("dotenv");

dotenv.config();
const PEPPER = process.env.PEPPER;
const JWT_PEPPER = process.env.JWT_PEPPER;

module.exports = {
  // ----------------------------------------------------------
  // POST /api/auth/login
  // ----------------------------------------------------------
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // ERREUR -> On renvoie du JSON
      if (!email || !password) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
      }

      const query = "SELECT * FROM users WHERE email = ?";
      const [users] = await db.promise().query(query, [email]);

      // ERREUR -> On renvoie du JSON
      if (users.length === 0) {
        return res.status(400).send(`
        <script>
            alert("Ce nom d'utilisateur ou cet email n'existe pas !");
            window.history.back(); 
        </script>
    `);
      }

      const user = users[0];
      const passwordWithPepper = password + PEPPER;
      const match = await bcrypt.compare(passwordWithPepper, user.password);

      // ERREUR -> On renvoie du JSON
      if (!match) {
        return res.status(400).send(`
        <script>
            alert("Mot de passe incorrect !");
            window.history.back();
        </script>
    `);
      }

      // succes -> On crée le token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          username: user.username,
        },
        JWT_PEPPER,
        {
          expiresIn: "24h",
        },
      );

      res.cookie("jwt", token, {
        httpOnly: true,
        secure: true,
        maxAge: 24 * 60 * 60 * 1000, // 24h comme le jwt (24heure 60 minute 60 seconds 100 mili)
      });
      return res.redirect("/");
    } catch (err) {
      // ERREUR SERVEUR -> JSON
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
      // ERREUR -> On renvoie du JSON
      if (!username || !email || !password) {
        return res.status(400).json({ error: "Données manquantes" });
      }

      const [existingUsers] = await db
        .promise()
        .query("SELECT * FROM users WHERE username = ? OR email = ?", [
          username,
          email,
        ]);

      if (existingUsers.length > 0) {
        return res.status(400).send(`
        <script>
            alert("Ce nom d'utilisateur ou cet email est déjà pris !");
            window.history.back(); 
        </script>
    `);
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
      // ERREUR SERVEUR -> JSON
      console.error("Erreur Register:", err);
      return res.status(500).send(`
            <script>
                alert("Erreur serveur : Impossible de créer le compte.");
                window.history.back();
            </script>
        `);
    }
  },
  logout: (req, res) => {
    // On écrase le cookie 'jwt' par du vide et on le fait expirer immédiatement (le 0 est une date dans le passé la fameuse date de cheplus quand en 1970)
    res.cookie("jwt", "", {
      httpOnly: true,
      secure: true,
      expires: new Date(0),
    });

    // On redirige vers l'accueil ou la page de login avec une petite alerte
    return res.send(`
    <script>
      alert("Vous avez été déconnecté.");
      window.location.href = "/";
    </script>
  `);
  },
};
