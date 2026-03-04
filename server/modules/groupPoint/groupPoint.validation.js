const Joi = require("joi");

const validateRecordGroupPoint = (req, res, next) => {
  const schema = Joi.object({
    student_id: Joi.string().trim().required(),
    group_id: Joi.number().integer().positive().required(),
    membership_id: Joi.number().integer().positive().required(),
    points: Joi.number().integer().required(),
    created_at: Joi.date().iso().optional()
  });

  const { error } = schema.validate(req.body || {});
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  next();
};

const validateGroupPointIdParam = (req, res, next) => {
  const schema = Joi.object({
    groupPointId: Joi.number().integer().positive().required()
  });

  const { error } = schema.validate(req.params || {});
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  next();
};

module.exports = {
  validateRecordGroupPoint,
  validateGroupPointIdParam
};
