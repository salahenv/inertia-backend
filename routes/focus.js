const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Focus = require("../models/focus");
const Area = require("../models/area");

router.get("/", async (req, res) => {
  const user = req.user;
  const dayOffset = parseInt(req.query.dayOffset) || 0;

  try {
    const currentDate = new Date();
    const ISTOffset = 5.5 * 60 * 60 * 1000;
    const localCurrentDate = new Date(currentDate.getTime() + ISTOffset);
    const startDate = new Date(localCurrentDate);
    startDate.setDate(startDate.getDate() - dayOffset);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);

    let focus = await Focus.find({
      userId: new mongoose.Types.ObjectId(user.id),
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    if (focus.length) {
      return res.status(200).send({
        success: true,
        message: "",
        data: { focus, date: startDate },
      });
    }

    return res.status(200).send({
      success: true,
      message: "No focus found",
      data: { focus: [], date: startDate },
    });
  } catch (err) {
    return res.status(500).send({
      success: false,
      message: "Something went wrong. Please try later",
      error: err,
    });
  }
});





router.post("/create", async (req, res) => {
  const { name, startTime, endTime, tag } = req.body;
  const user = req.user;
  let focus = new Focus({
    userId: new mongoose.Types.ObjectId(user.id),
    name,
    startTime,
    endTime,
    tag,
  });
  try {
    focus = await focus.save();
    return res.status(201).send({
      success: true,
      message: "focus created",
      data: { focus },
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "something went wrong",
      error: { error },
    });
  }
});

router.patch("/update/:focusId", async (req, res) => {
  const { focusId } = req.params;
  const updatedFocus = req.body;
  try {
    const focus = await Focus.findByIdAndUpdate(
      new mongoose.Types.ObjectId(focusId),
      updatedFocus,
      { new: true, runValidators: true }
    );
    if (!focus) {
      return res
        .status(404)
        .json({ success: false, message: "Focus not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Focus updated",
      data: { focus },
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "something went wrong",
      error,
    });
  }
});

router.delete("/remove/:focusId", async (req, res) => {
  const { focusId } = req.params;
  try {
    const focus = await Focus.findByIdAndDelete(
      new mongoose.Types.ObjectId(focusId)
    );
    if (!focus) {
      return res
        .status(404)
        .json({ success: false, message: "focus not found" });
    }
    return res.status(200).json({
      success: true,
      message: "area deleted",
      data: { focus },
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "something went wrong",
      error: { error },
    });
  }
});

router.get("/area", async (req, res) => {
  const user = req.user;
  try {
    let area = await Area.find({
      userId: new mongoose.Types.ObjectId(user.id),
    });
    if (area.length) {
      return res.status(200).send({
        success: true,
        message: "",
        data: {
          area: area,
        },
      });
    }
    return res
      .status(200)
      .send({
        success: true,
        message: "no focus area found",
        data: { focusArea: [] },
      });
  } catch (err) {
    return res
      .status(500)
      .send({
        success: false,
        message: "something went wrong. Please try later",
        error: err,
      });
  }
});

router.post("/area/create", async (req, res) => {
  const { label } = req.body;
  const value = label.toUpperCase().split(" ").join("_");
  const user = req.user;
  let area = new Area({
    userId: new mongoose.Types.ObjectId(user.id),
    label,
    value,
  });
  try {
    area = await area.save();
    return res.status(201).send({
      success: true,
      message: "area created",
      data: { area },
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "something went wrong",
      error: { error },
    });
  }
});

router.delete("/area/remove/:areaId", async (req, res) => {
  const { areaId } = req.params;
  try {
    const area = await Area.findByIdAndDelete(
      new mongoose.Types.ObjectId(areaId)
    );
    if (!area) {
      return res
        .status(404)
        .json({ success: false, message: "Area not found" });
    }
    return res.status(200).json({
      success: true,
      message: "area deleted",
      data: { area },
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "something went wrong",
      error: { error },
    });
  }
});
module.exports = router;
