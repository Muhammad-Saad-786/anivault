import { Routes, Route } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import Home from "@/pages/Home";
import Search from "@/pages/Search";
import AnimeDetails from "@/pages/AnimeDetails";
import Library from "@/pages/Library";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import NotFound from "@/pages/NotFound";
import { useAuthInit } from "@/hooks/useAuth";
import Dashboard from "@/pages/Dashboard";
import Stats from "@/pages/Stats";
import Wrapped from "@/pages/Wrapped";
import Concierge from "@/pages/Concierge";
import Seasonal from "@/pages/Seasonal";
import Calendar from "@/pages/Calendar";
import Notifications from "@/pages/Notifications";
import Character from "@/pages/Character";
import Person from "@/pages/Person";
import Studio from "@/pages/Studio";
import Watch from "@/pages/Watch";

export default function App() {
  useAuthInit(); // mount once

  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/anime/:id" element={<AnimeDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/seasonal" element={<Seasonal />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/character/:id" element={<Character />} />
        <Route path="/person/:id" element={<Person />} />
        <Route path="/studio/:id" element={<Studio />} />
        <Route path="/watch/:animeId/:episode" element={<Watch />} />
        <Route path="/watch/:animeId" element={<Watch />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/library" element={<Library />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/wrapped" element={<Wrapped />} />
          <Route path="/concierge" element={<Concierge />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
