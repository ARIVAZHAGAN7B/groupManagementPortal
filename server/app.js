const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { authenticate } = require("./middlewares/auth.middleware");

const authRoutes = require("./routes/auth.routes");
const registerRoutes = require("./routes/register.routes");
const groupRoutes = require("./modules/group/group.routes");
const membershipRoutes = require("./modules/membership/membership.routes");
const joinRequestRoutes = require("./modules/joinRequest/joinRequest.routes");
const phaseRoutes = require("./modules/phase/phase.routes");
const eligibilityRoutes = require("./modules/eligibility/eligibility.routes");
const teamRoutes = require("./modules/team/team.routes");
const eventRoutes = require("./modules/event/event.routes");
const eventJoinRequestRoutes = require("./modules/eventJoinRequest/eventJoinRequest.routes");
const {getProfile} = require("./getProfiles");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173", // your frontend URL
  credentials: true
}) );

// Example Express endpoint



app.use("/api/auth", authRoutes);
app.use("/api/register", registerRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/membership", membershipRoutes);
app.use("/api/join-requests", joinRequestRoutes);
app.use("/api/phases", phaseRoutes);
app.use("/api/eligibility", eligibilityRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/event-join-requests", eventJoinRequestRoutes);
app.use("/api/profile", authenticate, getProfile);

module.exports = app;
