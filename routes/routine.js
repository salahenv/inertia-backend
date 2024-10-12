const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Todo = require("../models/todo");
const RoutineTodo = require('../models/routineTodo');
const cron = require('node-cron');

router.post("/create", async (req, res) => {
  const { name, repeatMode, repeatOnEvery, isActive } = req.body;
  const user = req.user;

  let routine = new RoutineTodo({
    userId: new mongoose.Types.ObjectId(user.id),
    name,
    repeatMode,
    repeatOnEvery,
    isActive
  });

  try {
    routine = await routine.save();
    return res.status(201).send({
      success: true,
      message: "Routine todo created",
      data: { routine },
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "something went wrong",
      error: { error },
    });
  }
});

router.patch("/update/:id", async (req, res) => {
    const { id } = req.params;
    const { isActive = false } = req.body;
    try {
      const routine = await RoutineTodo.findByIdAndUpdate(
        new mongoose.Types.ObjectId(id),
        {
          isActive: isActive
        },
        { new: true, runValidators: true }
      );
      if (!routine) {
        return res
          .status(404)
          .json({ success: false, message: "routine not found" });
      }
      return res.status(200).json({
        success: true,
        message: "routine updated",
        data: { routine },
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "something went wrong",
        error,
      });
    }
});

router.delete("/remove/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const routine = await RoutineTodo.findByIdAndDelete(
      new mongoose.Types.ObjectId(id)
    );
    if (!routine) {
      return res
        .status(404)
        .json({ success: false, message: "routine not found" });
    }
    return res.status(200).json({
      success: true,
      message: "routine deleted",
      data: { routine },
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "something went wrong",
      error: { error },
    });
  }
});

router.get("/", async (req, res) => {
  const user = req.user;
  try {
    let routines = await RoutineTodo.find({ userId: new mongoose.Types.ObjectId(user.id) });
    return res.status(200).send({
      success: true,
      message: "routines fetched successfully",
      data: {todos: routines},
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Something went wrong",
      error: { error },
    });
  }
});

cron.schedule('0 0 * * *', async () => {
  console.log("cron job started");
  const today = new Date();
  const dayOfWeek = today.toLocaleString('en-US', { weekday: 'short', timeZone: 'Asia/Kolkata' }).toLowerCase();
  const dayOfMonth = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).getDate();
  
  const routineTodos = await RoutineTodo.find();

  for (const routine of routineTodos) {
      let shouldCreateTodo = false;

      // Check if a todo should be created based on repeatMode
      if (routine.repeatMode === 'daily') {
          shouldCreateTodo = true;
      } else if (routine.repeatMode === 'weekly') {
          shouldCreateTodo = Array.isArray(routine.repeatOnEvery) 
              ? routine.repeatOnEvery.includes(dayOfWeek) 
              : routine.repeatOnEvery === dayOfWeek;
      } else if (routine.repeatMode === 'monthly') {
          shouldCreateTodo = Array.isArray(routine.repeatOnEvery) 
              ? routine.repeatOnEvery.includes(dayOfMonth.toString()) 
              : routine.repeatOnEvery === dayOfMonth.toString();
      }

      const isEligibleToCreateTodo = shouldCreateTodo && routine.isActive;
      
      if(isEligibleToCreateTodo) {
        console.log("routine is eligible for todo creation", routine);
        // existing todo which is created from routine && not completed && not archived
        let existingInCompletedRoutineTodo = await Todo.findOne({ userId: routine.userId, name: routine.name, routine: true, completed: false, archived: false, missed: false });
        if(existingInCompletedRoutineTodo) {
          console.log("existing imcompleted routine todo", existingInCompletedRoutineTodo);
          try {
            console.log('deleting...', existingInCompletedRoutineTodo);
            await Todo.deleteOne({ _id: existingInCompletedRoutineTodo._id });
            console.log('deleted', existingInCompletedRoutineTodo);
          } catch(error) {
            console.log('error while deleting existing imcompleted routine todo', error);
          }
          routine.missedCounter = (routine.missedCounter || 0) + 1;
        }
        try {
          routine.totolCounter = (routine.totolCounter || 0) + 1;
          console.log('saving', routine);
          await routine.save();
          console.log('saved routine', routine);
        } catch (error) {
          console.log('error while updating routine', error);
        }
        // creating todo
        const newTodo = new Todo({
          userId: routine.userId,
          name: routine.name,
          completed: false,
          archived: false,
          routine: true,
          missed: false,
          comments: [],
        });
        try {
          console.log('creating todo for', routine);
          await newTodo.save();
          console.log('created');
        } catch (error) {
          console.log('error while creating routine todo', error);
        }
      }
  }
}, {
  timezone: "Asia/Kolkata"
});

module.exports = router;
