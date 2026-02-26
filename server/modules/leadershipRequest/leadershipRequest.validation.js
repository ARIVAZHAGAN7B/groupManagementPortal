const Joi = require("joi");

const LEADERSHIP_ROLES = ["CAPTAIN", "VICE_CAPTAIN", "STRATEGIST", "MANAGER"];

exports.validateApplyLeadershipRoleRequest = (req, res, next) => {
  const schema = Joi.object({
    group_id: Joi.number().integer().required(),
    requested_role: Joi.string()
      .valid(...LEADERSHIP_ROLES)
      .required(),
    request_reason: Joi.string().trim().max(255).allow("", null).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  next();
};

exports.validateLeadershipRoleDecision = (req, res, next) => {
  const schema = Joi.object({
    status: Joi.string().valid("APPROVED", "REJECTED").required(),
    decision_reason: Joi.string().trim().min(3).max(255).required()
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  next();
};

