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

router.post("/:todoId/comments", async (req, res) => {
  const { todoId } = req.params;
  const { text } = req.body; // Assuming the comment text is passed in the request body
  const user = req.user; // The user who is posting the comment

  if (!text) {
    return res.status(400).send({
      success: false,
      message: "Comment text is required",
    });
  }

  try {
    const todo = await Todo.findById(new mongoose.Types.ObjectId(todoId));
    
    if (!todo) {
      return res.status(404).send({
        success: false,
        message: "Todo not found",
      });
    }

    // Add the comment to the todo's comments array
    todo.comments.push({
      userId: user.id, 
      text
    });

    await todo.save(); // Save the updated todo with the new comment
    return res.status(200).send({
      success: true,
      message: "Comment added successfully",
      data: { 
        todoId: todo._id,
        comments: todo.comments 
      },
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
});

router.get("/:todoId/comments", async (req, res) => {
  const { todoId } = req.params;

  try {
    const todo = await Todo.findById(new mongoose.Types.ObjectId(todoId)).populate('comments.userId', 'name email'); // Populate user details for comments

    if (!todo) {
      return res.status(404).send({
        success: false,
        message: "Todo not found",
      });
    }

    return res.status(200).send({
      success: true,
      message: "Comments fetched successfully",
      data: { comments: todo.comments },
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
});



module.exports = router;
