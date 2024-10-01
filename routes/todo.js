const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Todo = require("../models/todo");
const RoutineTodo = require('../models/routineTodo');
const cron = require('node-cron');

router.get("/", async (req, res) => {
  const user = req.user;
  try {
    const currentDate = new Date();
    const ISTOffset = 5.5 * 60 * 60 * 1000;
    const localCurrentDate = new Date(currentDate.getTime() + ISTOffset);
    const startDate = new Date(localCurrentDate);
    startDate.setDate(startDate.getDate());
    startDate.setHours(0, 0, 0, 0);
    const startDateUTC = new Date(startDate.getTime() - ISTOffset);
    const endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);
    const endDateUTC = new Date(endDate.getTime() - ISTOffset);

    let todo = await Todo.find({
      userId: new mongoose.Types.ObjectId(user.id),
      $or: [
        { completed: false },
        {
          completed: true,
          updatedAt: { $gte: startDateUTC, $lt: endDateUTC },
        },
      ],
      archived: { $ne: true },
    });

    if (todo.length) {
      return res.status(200).send({
        success: true,
        message: "",
        data: {
          todo
        },
      });
    }
    return res
      .status(200)
      .send({ success: true, message: "no todo found", data: { todo: [] } });
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

router.get("/completed", async (req, res) => {
  const user = req.user;
  const dayOffset = parseInt(req.query.dayOffset) || 1;
  try {
    const currentDate = new Date();
    const ISTOffset = 5.5 * 60 * 60 * 1000;
    const localCurrentDate = new Date(currentDate.getTime() + ISTOffset);
    const startDate = new Date(localCurrentDate);
    startDate.setDate(startDate.getDate() - dayOffset);
    startDate.setHours(0, 0, 0, 0);
    const startDateUTC = new Date(startDate.getTime() - ISTOffset);
    const endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);
    const endDateUTC = new Date(endDate.getTime() - ISTOffset);

    let todos = await Todo.find({
      userId: new mongoose.Types.ObjectId(user.id),
      completed: true,
      updatedAt: {
        $gte: startDateUTC,
        $lt: endDateUTC
      },
    }).exec();

    return res.status(200).send({
      success: true,
      message: todos.length ? "" : "No todos found",
      data: {
        todos: todos,
        date: startDate,
      },
    });

  } catch (err) {
    return res.status(500).send({
      success: false,
      message: "Something went wrong. Please try again later",
      error: err,
    });
  }
});
router.get("/archived", async (req, res) => {
  const user = req.user;
  const { page = 1, limit = 10 } = req.query; // Default page = 1 and limit = 10

  try {
    const todos = await Todo.find({
      userId: new mongoose.Types.ObjectId(user.id),
      archived: true,
    })
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order (most recent first)
      .skip((page - 1) * limit) // Skip the items for previous pages
      .limit(parseInt(limit)) // Limit the number of items returned
      .exec();

    const totalTodos = await Todo.countDocuments({
      userId: new mongoose.Types.ObjectId(user.id),
      archived: true,
    });

    return res.status(200).send({
      success: true,
      message: todos.length ? "" : "No todos found",
      data: {
        todos: todos,
        total: totalTodos, // Total number of todos
        page: parseInt(page), // Current page number
        totalPages: Math.ceil(totalTodos / limit), // Total number of pages
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send({
      success: false,
      message: "Something went wrong. Please try again later",
      error: err,
    });
  }
});



router.post("/create", async (req, res) => {
  const { name, completed = false } = req.body;
  const user = req.user;
  let todo = new Todo({
    userId: new mongoose.Types.ObjectId(user.id),
    name,
    completed,
  });
  try {
    todo = await todo.save();
    return res.status(201).send({
      success: true,
      message: "todo created",
      data: { todo },
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "something went wrong",
      error: { error },
    });
  }
});

router.patch("/update/:todoId", async (req, res) => {
  const { todoId } = req.params;
  const { completed = false, archived = false } = req.body;
  try {
    const todo = await Todo.findByIdAndUpdate(
      new mongoose.Types.ObjectId(todoId),
      {
        completed: completed,
        archived: archived,
      },
      { new: true, runValidators: true }
    );
    if (!todo) {
      return res
        .status(404)
        .json({ success: false, message: "Focus not found" });
    }
    return res.status(200).json({
      success: true,
      message: "todo updated",
      data: { todo },
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "something went wrong",
      error,
    });
  }
});

router.delete("/remove/:todoId", async (req, res) => {
  const { todoId } = req.params;
  try {
    const todo = await Todo.findByIdAndDelete(
      new mongoose.Types.ObjectId(todoId)
    );
    if (!todo) {
      return res
        .status(404)
        .json({ success: false, message: "todo not found" });
    }
    return res.status(200).json({
      success: true,
      message: "todo deleted",
      data: { todo },
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "something went wrong",
      error: { error },
    });
  }
});

router.post("/create-routine-todo", async (req, res) => {
  const { name, repeatMode, repeatOnEvery } = req.body;
  const user = req.user;

  let routine = new RoutineTodo({
    userId: new mongoose.Types.ObjectId(user.id),
    name,
    repeatMode,
    repeatOnEvery,
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

router.delete("/remove-routine-todo/:id", async (req, res) => {
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

router.get("/routine-todos", async (req, res) => {
  const user = req.user;

  try {
    // Fetch all routine todos for the logged-in user
    const routines = await RoutineTodo.find({ userId: new mongoose.Types.ObjectId(user.id) });

    return res.status(200).send({
      success: true,
      message: "Routine todos fetched successfully",
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


// Runs every day at midnight
cron.schedule('0 0 * * *', async () => {
  console.log("cron called");
  const today = new Date();
  const dayOfWeek = today.toLocaleString('en-US', { weekday: 'short', timeZone: 'Asia/Kolkata' }).toLowerCase();
  const dayOfMonth = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).getDate();

  // Fetch all routine todos
  const routineTodos = await RoutineTodo.find();

  routineTodos.forEach(async (routine) => {
    let shouldCreateTodo = false;

    // Check for daily repeat mode
    if (routine.repeatMode === 'daily') {
      shouldCreateTodo = true;
    }

    // Check for weekly repeat mode
    else if (routine.repeatMode === 'weekly') {
      if (Array.isArray(routine.repeatOnEvery)) {
        // If `repeatOnEvery` is an array, check if today's day of the week is in the array
        shouldCreateTodo = routine.repeatOnEvery.includes(dayOfWeek);
      } else {
        // For single value (backward compatibility)
        shouldCreateTodo = routine.repeatOnEvery === dayOfWeek;
      }
    }

    // Check for monthly repeat mode
    else if (routine.repeatMode === 'monthly') {
      if (Array.isArray(routine.repeatOnEvery)) {
        // If `repeatOnEvery` is an array, check if today's day of the month is in the array
        shouldCreateTodo = routine.repeatOnEvery.includes(dayOfMonth.toString());
      } else {
        // For single value (backward compatibility)
        shouldCreateTodo = routine.repeatOnEvery === dayOfMonth.toString();
      }
    }

    // If a new todo should be created, proceed to create it
    if (shouldCreateTodo) {
      const newTodo = new Todo({
        userId: routine.userId,
        name: routine.name,
        completed: false,
        archived: false,
        routine: true,
      });
      await newTodo.save();
    }
  });
}, {
  timezone: "Asia/Kolkata"
});



module.exports = router;
