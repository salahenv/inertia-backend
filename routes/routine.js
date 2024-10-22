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
    const updates = req.body;
    try {
      const routine = await RoutineTodo.findByIdAndUpdate(
        new mongoose.Types.ObjectId(id),
        {
          $set: updates
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
    let activeRoutines = routines.filter(routine => routine.isActive);
    let activeRoutinesDaily = activeRoutines.filter(routine => routine.repeatMode.toLocaleLowerCase() === 'daily');
    let activeRoutinesWeekly = activeRoutines.filter(routine => routine.repeatMode.toLocaleLowerCase() === 'weekly');
    let activeRoutinesMontly = activeRoutines.filter(routine => routine.repeatMode.toLocaleLowerCase() === 'monthly');
    let nonActiveRoutines = routines.filter(routine => !routine.isActive);
    return res.status(200).send({
      success: true,
      message: "routines fetched successfully",
      data: {todos: [
        ...activeRoutinesDaily,
        ...activeRoutinesWeekly, 
        ...activeRoutinesMontly, 
        ...nonActiveRoutines
      ]},
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Something went wrong",
      error: { error },
    });
  }
});

const isRoutineEligibleForTodoCreation = (routine) => {
  const {
    repeatMode,
    repeatOnEvery,
    isActive,
  } = routine;

  let shouldCreateTodo = false;

  const today = new Date();
  const dayOfWeek = today.toLocaleString('en-US', { weekday: 'short', timeZone: 'Asia/Kolkata' }).toLowerCase();
  const dayOfMonth = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).getDate();

  if (repeatMode === 'daily') {
    shouldCreateTodo = true;
  } else if (repeatMode === 'weekly') {
    shouldCreateTodo = Array.isArray(repeatOnEvery) 
      ? repeatOnEvery.includes(dayOfWeek) 
      : repeatOnEvery === dayOfWeek;
  } else if (routine.repeatMode === 'monthly') {
    shouldCreateTodo = Array.isArray(routine.repeatOnEvery) 
      ? routine.repeatOnEvery.includes(dayOfMonth.toString()) 
      : routine.repeatOnEvery === dayOfMonth.toString();
  }
  return shouldCreateTodo && isActive;
}

cron.schedule('0 0 * * *', async () => {
  const routineTodos = await RoutineTodo.find();
  for (const routine of routineTodos) {
      let isEligibleToCreateTodo = isRoutineEligibleForTodoCreation(routine);
      if(isEligibleToCreateTodo) {
        let existingInCompletedRoutineTodo = null;
        try {
          existingInCompletedRoutineTodo = await Todo.findOne({ userId: routine.userId, name: routine.name, routine: true, completed: false, archived: false });
        } catch (error) {
          console.log('error while finding exisitng in completed todo');
        }

        if(existingInCompletedRoutineTodo) {
          try {
            existingInCompletedRoutineTodo.missed = true;
            await existingInCompletedRoutineTodo.save();
          } catch (error) {
            console.log('error while marking exisitng incompleted todo missed');
          }
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
          routineId: routine._id,
        });
        try {
          await newTodo.save();
          try {
            if(existingInCompletedRoutineTodo) {
              routine.missedCounter = (routine.missedCounter || 0) + 1
            }
            routine.totolCounter = (routine.totolCounter || 0) + 1;
            routine.save();
          } catch (error) {
            console.log('error while updating routine');
          }
        } catch (error) {
          console.log('error while creating routine todo', error);
        }
      }
  }
}, {
  timezone: "Asia/Kolkata"
});

module.exports = router;
