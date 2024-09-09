const express = require("express");
const mongoose = require('mongoose');
const router = express.Router();
const Todo = require("../models/todo");


router.get("/", async (req, res) => {
  const user = req.user;
  try {

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    let todo = await Todo.find({ 
      userId: new mongoose.Types.ObjectId(user.id),
      $or: [
        { completed: false },
        {
          completed: true,
          createdAt: { $gte: startOfDay, $lt: endOfDay }
        }
      ]
    });

    if(todo.length) {
      const completedTodos = todo.filter((t) => t.completed);
      const inCompletedTodos = todo.filter((t) => !t.completed);
      return res.status(200).send({success: true, message: '', data: {
        todo,
        completedTodos,
        inCompletedTodos
      }});
    }
    return res.status(200).send({success: true, message: 'no todo found', data: {todo:[]}});
  } catch (err) {
    return res.status(500).send({success: false, message: 'something went wrong. Please try later', error: err});
  }
});

router.get("/completed", async (req, res) => {
  const user = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  try {
    const startIndex = (page - 1) * limit;
    let todo = await Todo.find({ 
      userId: new mongoose.Types.ObjectId(user.id),
      $or: [{ completed: true }],
    })
    .sort({_id: -1})
    .skip(startIndex)
    .limit(limit);
    
    const totalTodos = await Todo.countDocuments({ 
      userId: new mongoose.Types.ObjectId(user.id),
      $or: [{ completed: true }]
    });

    if (todo.length) {
      return res.status(200).send({
        success: true, 
        message: '', 
        data: {
          todos: todo,
          currentPage: page,
          totalPages: Math.ceil(totalTodos / limit),
          totalTodos: totalTodos
        }
      });
    }
    return res.status(200).send({ success: true, message: 'no todo found', data: { todo: [] }});
  } catch (err) {
    return res.status(500).send({ success: false, message: 'something went wrong. Please try later', error: err });
  }
});


router.post("/create", async (req, res) => {
  const { name, completed = false } = req.body;
  const user = req.user;
  let todo = new Todo({ userId: new mongoose.Types.ObjectId(user.id), name, completed });
  try {
    todo = await todo.save();
    return res.status(201).send({
        success: true,
        message: 'todo created',
        data: {todo}
    });
  } catch (error) {
    return res.status(500).send({
        success: false,
        message: 'something went wrong',
        error: {error}
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
            completed: isCompleted
        },
        { new: true, runValidators: true}
      );
      if (!todo) {
        return res.status(404).json(
          { success: false, 
            message: 'Focus not found' 
          }
        );
      }
      return res.status(200).json({ 
        success: true, 
        message: 'todo updated',
        data: {todo}
      });
    
  } catch (error) {
    return res.status(500).send({
        success: false,
        message: 'something went wrong',
        error
    });
  }
});

router.delete("/remove/:todoId", async (req, res) => {
  const { todoId } = req.params;
  try {
    const todo = await Todo.findByIdAndDelete(new mongoose.Types.ObjectId(todoId));
    if (!todo) {
      return res.status(404).json(
        { success: false, 
          message: 'todo not found' 
        }
      );
    }
    return res.status(200).json({ 
      success: true, 
      message: 'todo deleted',
      data: {todo}
    });
  } catch (error) {
    return res.status(500).send({
        success: false,
        message: 'something went wrong',
        error: {error}
    });
  }
});

module.exports = router;
