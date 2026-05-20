require("dotenv").config({ path: "../.env" });

const express = require("express");
const path = require("path");
const https = require("https");
const fs = require("fs");

const app = express();

// Middleware pour parser le corps des requêtes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fichiers statiques (CSS, images, uploads...)
app.use(express.static(path.join(__dirname, "public")));

const cookieParser = require("cookie-parser");
//Création cooks
app.use(cookieParser());

// ---------------------------------------------------------------
// Routes API (retournent du JSON)
// ---------------------------------------------------------------
const authRoute = require("./routes/Auth");
const profileRoute = require("./routes/Profile");
const adminRoute = require("./routes/Admin");

app.use("/api/auth", authRoute);
app.use("/api/profile", profileRoute);
app.use("/api/admin", adminRoute);

// ---------------------------------------------------------------
// Routes pages (retournent du HTML)
// ---------------------------------------------------------------
const homeRoute = require("./routes/Home");
const userRoute = require("./routes/User");

// ---------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------

const verifyToken = require("./middleware/auth");
const verifyAdmin = require("./middleware/admin");

app.use("/", homeRoute);
app.use("/user", userRoute);

app.get("/login", (_req, res) =>
  res.sendFile(path.join(__dirname, "views", "login.html")),
);
app.get("/register", (_req, res) =>
  res.sendFile(path.join(__dirname, "views", "register.html")),
);
app.get("/profile", verifyToken, (_req, res) =>
  res.sendFile(path.join(__dirname, "views", "profile.html")),
);
app.get("/admin", verifyToken, verifyAdmin, (_req, res) =>
  res.sendFile(path.join(__dirname, "views", "admin.html")),
);

// start du serveur
app.get("/test", (_req, res) => res.send("db admin: root, pwd : root"));
const options = {
  key: fs.readFileSync("server.key"),
  cert: fs.readFileSync("server.cert"),
};

// On démarre le serveur en HTTPS
https.createServer(options, app).listen(8080, () => {
  console.log("Secured server started on https://localhost:8080 !");
});
