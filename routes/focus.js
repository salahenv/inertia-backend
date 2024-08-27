const express = require("express");
const mongoose = require('mongoose');
const router = express.Router();
const Focus = require("../models/focus");


router.get("/", async (req, res) => {
  try {
    let user = await Focus.find({ userId: ObjectId("userObjectIdHere") });
    if (user) {
      return res.status(400).send("User already exists");
    }
    user = new User({ name, username, password });
    await user.save();
    res.status(201).send({success: true, message: 'user created', data: {}});
  } catch (err) {
    console.error(err);
    res.status(500).send({success: false, message: 'something went wrong. Please try later', error: 'server error'});
  }
});

router.post("/create", async (req, res) => {
  const { name, startTime, endTime } = req.body;
  const user = req.user;
  let focus = new Focus({ userId: new mongoose.Types.ObjectId(user.id), name, startTime, endTime });
  try {
    focus = await focus.save();
    return res.status(201).send({
        success: true,
        message: 'focus created',
        data: {focus}
    });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
