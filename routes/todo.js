const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Todo = require("../models/todo");

router.get("/", async (req, res) => {
  const user = req.user;
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate());
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setDate(endDate.getDate());
    endDate.setHours(23, 59, 59, 999);

    let todo = await Todo.find({
      userId: new mongoose.Types.ObjectId(user.id),
      $or: [
        { completed: false },
        {
          completed: true,
          createdAt: { $gte: startDate, $lt: endDate },
        },
      ],
    });

    if (todo.length) {
      const completedTodos = todo.filter((t) => t.completed);
      const inCompletedTodos = todo.filter((t) => !t.completed);
      return res.status(200).send({
        success: true,
        message: "",
        data: {
          todo,
          completedTodos,
          inCompletedTodos,
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

    // const startDate = new Date();
    // startDate.setDate(startDate.getDate() - dayOffset);
    // startDate.setHours(0, 0, 0, 0);

    // const endDate = new Date();
    // endDate.setDate(endDate.getDate() - dayOffset);
    // endDate.setHours(23, 59, 59, 999);
    
    const currentDate = new Date();
    const startDate = new Date(currentDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    startDate.setDate(startDate.getDate() - dayOffset);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);

    let todos = await Todo.find({
      userId: new mongoose.Types.ObjectId(user.id),
      completed: true,
      updatedAt: {
        $gte: startDate,
        $lt: endDate,
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
  const { isCompleted } = req.body;
  try {
    const todo = await Todo.findByIdAndUpdate(
      new mongoose.Types.ObjectId(todoId),
      {
        completed: isCompleted,
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

module.exports = router;
