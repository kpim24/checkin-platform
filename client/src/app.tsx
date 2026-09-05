import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import NotFound from './pages/NotFound/NotFound';
import CheckinPage from './pages/CheckinPage/CheckinPage';
import ChatPage from './pages/ChatPage/ChatPage';
import LeaderboardPage from './pages/LeaderboardPage/LeaderboardPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import AdminPage from './pages/AdminPage/AdminPage';

const RoutesComponent = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<CheckinPage />} />
        <Route path="checkin" element={<CheckinPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default RoutesComponent;
