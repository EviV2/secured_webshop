const express = require("express");
const router = express.Router();
const controller = require("../controllers/AuthController");
const verifyToken = require("../middleware/auth");

router.post("/login", controller.login);
router.post("/register", controller.register);
router.get("/status", verifyToken, (req, res) => {
  res.json({ role: req.user.role, username: req.user.username });
});
router.get("/logout", controller.logout);

module.exports = router;
