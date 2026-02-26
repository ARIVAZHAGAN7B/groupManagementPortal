const Joi = require("joi");

const validateRecordBasePoints = (req, res, next) => {
  const schema = Joi.object({
    student_id: Joi.string().trim().required(),
    points: Joi.number().integer().required(),
    reason: Joi.string().trim().min(3).max(255).required(),
    activity_date: Joi.date().iso().optional(),
    activity_at: Joi.date().iso().optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  next();
};

const validateEvaluatePhase = (req, res, next) => {
  const schema = Joi.object({
    phase_id: Joi.string().trim().required()
  });

  const { error } = schema.validate(req.params);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  next();
};

const validateStudentIdParam = (req, res, next) => {
  const schema = Joi.object({
    student_id: Joi.string().trim().required()
  });

  const { error } = schema.validate(req.params);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  next();
};

const validateOverrideIndividualEligibility = (req, res, next) => {
  const schema = Joi.object({
    phase_id: Joi.string().trim().required(),
    student_id: Joi.string().trim().required()
  });

  const bodySchema = Joi.object({
    is_eligible: Joi.boolean().required(),
    reason_code: Joi.string().trim().min(3).max(50).required()
  });

  const { error } = schema.validate(req.params);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const bodyResult = bodySchema.validate(req.body);
  if (bodyResult.error) {
    return res.status(400).json({ message: bodyResult.error.details[0].message });
  }

  next();
};

const validateOverrideGroupEligibility = (req, res, next) => {
  const schema = Joi.object({
    phase_id: Joi.string().trim().required(),
    group_id: Joi.number().integer().required()
  });

  const bodySchema = Joi.object({
    is_eligible: Joi.boolean().required(),
    reason_code: Joi.string().trim().min(3).max(50).required()
  });

  const { error } = schema.validate(req.params);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const bodyResult = bodySchema.validate(req.body);
  if (bodyResult.error) {
    return res.status(400).json({ message: bodyResult.error.details[0].message });
  }

  next();
};

module.exports = {
  validateRecordBasePoints,
  validateEvaluatePhase,
  validateStudentIdParam,
  validateOverrideIndividualEligibility,
  validateOverrideGroupEligibility
};
