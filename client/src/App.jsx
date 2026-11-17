import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Search from './pages/Search';
import TutorDetails from './pages/TutorDetails';
import LearnerDashboard from './pages/LearnerDashboard';
import TutorDashboard from './pages/TutorDashboard';
import TutorProfile from './pages/TutorProfile';
import AdminDashboard from './pages/AdminDashboard';
import PaymentVerify from './pages/PaymentVerify';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/search" element={<Search />} />
        <Route path="/tutors/:id" element={<TutorDetails />} />
        <Route path="/payment/verify" element={<ProtectedRoute roles={['learner']}><PaymentVerify /></ProtectedRoute>} />

        <Route path="/learner/dashboard" element={<ProtectedRoute roles={['learner']}><LearnerDashboard /></ProtectedRoute>} />
        <Route path="/tutor/dashboard" element={<ProtectedRoute roles={['tutor']}><TutorDashboard /></ProtectedRoute>} />
        <Route path="/tutor/profile" element={<ProtectedRoute roles={['tutor']}><TutorProfile /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
