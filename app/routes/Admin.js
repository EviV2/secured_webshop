const express = require("express");
const router = express.Router();
const controller = require("../controllers/AdminController");

//Middleware
const verifyToken = require("../middleware/auth");
const verifyAdmin = require("../middleware/admin");

router.get("/users", verifyToken, verifyAdmin, controller.getUsers);

module.exports = router;
