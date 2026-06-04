import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import Account from "./pages/Account";


function App() {
  return (
  <BrowserRouter>
    <Routes>
      <Route index element={<Home />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/account/:pathname" element={<Auth />} />
      <Route path="/account/:pathname" element={<Account />} />



    </Routes>
  </BrowserRouter>
  );
}
export default App;
