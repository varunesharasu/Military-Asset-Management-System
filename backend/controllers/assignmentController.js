// backend/controllers/assignmentController.js
const Assignment = require('../models/Assignment');

const createAssignment = async (req, res) => {
  const { equipmentType, quantity, base, personnel, type } = req.body;
  const assignment = await Assignment.create({ equipmentType, quantity, base, personnel, type });
  res.status(201).json(assignment);
};

const getAssignments = async (req, res) => {
  const { base, equipmentType } = req.query;
  let filter = {};
  if (base) filter.base = base;
  if (equipmentType) filter.equipmentType = equipmentType;
  const assignments = await Assignment.find(filter).sort({ date: -1 });
  res.json(assignments);
};

module.exports = { createAssignment, getAssignments };