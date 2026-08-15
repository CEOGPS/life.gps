import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import AIAssistant from "./components/AIAssistant";
import { AuthProvider } from "./lib/auth";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-zinc-950 text-white">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            {/* Add more routes as needed */}
          </Routes>
          <AIAssistant />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
