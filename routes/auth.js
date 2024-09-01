const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

const generateToken = (payload) => {
  const secretKey = process.env.JWT_SECRET_KEY || 'yourSecretKey';
  const options = {
    expiresIn: '24h',
  };
  const token = jwt.sign(payload, secretKey, options);
  return token;
};

router.post("/register", async (req, res) => {
  const { name, username, password } = req.body;
  try {
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).send("User already exists");
    }
    user = new User({ name, username, password });
    await user.save();
    res.status(201).send({success: true, message: 'user created', data: {}});
  } catch (err) {
    res.status(500).send({success: false, message: 'something went wrong. Please try later', error: 'server error'});
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    let user = await User.findOne({ username });
    if (!user) {
      return res.status(401).send({success: false, message: 'user not found', error: 'user not found'});
    }
    const passwordCompare = await bcrypt.compare(password, user.password);
    if (passwordCompare) {
      try {
        const token = generateToken({
          id: user._id,
          email: user.email,
        },);
        // Set token in a cookie
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production', // Send only over HTTPS in production
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days (in milliseconds)
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Prevents CSRF attacks
        });
        return res.status(200).send({
          success: true,
          message: 'success',
          data: {user}
        });
      } catch (error) {
        res.status(500).send({success: false, message: 'something went wrong. Please try later', error: 'unable to generate token'});
      }
    } else {
      res.status(500).send({success: false, message: 'wrong password', error: 'wrong password'});
    }
  } catch (error) {}
});

router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

module.exports = router;
