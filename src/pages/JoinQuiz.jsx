import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const { joinQuiz } = useQuiz()
  const { success, error } = useToast()
  
  const [formData, setFormData] = useState({
    quizCode: '',
    playerName: ''
  })
  
  const [isJoining, setIsJoining] = useState(false)

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

      await joinQuiz(foundQuiz.id, formData.playerName)
      
      // Store player name in localStorage for host detection
      localStorage.setItem('playerName', formData.playerName)
      
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
    <div className="min-h-screen pt-20 px-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/')}
            className="btn btn-ghost mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Join Quiz
          </h1>
          <p className="text-xl text-gray-600">
            Enter the quiz code to join an interactive quiz session
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Code *
              </label>
              <input
                type="text"
                value={formData.quizCode}
                onChange={(e) => setFormData({ ...formData, quizCode: e.target.value.toUpperCase() })}
                className="input text-center text-2xl font-mono tracking-wider"
                placeholder="Enter 6-digit code"
                maxLength={6}
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                Enter the 6-digit code provided by the quiz host
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name *
              </label>
              <input
                type="text"
                value={formData.playerName}
                onChange={(e) => setFormData({ ...formData, playerName: e.target.value })}
                className="input"
                placeholder="Enter your name"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isJoining}
              className="btn btn-secondary w-full text-lg py-4"
            >
              {isJoining ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Joining Quiz...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Join Quiz</span>
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Join Anywhere
            </h3>
            <p className="text-gray-600">
              Join quizzes from any device with just a code
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mb-4">
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Real-time Updates
            </h3>
            <p className="text-gray-600">
              See questions and results as they happen
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
              <Trophy className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Live Leaderboard
            </h3>
            <p className="text-gray-600">
              Compete with other players in real-time
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default JoinQuiz

