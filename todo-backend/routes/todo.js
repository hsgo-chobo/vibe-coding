const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');

// 전체 할일 조회
router.get('/', async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 할일 단건 조회
router.get('/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: '할일을 찾을 수 없습니다.' });
    res.json(todo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 할일 생성
router.post('/', async (req, res) => {
  try {
    const todo = new Todo({ title: req.body.title });
    const saved = await todo.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 할일 수정 (title, completed 부분 업데이트 지원)
router.put('/:id', async (req, res) => {
  try {
    const fields = {};
    if (req.body.title !== undefined) fields.title = req.body.title;
    if (req.body.completed !== undefined) fields.completed = req.body.completed;

    const updated = await Todo.findByIdAndUpdate(
      req.params.id,
      fields,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: '할일을 찾을 수 없습니다.' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 할일 삭제
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Todo.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: '할일을 찾을 수 없습니다.' });
    res.json({ message: '삭제되었습니다.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
