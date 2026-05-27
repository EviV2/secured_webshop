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
      const now = new Date();

      if (!email || !password) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
      }

      const query =
        "SELECT id, email, password, role, username, login_attempts, lock_until, first_failed_attempt FROM users WHERE email = ?";
      const [users] = await db.promise().query(query, [email]);

      if (users.length === 0) {
        return res.status(400).send(`
        <script>
            alert("Ce nom d'utilisateur ou cet email n'existe pas !");
            window.history.back(); 
        </script>
      `);
      }

      const user = users[0];
      if (user.lock_until && new Date(user.lock_until) > now) {
        const secondesRestantes = Math.ceil(
          (new Date(user.lock_until) - now) / 1000,
        );
        return res.status(403).send(`
        <script>
            alert("Compte temporairement bloqué. Réessayez dans ${secondesRestantes} secondes.");
            window.history.back();
        </script>
      `);
      }

      const passwordWithPepper = password + PEPPER;
      const match = await bcrypt.compare(passwordWithPepper, user.password);

      if (!match) {
        let newAttempts = user.login_attempts + 1;
        let firstFailed = user.first_failed_attempt
          ? new Date(user.first_failed_attempt)
          : now;
        let lockUntil = null;

        // si l ancre existait deja en bdd on verifie sa validite
        if (user.first_failed_attempt) {
          const tempsEcoule = now - new Date(user.first_failed_attempt);

          // si plus d une minute est passee on reset la minute glissante
          if (tempsEcoule >= 60000) {
            firstFailed = now;
            // si le mec n a pas encore atteint 5 essais on temporise son compteur
            if (newAttempts < 5) {
              newAttempts = 1;
            }
          }
        }

        // regle a : blocage absolu des 15 tentatives cumulees
        if (newAttempts >= 15) {
          let dateFin = new Date();
          dateFin.setMinutes(dateFin.getMinutes() + 15);
          lockUntil = dateFin;
          newAttempts = 0;
          firstFailed = null;
          console.log(`15 minute bloque : [${email}]`);
        }
        // regle b : 5 tentatives dans la meme minute glissante
        else if (newAttempts % 5 === 0 && now - firstFailed < 60000) {
          let dateFin = new Date();
          dateFin.setMinutes(dateFin.getMinutes() + 1);
          lockUntil = dateFin;
          // on garde firstFailed valide pour eviter le crash de soustraction
          console.log(`1 minute bloque : [${email}]`);
        }

        // sauvegarde des variables en bdd
        await db.promise().query(
          `UPDATE users SET 
            login_attempts = ?, 
            lock_until = ?, 
            first_failed_attempt = ? 
          WHERE id = ?`,
          [newAttempts, lockUntil, firstFailed, user.id],
        );

        return res.status(400).send(`
        <script>
            alert("Mot de passe incorrect !");
            window.history.back();
        </script>
      `);
      }

      await db.promise().query(
        `UPDATE users SET 
          login_attempts = 0, 
          lock_until = NULL, 
          first_failed_attempt = NULL 
        WHERE id = ?`,
        [user.id],
      );

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          username: user.username,
        },
        JWT_PEPPER,
        { expiresIn: "24h" },
      );
      res.cookie("jwt", token, {
        httpOnly: true,
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res.redirect("/");
    } catch (err) {
      console.error("Erreur Login:", err);
      return res.status(500).json({ error: "Erreur serveur interne" });
    }
  },
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
