import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Questionnaire from './pages/Questionnaire'
import Matches from './pages/Matches'
import PetDetail from './pages/PetDetail'
import MyApplications from './pages/MyApplications'
import ShelterListings from './pages/ShelterListings'
import ShelterApplications from './pages/ShelterApplications'
import ApplicationReview from './pages/ApplicationReview'
import Admin from './pages/Admin'
import InterviewSchedule from './pages/InterviewSchedule';
import ShelterAnalytics from './pages/ShelterAnalytics'
import Notifications from './pages/Notifications'

const HOME = { adopter: '/matches', shelter: '/shelter/listings', admin: '/admin' }
function Home() {
  const { user, loading } = useAuth()
  if (loading) return null
  return <Navigate to={user ? HOME[user.role] : '/login'} replace />
}
const guard = (roles, el) => <ProtectedRoute roles={roles}>{el}</ProtectedRoute>

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/profile" element={guard(['adopter'], <Questionnaire />)} />
        <Route path="/matches" element={guard(['adopter'], <Matches />)} />
        <Route path="/pets/:id" element={guard(['adopter', 'shelter'], <PetDetail />)} />
        <Route path="/my-applications" element={guard(['adopter'], <MyApplications />)} />
        <Route path="/shelter/listings" element={guard(['shelter'], <ShelterListings />)} />
        <Route path="/shelter/applications" element={guard(['shelter'], <ShelterApplications />)} />
        <Route path="/shelter/applications/:id" element={guard(['shelter'], <ApplicationReview />)} />
        <Route path="/admin" element={guard(['admin'], <Admin />)} />
        <Route path="/applications" element={guard(['adopter'], <MyApplications />)} /> 
        <Route path="/interviews" element={guard(['adopter'], <InterviewSchedule />)} />
        <Route path="/analytics" element={guard(['shelter'], <ShelterAnalytics />)} />
        <Route path="/notifications" element={guard(['adopter', 'shelter'], <Notifications />)} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
