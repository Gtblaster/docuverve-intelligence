import { Routes, Route, useParams } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Dashboard from './pages/Dashboard';
import Workspace from './pages/Workspace';

function WorkspaceRoute() {
  const { toolId } = useParams();
  return <Workspace key={toolId} />;
}

export default function App() {
  return (
    <div className="min-h-screen bg-[#0a0a14] flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workspace/:toolId" element={<WorkspaceRoute />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
