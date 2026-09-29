const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const { authenticate } = require("./middlewares/auth.middleware");
const { getCorsConfig } = require("./config/runtime");

const authRoutes = require("./routes/auth.routes");
const registerRoutes = require("./routes/register.routes");
const groupRoutes = require("./modules/group/group.routes");
const membershipRoutes = require("./modules/membership/membership.routes");
const joinRequestRoutes = require("./modules/joinRequest/joinRequest.routes");
const phaseRoutes = require("./modules/phase/phase.routes");
const eligibilityRoutes = require("./modules/eligibility/eligibility.routes");
const teamRoutes = require("./modules/team/team.routes");
const sectionRoutes = require("./modules/section/section.routes");
const hubRoutes = require("./modules/hub/hub.routes");
const eventRoutes = require("./modules/event/event.routes");
const eventJoinRequestRoutes = require("./modules/eventJoinRequest/eventJoinRequest.routes");
const eventTeamInvitationRoutes = require("./modules/eventTeamInvitation/eventTeamInvitation.routes");
const onDutyRoutes = require("./modules/onDuty/onDuty.routes");
const auditRoutes = require("./modules/audit/audit.routes");
const systemConfigRoutes = require("./modules/systemConfig/systemConfig.routes");
const leadershipRequestRoutes = require("./modules/leadershipRequest/leadershipRequest.routes");
const groupTierRequestRoutes = require("./modules/groupTierRequest/groupTierRequest.routes");
const groupTierChangeRoutes = require("./modules/groupTierChange/groupTierChange.routes");
const teamChangeTierRoutes = require("./modules/teamChangeTier/teamChangeTier.routes");
const teamTargetRoutes = require("./modules/teamTarget/teamTarget.routes");
const groupPointRoutes = require("./modules/groupPoint/groupPoint.routes");
const activityPointsWriteRoutes = require("./modules/activityPointsWrite/activityPointsWrite.routes");
const systemMetricsRoutes = require("./modules/systemMetrics/systemMetrics.routes");
const supportRoutes = require("./modules/support/support.routes");
const compression = require("compression");
const {getProfile} = require("./getProfiles");

const app = express();
app.use(compression());

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(cors(getCorsConfig()));
app.use(
  "/uploads",
  express.static(path.resolve(__dirname, "uploads"), {
    maxAge: "7d",
    etag: true
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/register", registerRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/membership", membershipRoutes);
app.use("/api/join-requests", joinRequestRoutes);
app.use("/api/phases", phaseRoutes);
app.use("/api/eligibility", eligibilityRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/hubs", hubRoutes);
app.use("/api/event-groups", teamRoutes);
app.use("/api/event-join-requests", eventJoinRequestRoutes);
app.use("/api/event-group-join-requests", eventJoinRequestRoutes);
app.use("/api/event-team-invitations", eventTeamInvitationRoutes);
app.use("/api/on-duty", onDutyRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/system-config", systemConfigRoutes);
app.use("/api/leadership-requests", leadershipRequestRoutes);
app.use("/api/group-tier-requests", groupTierRequestRoutes);
app.use("/api/group-tier-change", groupTierChangeRoutes);
app.use("/api/team-change-tier", teamChangeTierRoutes);
app.use("/api/team-targets", teamTargetRoutes);
app.use("/api/group-points", groupPointRoutes);
app.use("/api/activity-points-write", activityPointsWriteRoutes);
app.use("/api/system-metrics", systemMetricsRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/profile", authenticate, getProfile);

// 404 Catch-All for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    method: req.method,
    path: req.originalUrl
  });
});

// Centralized Global Error Handler Middleware
app.use((err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production";
  const statusCode =
    Number.isInteger(err?.status) && err.status >= 400 && err.status < 600
      ? err.status
      : Number.isInteger(err?.statusCode) && err.statusCode >= 400 && err.statusCode < 600
        ? err.statusCode
        : 500;

  console.error(`[Unhandled Error] ${req.method} ${req.originalUrl} - ${err?.message || err}`);
  if (!isProduction && err?.stack) {
    console.error(err.stack);
  }

  if (res.headersSent) {
    return next(err);
  }

  const clientMessage =
    statusCode === 500 && isProduction
      ? "Internal server error"
      : err?.message || "An unexpected error occurred";

  res.status(statusCode).json({
    success: false,
    message: clientMessage,
    ...(isProduction ? {} : { stack: err?.stack, details: err?.details || undefined })
  });
});

module.exports = app;
