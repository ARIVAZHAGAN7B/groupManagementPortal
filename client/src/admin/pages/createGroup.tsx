import React from "react";
import { Navigate } from "react-router-dom";

export default function CreateGroupLegacyRoute() {
  return <Navigate to="/groups/new" replace />;
}
