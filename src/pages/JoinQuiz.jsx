import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Play, 
  ArrowLeft,
  Users,
  Clock,
  Trophy
} from 'lucide-react'
import { useQuiz } from '../contexts/QuizContext'
import { useToast } from '../contexts/ToastContext'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'

const JoinQuiz = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { joinQuiz } = useQuiz()
  const { success, error } = useToast()
  const nameInputRef = useRef(null)
  
  const [formData, setFormData] = useState({
    quizCode: '',
    playerName: ''
  })
  
  const [isJoining, setIsJoining] = useState(false)

  // Prefill code from query param and focus name for minimal flow
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const code = (params.get('code') || '').toUpperCase()
    if (code && code.length === 6) {
      setFormData((prev) => ({ ...prev, quizCode: code }))
    }
    // Focus name input for quick entry
    if (nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [location.search])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.quizCode.trim() || !formData.playerName.trim()) {
      error('Please fill in all fields')
      return
    }

    setIsJoining(true)
    
    try {
      // Validate quiz code format (should be 6 characters)
      if (formData.quizCode.length !== 6) {
        error('Quiz code must be 6 characters long')
        return
      }

      // Find the quiz by its code (last 6 characters of the ID)
      const quizzesRef = collection(db, 'quizzes')
      const q = query(quizzesRef, where('__name__', '>=', '0'), where('__name__', '<=', 'z'))
      const querySnapshot = await getDocs(q)
      
      let foundQuiz = null
      querySnapshot.forEach((doc) => {
        const quizId = doc.id
        const quizCode = quizId.slice(-6).toUpperCase()
        if (quizCode === formData.quizCode.toUpperCase()) {
          foundQuiz = { id: quizId, ...doc.data() }
        }
      })

      if (!foundQuiz) {
        error('Quiz not found. Please check the code and try again.')
        return
      }

      const playerId = await joinQuiz(foundQuiz.id, formData.playerName)
      
      // Store player info in localStorage
      localStorage.setItem('playerName', formData.playerName)
      localStorage.setItem('playerId', playerId)
      // Clear host flag since this user is joining as a student
      localStorage.removeItem('isQuizHost')
      
      success('Successfully joined quiz!')
      navigate(`/quiz/${foundQuiz.id}`)
    } catch (err) {
      error('Failed to join quiz. Please check the code and try again.')
      console.error(err)
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-50 to-white">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Join Quiz
          </h1>
          <p className="text-gray-600">
            Enter code to join
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Code input only when not provided via link */}
            {!formData.quizCode && (
              <div>
                <input
                  type="text"
                  value={formData.quizCode}
                  onChange={(e) => setFormData({ ...formData, quizCode: e.target.value.toUpperCase() })}
                  className="w-full text-center text-3xl font-mono tracking-widest border-2 border-gray-200 rounded-xl py-4 px-6 focus:border-primary-500 focus:outline-none transition-colors"
                  placeholder="QUIZ CODE"
                  maxLength={6}
                  required
                />
              </div>
            )}

            <div>
              <input
                ref={nameInputRef}
                type="text"
                value={formData.playerName}
                onChange={(e) => setFormData({ ...formData, playerName: e.target.value })}
                className="w-full text-center text-lg border-2 border-gray-200 rounded-xl py-3 px-6 focus:border-primary-500 focus:outline-none transition-colors"
                placeholder="Your Name"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isJoining}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors disabled:opacity-50"
            >
              {isJoining ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Joining...</span>
                </div>
              ) : (
                'Join Quiz'
              )}
            </button>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-6"
        >
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to Home
          </button>
        </motion.div>
      </div>
    </div>
  )
}

export default JoinQuiz

