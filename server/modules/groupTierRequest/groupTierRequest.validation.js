const Joi = require("joi");

const VALID_TIERS = ["A", "B", "C", "D"];

exports.validateApplyTierChangeRequest = (req, res, next) => {
  const schema = Joi.object({
    group_id: Joi.number().integer().required(),
    requested_tier: Joi.string().valid(...VALID_TIERS).required(),
    request_reason: Joi.string().trim().max(255).allow("", null).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  next();
};

exports.validateTierChangeDecision = (req, res, next) => {
  const schema = Joi.object({
    status: Joi.string().valid("APPROVED", "REJECTED").required(),
    decision_reason: Joi.string().trim().min(3).max(255).required()
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  next();
};

