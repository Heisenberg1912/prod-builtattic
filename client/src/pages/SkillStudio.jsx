import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const SkillStudio = () => {
  const location = useLocation();
  return <Navigate to="/workspace/studio" replace state={location.state} />;
};

export default SkillStudio;
