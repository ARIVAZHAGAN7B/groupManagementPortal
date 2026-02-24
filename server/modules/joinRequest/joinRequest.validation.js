const Joi = require("joi");

exports.validateApplyRequest = (req, res, next) => {
  const schema = Joi.object({
    group_id: Joi.number().integer().required()
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  next();
};

exports.validateDecision = (req, res, next) => {
  const schema = Joi.object({
    status: Joi.string().valid("APPROVED", "REJECTED").required(),
    decision_reason: Joi.string().min(3).required()
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  next();
};


