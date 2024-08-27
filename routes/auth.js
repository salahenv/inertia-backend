const express = require("express");
const router = express.Router();
const passport = require("passport");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

router.post("/register", async (req, res) => {
  const { name, username, password } = req.body;
  try {
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).send("User already exists");
    }
    user = new User({ name, username, password });
    await user.save();
    res.status(201).send({ status: "success", message: "user created" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    let user = await User.findOne({ username });
    if (!user) {
      return res.status(401).send("User not found");
    }
    const passwordCompare = await bcrypt.compare(password, user.password);
    if (passwordCompare) {
      try {
        const token = jwt.sign(
          {
            id: user._id,
            email: user.email,
          },
          "salah.env",
          {
            expiresIn: 86400,
          }
        );
        return res.json({
          user,
          token,
        });
      } catch (error) {
        res.json({ status: "error", error: "something went wrong" });
      }
    } else {
      res.json({ status: "error", error: "check the password again" });
    }
  } catch (error) {}
});

// Logout route
router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

module.exports = router;
