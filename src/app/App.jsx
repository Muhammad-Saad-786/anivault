import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuthInit } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Shell from "@/components/layout/Shell";
import Spinner from "@/components/ui/Spinner";
// lazy load pages for code splitting

const Home = lazy(() => import("@/pages/Home"));
const Search = lazy(() => import("@/pages/Search"));
const AnimeDetails = lazy(() => import("@/pages/AnimeDetails"));
const Library = lazy(() => import("@/pages/Library"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Stats = lazy(() => import("@/pages/Stats"));
const Wrapped = lazy(() => import("@/pages/Wrapped"));
const Concierge = lazy(() => import("@/pages/Concierge"));
const Seasonal = lazy(() => import("@/pages/Seasonal"));
const Calendar = lazy(() => import("@/pages/Calendar"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Character = lazy(() => import("@/pages/Character"));
const Person = lazy(() => import("@/pages/Person"));
const Studio = lazy(() => import("@/pages/Studio"));
const Watch = lazy(() => import("@/pages/Watch"));
const Lists = lazy(() => import("@/pages/Lists"));
const ListDetail = lazy(() => import("@/pages/ListDetail"));
const UserProfile = lazy(() => import("@/pages/UserProfile"));
const Activity = lazy(() => import("@/pages/Activity"));
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const DMCA = lazy(() => import("@/pages/DMCA"));

function RouteFallback() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

export default function App() {
  useAuthInit(); // mount once

  return (
    <Suspense fallback={<RouteFallback />}>
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
          <Route path="/u/:username" element={<UserProfile />} />
          <Route path="/lists/:id" element={<ListDetail />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/dmca" element={<DMCA />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/library" element={<Library />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/wrapped" element={<Wrapped />} />
            <Route path="/concierge" element={<Concierge />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/lists" element={<Lists />} />
            <Route path="/activity" element={<Activity />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
