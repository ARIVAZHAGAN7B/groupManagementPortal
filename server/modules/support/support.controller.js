const supportService = require('./support.service');

const chat = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required and cannot be empty.'
      });
    }

    const result = await supportService.generateResponse(req.user, message.trim(), history || []);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[SupportController] Error in chat endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process support request.',
      error: error.message
    });
  }
};

const getSuggestions = async (req, res) => {
  try {
    const userContext = await supportService.getUserContext(req.user);
    const suggestions = supportService.getSuggestionsForUser(userContext);
    return res.status(200).json({
      success: true,
      suggestions,
      role: userContext.role,
      name: userContext.name
    });
  } catch (error) {
    console.error('[SupportController] Error in suggestions endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch suggestions.'
    });
  }
};

module.exports = {
  chat,
  getSuggestions
};
