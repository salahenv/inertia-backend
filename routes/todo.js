const express = require("express");
const mongoose = require('mongoose');
const router = express.Router();
const Todo = require("../models/todo");


router.get("/", async (req, res) => {
  const user = req.user;
  try {
    let todo = await Todo.find({ 
      userId: new mongoose.Types.ObjectId(user.id),
    });
    if(todo.length) {
      return res.status(200).send({success: true, message: '', data: {
        todo
      }});
    }
    return res.status(200).send({success: true, message: 'no todo found', data: {todo:[]}});
  } catch (err) {
    return res.status(500).send({success: false, message: 'something went wrong. Please try later', error: err});
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

module.exports = router;
