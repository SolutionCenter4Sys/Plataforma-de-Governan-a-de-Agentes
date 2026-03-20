import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { foursysTheme } from './theme/foursysTheme';
import { Layout } from './components/Layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { AgentsPage } from './pages/AgentsPage';
import { WorkflowPage } from './pages/WorkflowPage';
import { WorkflowEditorPage } from './pages/WorkflowEditorPage';
import { ChatPage } from './pages/ChatPage';
import { SettingsPage } from './pages/SettingsPage';
import { configApi } from './services/api';

const App: React.FC = () => {
  const [mockMode, setMockMode] = useState(true);

  useEffect(() => {
    configApi.health()
      .then(h => setMockMode(h.mockMode))
      .catch(() => setMockMode(true));
  }, []);

  return (
    <ThemeProvider theme={foursysTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Layout mockMode={mockMode}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/workflow" element={<WorkflowPage />} />
            <Route path="/workflow/editor/:id" element={<WorkflowEditorPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
