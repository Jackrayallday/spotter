import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import Navbar from "./components/layout/Navbar";
import { NeonAuthUIProvider } from "@neondatabase/neon-js/auth/react";
import { authClient } from "./lib/auth";
import AuthProvider from "./context/AuthContext";
import RequireAuth from "./components/auth/RequireAuth";

function AppRoutes() {
  const navigate = useNavigate();

  return (
    <NeonAuthUIProvider
      authClient={authClient}
      defaultTheme="dark"
      redirectTo="/onboarding"
      navigate={(path) => navigate(path)}
      replace={(path) => navigate(path, { replace: true })}
    >
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route index element={<Home />} />
              <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
              <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
              <Route path="/auth/:pathname" element={<Auth />} />
              <Route path="/account/:pathname" element={<RequireAuth><Account /></RequireAuth>} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </NeonAuthUIProvider>
  );
}

function App() {
  return <BrowserRouter><AppRoutes /></BrowserRouter>;
}

export default App;
