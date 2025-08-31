const Joi = require("joi")

// User validation schemas
const userSchemas = {
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid("Admin", "BaseCommander", "LogisticsOfficer").required(),
    baseId: Joi.string()
      .hex()
      .length(24)
      .when("role", {
        is: Joi.string().valid("BaseCommander", "LogisticsOfficer"),
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
  }),

  login: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  }),
}

// Purchase validation schema
const purchaseSchema = Joi.object({
  baseId: Joi.string().hex().length(24).required(),
  equipmentId: Joi.string().hex().length(24).required(),
  quantity: Joi.number().positive().required(),
  date: Joi.date().default(Date.now),
})

// Transfer validation schema
const transferSchema = Joi.object({
  fromBaseId: Joi.string().hex().length(24).required(),
  toBaseId: Joi.string().hex().length(24).required(),
  equipmentId: Joi.string().hex().length(24).required(),
  quantity: Joi.number().positive().required(),
  date: Joi.date().default(Date.now),
})

// Assignment validation schema
const assignmentSchema = Joi.object({
  baseId: Joi.string().hex().length(24).required(),
  equipmentId: Joi.string().hex().length(24).required(),
  personnel: Joi.string().min(2).max(100).required(),
  quantity: Joi.number().positive().required(),
  status: Joi.string().valid("Assigned", "Expended").default("Assigned"),
  date: Joi.date().default(Date.now),
})

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body)
    if (error) {
      return res.status(400).json({
        message: "Validation Error",
        details: error.details.map((d) => d.message),
      })
    }
    next()
  }
}

module.exports = {
  validate,
  userSchemas,
  purchaseSchema,
  transferSchema,
  assignmentSchema,
}
