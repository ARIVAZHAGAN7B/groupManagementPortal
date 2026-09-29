const sectionService = require("./section.service");

const createSection = async (req, res) => {
  try {
    const data = await sectionService.createSection(req.body || {}, req.user?.userId || null);
    res.status(201).json({
      message: "Section created successfully",
      data
    });
  } catch (error) {
    const status =
      error.message === "Parent team not found" || error.message === "Section not found"
        ? 404
        : 400;
    res.status(status).json({ message: error.message });
  }
};

const getSections = async (req, res) => {
  try {
    const data = await sectionService.getSections(req.query || {});
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getSection = async (req, res) => {
  try {
    const data = await sectionService.getSection(req.params.id);
    res.json(data);
  } catch (error) {
    const status = error.message === "Section not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const updateSection = async (req, res) => {
  try {
    const data = await sectionService.updateSection(req.params.id, req.body || {});
    res.json({
      message: "Section updated successfully",
      data
    });
  } catch (error) {
    const status =
      error.message === "Parent team not found" || error.message === "Section not found"
        ? 404
        : 400;
    res.status(status).json({ message: error.message });
  }
};

const activateSection = async (req, res) => {
  try {
    const data = await sectionService.activateSection(req.params.id);
    res.json({
      message: "Section activated",
      data
    });
  } catch (error) {
    const status = error.message === "Section not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const freezeSection = async (req, res) => {
  try {
    const data = await sectionService.freezeSection(req.params.id);
    res.json({
      message: "Section frozen",
      data
    });
  } catch (error) {
    const status = error.message === "Section not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const archiveSection = async (req, res) => {
  try {
    const data = await sectionService.archiveSection(req.params.id);
    res.json({
      message: "Section archived",
      data
    });
  } catch (error) {
    const status = error.message === "Section not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const deleteSection = async (req, res) => {
  try {
    const data = await sectionService.deleteSection(req.params.id);
    res.json({
      message: "Section set to INACTIVE",
      data
    });
  } catch (error) {
    const status = error.message === "Section not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const getSectionMemberships = async (req, res) => {
  try {
    const data = await sectionService.getSectionMemberships(req.params.id, req.query || {});
    res.json(data);
  } catch (error) {
    const status = error.message === "Section not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const getAllSectionMemberships = async (req, res) => {
  try {
    const data = await sectionService.getAllSectionMemberships(req.query || {});
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getMySectionMemberships = async (req, res) => {
  try {
    const data = await sectionService.getMySectionMemberships(req.user?.userId, req.query || {});
    res.json(data);
  } catch (error) {
    const status = error.message === "Student not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const addSectionMember = async (req, res) => {
  try {
    const data = await sectionService.addSectionMember(
      req.params.id,
      req.body || {},
      req.user?.userId || null
    );
    res.status(201).json({
      message: "Section member added successfully",
      data
    });
  } catch (error) {
    const status = ["Section not found", "Student not found"].includes(error.message) ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const joinSectionAsSelf = async (req, res) => {
  try {
    const data = await sectionService.joinSectionAsSelf(
      req.params.id,
      req.user?.userId,
      req.body || {}
    );
    res.status(201).json({
      message: "Joined section successfully",
      data
    });
  } catch (error) {
    const status = ["Section not found", "Student not found"].includes(error.message) ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const updateSectionMember = async (req, res) => {
  try {
    const data = await sectionService.updateSectionMember(req.params.membershipId, req.body || {});
    res.json({
      message: "Section membership updated successfully",
      data
    });
  } catch (error) {
    const status = error.message === "Section membership not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const leaveSectionMember = async (req, res) => {
  try {
    const data = await sectionService.leaveSectionMember(req.params.membershipId, req.body || {});
    res.json({
      message: "Section membership marked as left",
      data
    });
  } catch (error) {
    const status = error.message === "Section membership not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

module.exports = {
  createSection,
  getSections,
  getSection,
  updateSection,
  activateSection,
  freezeSection,
  archiveSection,
  deleteSection,
  getSectionMemberships,
  getAllSectionMemberships,
  getMySectionMemberships,
  addSectionMember,
  joinSectionAsSelf,
  updateSectionMember,
  leaveSectionMember
};
