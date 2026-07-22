const service = require("./onDuty.service");

const listRequests = async (req, res) => {
  try {
    const rows = await service.listRequests(req.query || {});
    res.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getMyRequests = async (req, res) => {
  try {
    const data = await service.getMyRequests(req.user || null);
    res.json(data);
  } catch (error) {
    const status = error.message === "Student not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const getTeamRequests = async (req, res) => {
  try {
    const rows = await service.getTeamRequests(req.params.teamId, req.user || null);
    res.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    const status = ["Team not found", "Student not found"].includes(error.message) ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const submitRequest = async (req, res) => {
  try {
    const row = await service.submitRequest(req.params.teamId, req.body || {}, req.user || null);
    res.status(201).json({
      message: "OD request submitted successfully",
      data: row
    });
  } catch (error) {
    const status = ["Team not found", "Student not found", "Event not found"].includes(
      error.message
    )
      ? 404
      : 400;
    res.status(status).json({ message: error.message });
  }
};

const reviewRequest = async (req, res) => {
  try {
    const row = await service.reviewRequest(req.params.id, req.body || {}, req.user || null);
    res.json({
      message: "OD request updated successfully",
      data: row
    });
  } catch (error) {
    const status = error.message === "OD request not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

module.exports = {
  listRequests,
  getMyRequests,
  getTeamRequests,
  submitRequest,
  reviewRequest
};
