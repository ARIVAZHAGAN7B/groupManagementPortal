const Joi = require("joi");

const validateApplyRequest = (req, res, next) => {
  const schema = Joi.object({
    team_id: Joi.number().integer().required()
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  next();
};

const validateDecision = (req, res, next) => {
  const schema = Joi.object({
    status: Joi.string().valid("APPROVED", "REJECTED").required(),
    decision_reason: Joi.string().allow("").max(255).required()
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  next();
};

module.exports = {
  validateApplyRequest,
  validateDecision
};
