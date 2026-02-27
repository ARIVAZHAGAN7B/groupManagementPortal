const Joi = require("joi");

const validateSetTeamTarget = (req, res, next) => {
  const schema = Joi.object({
    target_member_count: Joi.number().integer().min(1).required(),
    notes: Joi.string().allow("").max(255).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  next();
};

module.exports = {
  validateSetTeamTarget
};
