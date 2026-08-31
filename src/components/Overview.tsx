import React from 'react';
import { PathologyDashboard } from './Pathology/PathologyDashboard';

export const Overview: React.FC<{ onNewExperimentClick?: () => void }> = () => {
  return <PathologyDashboard initialTab="overview" />;
};

