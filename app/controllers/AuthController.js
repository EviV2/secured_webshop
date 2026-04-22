const req = require("express/lib/request");
const db = require("../config/db");

module.exports = {
  // ----------------------------------------------------------
  // POST /api/auth/login
  // ----------------------------------------------------------
  login: (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    const query = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;

    db.query(query, (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message, query: query });
      }

      if (results.length === 0) {
        return res
          .status(401)
          .json({ error: "Email ou mot de passe incorrect" });
      }
      //Rediriger a la "maison"
      res.redirect("/");
      //res.json({ message: "Connexion réussie", user: results[0] });
    });
  },

  // ----------------------------------------------------------
  // POST /api/auth/register
  // ----------------------------------------------------------
  register: (req, res) => {
    const { username, email, adresse, password } = req.body;
    const query = `INSERT INTO users (username, email, password, address)
                       VALUES('${username}', '${email}', '${password}', '${adresse}')`;

    db.query(query, (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message, query: query });
      }
      console.log(
        `Utilisateur crée (${username}) avec l'ID:`,
        results.insertId,
        `\nemail: ${email}\nadresse: ${adresse}`,
      );
      res.redirect("/login");
    });
  },
};
