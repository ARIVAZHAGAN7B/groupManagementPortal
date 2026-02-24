const eventService = require("./event.service");

const createEvent = async (req, res) => {
  try {
    const result = await eventService.createEvent(req.body, req.user?.userId || null);
    res.status(201).json({
      message: "Event created successfully",
      ...result
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getEvents = async (_req, res) => {
  try {
    const rows = await eventService.getEvents();
    res.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEvent = async (req, res) => {
  try {
    const row = await eventService.getEvent(req.params.id);
    if (!row) return res.status(404).json({ message: "Event not found" });
    res.json(row);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const result = await eventService.updateEvent(req.params.id, req.body);
    res.json({
      message: "Event updated successfully",
      ...result
    });
  } catch (error) {
    const status = error.message === "Event not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const activateEvent = async (req, res) => {
  try {
    const result = await eventService.activateEvent(req.params.id);
    res.json({ message: "Event activated", ...result });
  } catch (error) {
    const status = error.message === "Event not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const closeEvent = async (req, res) => {
  try {
    const result = await eventService.closeEvent(req.params.id);
    res.json({ message: "Event closed", ...result });
  } catch (error) {
    const status = error.message === "Event not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const archiveEvent = async (req, res) => {
  try {
    const result = await eventService.archiveEvent(req.params.id);
    res.json({ message: "Event archived", ...result });
  } catch (error) {
    const status = error.message === "Event not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const result = await eventService.deleteEvent(req.params.id);
    res.json({ message: "Event set to INACTIVE", ...result });
  } catch (error) {
    const status = error.message === "Event not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  activateEvent,
  closeEvent,
  archiveEvent,
  deleteEvent
};
