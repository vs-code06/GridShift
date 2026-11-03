import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Overview from './pages/Overview';
import WorkloadExplorer from './pages/WorkloadExplorer';
import Simulation from './pages/Simulation';
import Forecast from './pages/Forecast';
import ModelComparison from './pages/ModelComparison';
import Experiments from './pages/Experiments';
import JobDetails from './pages/JobDetails';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Overview />} />
        <Route path="/workload" element={<WorkloadExplorer />} />
        <Route path="/models" element={<ModelComparison />} />
        <Route path="/forecast" element={<Forecast />} />
        <Route path="/simulation" element={<Simulation />} />
        <Route path="/experiments" element={<Experiments />} />
        <Route path="/jobs" element={<JobDetails />} />
      </Route>
    </Routes>
  );
}

