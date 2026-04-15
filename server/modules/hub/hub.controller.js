const hubService = require("./hub.service");
const { broadcastTeamMembershipChanged } = require("../../realtime/events");

const createHub = async (req, res) => {
  try {
    const result = await hubService.createHub(req.body, req.user?.userId || null);
    res.status(201).json({
      message: "Hub created successfully",
      ...result
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getHubs = async (req, res) => {
  try {
    const data = await hubService.getHubs(req.query || {});
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getHub = async (req, res) => {
  try {
    const hub = await hubService.getHub(req.params.id);
    if (!hub) {
      return res.status(404).json({ message: "Hub not found" });
    }
    res.json(hub);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getHubMemberships = async (req, res) => {
  try {
    const rows = await hubService.getHubMemberships(req.params.id, req.query || {});
    res.json(rows);
  } catch (error) {
    const status = error.message === "Hub not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const getAllHubMemberships = async (req, res) => {
  try {
    const data = await hubService.getAllHubMemberships(req.query || {});
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getMyHubMemberships = async (req, res) => {
  try {
    const data = await hubService.getMyHubMemberships(req.user?.userId, req.query || {});
    res.json(data);
  } catch (error) {
    const status = error.message === "Student not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const joinHubAsSelf = async (req, res) => {
  try {
    const row = await hubService.joinHubAsSelf(req.params.id, req.user?.userId, req.body || {});

    await broadcastTeamMembershipChanged({
      action: "HUB_JOINED",
      studentId: row?.student_id || null,
      teamId: row?.team_id || Number(req.params.id),
      membershipId: row?.team_membership_id || null,
      role: row?.role || "MEMBER"
    });

    res.status(201).json({
      message: "Joined hub successfully",
      data: row
    });
  } catch (error) {
    const status = ["Hub not found", "Student not found"].includes(error.message) ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const updateHubMembership = async (req, res) => {
  try {
    const row = await hubService.updateHubMembership(req.params.membershipId, req.body || {});

    await broadcastTeamMembershipChanged({
      action: "HUB_MEMBERSHIP_UPDATED",
      studentId: row?.student_id || null,
      teamId: row?.team_id || null,
      membershipId: row?.team_membership_id || Number(req.params.membershipId),
      role: row?.role || "MEMBER"
    });

    res.json({
      message: "Hub membership updated successfully",
      data: row
    });
  } catch (error) {
    const status = error.message === "Hub membership not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const leaveHubMembership = async (req, res) => {
  try {
    const row = await hubService.leaveHubMembership(
      req.params.membershipId,
      req.body || {},
      req.user || null
    );

    await broadcastTeamMembershipChanged({
      action: "HUB_MEMBERSHIP_LEFT",
      studentId: row?.student_id || null,
      teamId: row?.team_id || null,
      membershipId: row?.team_membership_id || Number(req.params.membershipId),
      role: row?.role || "MEMBER",
      membershipStatus: row?.status || "LEFT"
    });

    res.json({
      message: "Hub membership marked as left",
      data: row
    });
  } catch (error) {
    const status = error.message === "Hub membership not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const updateHub = async (req, res) => {
  try {
    const result = await hubService.updateHub(req.params.id, req.body || {});
    res.json({
      message: "Hub updated successfully",
      ...result
    });
  } catch (error) {
    const status = error.message === "Hub not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const activateHub = async (req, res) => {
  try {
    const result = await hubService.activateHub(req.params.id);
    res.json({
      message: "Hub activated",
      ...result
    });
  } catch (error) {
    const status = error.message === "Hub not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const freezeHub = async (req, res) => {
  try {
    const result = await hubService.freezeHub(req.params.id);
    res.json({
      message: "Hub frozen",
      ...result
    });
  } catch (error) {
    const status = error.message === "Hub not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const archiveHub = async (req, res) => {
  try {
    const result = await hubService.archiveHub(req.params.id);
    res.json({
      message: "Hub archived",
      ...result
    });
  } catch (error) {
    const status = error.message === "Hub not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const deleteHub = async (req, res) => {
  try {
    const result = await hubService.deleteHub(req.params.id);
    res.json({
      message: "Hub set to INACTIVE",
      ...result
    });
  } catch (error) {
    const status = error.message === "Hub not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

module.exports = {
  createHub,
  getHubs,
  getHub,
  getHubMemberships,
  getAllHubMemberships,
  getMyHubMemberships,
  joinHubAsSelf,
  updateHubMembership,
  leaveHubMembership,
  updateHub,
  activateHub,
  freezeHub,
  archiveHub,
  deleteHub
};
