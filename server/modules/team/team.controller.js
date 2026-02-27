const teamService = require("./team.service");

const createTeam = async (req, res) => {
  try {
    const result = await teamService.createTeam(req.body, req.user?.userId || null);
    res.status(201).json({
      message: "Team created successfully",
      ...result
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getTeams = async (req, res) => {
  try {
    const rows = await teamService.getTeams(req.query || {});
    res.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTeamsByEvent = async (req, res) => {
  try {
    const rows = await teamService.getTeamsByEvent(req.params.eventId, req.query || {});
    res.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    const status = error.message === "Event not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const getTeam = async (req, res) => {
  try {
    const team = await teamService.getTeam(req.params.id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTeamMemberships = async (req, res) => {
  try {
    const rows = await teamService.getTeamMemberships(req.params.id, req.query);
    res.json(rows);
  } catch (error) {
    const status = error.message === "Team not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const getAllTeamMemberships = async (req, res) => {
  try {
    const rows = await teamService.getAllTeamMemberships(req.query);
    res.json(rows);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getMyTeamMemberships = async (req, res) => {
  try {
    const data = await teamService.getMyTeamMemberships(req.user?.userId, req.query);
    res.json(data);
  } catch (error) {
    const status = error.message === "Student not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const addTeamMember = async (req, res) => {
  try {
    const row = await teamService.addTeamMember(
      req.params.id,
      req.body,
      req.user?.userId || null
    );
    res.status(201).json({
      message: "Team member added successfully",
      data: row
    });
  } catch (error) {
    const status = ["Team not found", "Student not found"].includes(error.message) ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const createTeamInEventByStudent = async (req, res) => {
  try {
    const result = await teamService.createTeamInEventByStudent(
      req.params.eventId,
      req.body,
      req.user?.userId
    );
    res.status(201).json({
      message: "Event group created successfully",
      data: result
    });
  } catch (error) {
    const status = ["Event not found", "Student not found"].includes(error.message) ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const joinTeamAsSelf = async (req, res) => {
  try {
    const row = await teamService.joinTeamAsSelf(
      req.params.id,
      req.user?.userId,
      req.body || {}
    );
    res.status(201).json({
      message: "Joined team successfully",
      data: row
    });
  } catch (error) {
    const status = ["Team not found", "Student not found"].includes(error.message) ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const updateTeamMember = async (req, res) => {
  try {
    const row = await teamService.updateTeamMember(req.params.membershipId, req.body);
    res.json({
      message: "Team membership updated successfully",
      data: row
    });
  } catch (error) {
    const status = error.message === "Team membership not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const leaveTeamMember = async (req, res) => {
  try {
    const row = await teamService.leaveTeamMember(req.params.membershipId, req.body);
    res.json({
      message: "Team membership marked as left",
      data: row
    });
  } catch (error) {
    const status = error.message === "Team membership not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const updateTeam = async (req, res) => {
  try {
    const result = await teamService.updateTeam(req.params.id, req.body);
    res.json({
      message: "Team updated successfully",
      ...result
    });
  } catch (error) {
    const status = error.message === "Team not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const activateTeam = async (req, res) => {
  try {
    const result = await teamService.activateTeam(req.params.id);
    res.json({
      message: "Team activated",
      ...result
    });
  } catch (error) {
    const status = error.message === "Team not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const freezeTeam = async (req, res) => {
  try {
    const result = await teamService.freezeTeam(req.params.id);
    res.json({
      message: "Team frozen",
      ...result
    });
  } catch (error) {
    const status = error.message === "Team not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const archiveTeam = async (req, res) => {
  try {
    const result = await teamService.archiveTeam(req.params.id);
    res.json({
      message: "Team archived",
      ...result
    });
  } catch (error) {
    const status = error.message === "Team not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const deleteTeam = async (req, res) => {
  try {
    const result = await teamService.deleteTeam(req.params.id);
    res.json({
      message: "Team set to INACTIVE",
      ...result
    });
  } catch (error) {
    const status = error.message === "Team not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

module.exports = {
  createTeam,
  getTeams,
  getTeamsByEvent,
  getTeam,
  getTeamMemberships,
  getAllTeamMemberships,
  getMyTeamMemberships,
  addTeamMember,
  createTeamInEventByStudent,
  joinTeamAsSelf,
  updateTeamMember,
  leaveTeamMember,
  updateTeam,
  activateTeam,
  freezeTeam,
  archiveTeam,
  deleteTeam
};
