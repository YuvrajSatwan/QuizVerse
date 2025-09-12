import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { QuizProvider } from './contexts/QuizContext'
import { ToastProvider } from './contexts/ToastContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import CreateQuiz from './pages/CreateQuiz'
import JoinQuiz from './pages/JoinQuiz'
import QuizRoom from './pages/QuizRoom'
import FirebaseDiagnostic from './components/FirebaseDiagnostic'
import ToastContainer from './components/ToastContainer'

function App() {
  return (
    <Router>
      <AuthProvider>
        <QuizProvider>
          <ToastProvider>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create" element={<CreateQuiz />} />
                <Route path="/join" element={<JoinQuiz />} />
                <Route path="/quiz/:quizId" element={<QuizRoom />} />
                <Route path="/diagnostic" element={<FirebaseDiagnostic />} />
              </Routes>
              <ToastContainer />
            </div>
          </ToastProvider>
        </QuizProvider>
      </AuthProvider>
    </Router>
  )
}

export default App

