import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, 
  Users, 
  Trophy, 
  ArrowLeft,
  CheckCircle,
  Play,
  Eye,
  BarChart3,
  Settings,
  MoreVertical,
  Pause,
  RotateCcw
} from 'lucide-react'
import { useQuiz } from '../contexts/QuizContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useQuizStatistics } from '../hooks/useQuizStatistics'
import { doc, getDoc, onSnapshot, updateDoc, collection } from 'firebase/firestore'
import { db } from '../firebase/config'
import QuizDashboard from '../components/charts/QuizDashboard'

const QuizRoom = () => {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { calculateLeaderboard, submitAnswer: submitAnswerToContext, players: contextPlayers, leaderboard: contextLeaderboard } = useQuiz()
  const { success, error } = useToast()
  
  // Core State
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isHost, setIsHost] = useState(false)
  
  // Quiz Flow State
  const [quizState, setQuizState] = useState('waiting') // waiting, active, finished
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  
  // Player State
  const [players, setPlayers] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [playerAnswers, setPlayerAnswers] = useState({})
  
  // Dashboard State
  const [showDashboard, setShowDashboard] = useState(true)
  
  // User Interaction State
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [timer, setTimer] = useState(30)
  const [playerId, setPlayerId] = useState('')
  const [showHostMenu, setShowHostMenu] = useState(false)
  const [showStatsToPlayers, setShowStatsToPlayers] = useState(false)
  
  // Real-time quiz statistics (after currentQuestionIndex is declared)
  const {
    answerStats: statsAnswerStats,
    leaderboard: statsLeaderboard,
    loading: statsLoading,
    error: statsError,
    participationRate,
    accuracyRate,
    totalAnswers
  } = useQuizStatistics(quizId, currentQuestionIndex)

  // Initialize Quiz Room
  useEffect(() => {
    const initializeQuizRoom = async () => {
      try {
        console.log('🎯 Initializing Quiz Room:', quizId)
        
        // Load quiz data
        const quizDoc = await getDoc(doc(db, 'quizzes', quizId))
        if (!quizDoc.exists()) {
          error('Quiz not found')
          navigate('/')
          return
        }

        const quizData = quizDoc.data()
        setQuiz(quizData)
        
        // Determine user role
        const storedHostQuizId = localStorage.getItem('isQuizHost')
        const storedPlayerId = localStorage.getItem('playerId')
        
        const userIsHost = storedHostQuizId === quizId
        setIsHost(userIsHost)
        setPlayerId(storedPlayerId || '')
        
        console.log(`👤 User Role: ${userIsHost ? 'HOST' : 'PLAYER'}`)
        
        // Set initial quiz state
        setQuizState(quizData.status || 'waiting')
        setCurrentQuestionIndex(quizData.currentQuestion || 0)
        setShowResults(quizData.showResults || false)
        setShowLeaderboard(quizData.showLeaderboard || false)
        
        // Load player data
        await loadPlayers()
        
        setLoading(false)
      } catch (err) {
        console.error('❌ Failed to initialize quiz room:', err)
        error('Failed to load quiz')
        navigate('/')
      }
    }

    initializeQuizRoom()
  }, [quizId])

  // Real-time Quiz Updates
  useEffect(() => {
    if (!quiz) return

    console.log('🔄 Setting up real-time listeners')
    
    const unsubscribeQuiz = onSnapshot(
      doc(db, 'quizzes', quizId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data()
          
          // Update quiz state
          const newState = data.status || 'waiting'
          const newQuestionIndex = data.currentQuestion || 0
          const newShowResults = data.showResults || false
          const newShowLeaderboard = data.showLeaderboard || false
          
          // Reset answer state when question changes
          if (newQuestionIndex !== currentQuestionIndex) {
            setSelectedAnswer(null)
            setHasAnswered(false)
            setTimer(30)
            // Refresh leaderboard when question changes to ensure consistency
            setTimeout(() => loadPlayers(), 1000)
          }
          
          // Reset timer when quiz becomes active or results are hidden
          if ((newState === 'active' && quizState !== 'active') || 
              (showResults && !newShowResults)) {
            setTimer(30)
          }
          
          // Refresh leaderboard when results are shown to ensure consistency
          if (newShowResults && !showResults) {
            setTimeout(() => loadPlayers(), 500)
          }
          
          setQuizState(newState)
          setCurrentQuestionIndex(newQuestionIndex)
          setShowResults(newShowResults)
          setShowLeaderboard(newShowLeaderboard)
          
          console.log(`📊 Quiz Updated: ${newState}, Q${newQuestionIndex + 1}, Results: ${newShowResults}`)
        }
      },
      (err) => console.warn('🌐 Quiz sync error:', err.message)
    )

    return () => unsubscribeQuiz()
  }, [quiz, quizId, currentQuestionIndex, quizState, showResults])
  
  // Real-time Players/Leaderboard Updates
  useEffect(() => {
    if (!quiz || quizState === 'waiting') return

    console.log('👥 Setting up real-time player listeners')
    
    // Listen for changes in the players collection
    const unsubscribePlayers = onSnapshot(
      collection(db, `quizzes/${quizId}/players`),
      (snapshot) => {
        console.log('📊 Players collection updated')
        // Refresh leaderboard when player data changes
        loadPlayers()
      },
      (err) => console.warn('👥 Player sync error:', err.message)
    )

    return () => unsubscribePlayers()
  }, [quiz, quizId, quizState])

  // Timer Logic
  useEffect(() => {
    if (quizState === 'active' && !showResults && !hasAnswered && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1)
      }, 1000)
      
      return () => clearInterval(interval)
    }
    
    // Auto-submit for players when timer reaches 0
    if (!isHost && timer === 0 && !hasAnswered && quizState === 'active' && !showResults) {
      setHasAnswered(true)
      if (selectedAnswer !== null) {
        // Submit the selected answer
        submitAnswer()
      }
    }
  }, [timer, quizState, showResults, hasAnswered, isHost, selectedAnswer])
  
  // Close host menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showHostMenu && !event.target.closest('.host-menu-container')) {
        setShowHostMenu(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showHostMenu])

  // Load Players Data
  const loadPlayers = async () => {
    try {
      const leaderboardData = await calculateLeaderboard(quizId)
      if (leaderboardData) {
        setLeaderboard(leaderboardData)
        setPlayers(leaderboardData) // Players are same as leaderboard entries
      }
    } catch (err) {
      console.error('Failed to load players:', err)
    }
  }

  // HOST FUNCTIONS
  const startQuiz = async () => {
    if (!isHost) return
    
    try {
      await updateDoc(doc(db, 'quizzes', quizId), {
        status: 'active',
        currentQuestion: 0,
        showResults: false,
        showLeaderboard: false,
        startedAt: new Date().toISOString()
      })
      success('Quiz started!')
      console.log('▶️ Quiz started by host')
    } catch (err) {
      console.error('Failed to start quiz:', err)
      error('Failed to start quiz')
    }
  }

  const showQuestionResults = async () => {
    if (!isHost) return
    
    try {
      await updateDoc(doc(db, 'quizzes', quizId), {
        showResults: true
      })
      console.log('👁️ Results shown by host')
    } catch (err) {
      console.error('Failed to show results:', err)
      error('Failed to show results')
    }
  }

  const nextQuestion = async () => {
    if (!isHost) return
    
    try {
      const nextIndex = currentQuestionIndex + 1
      
      if (nextIndex < quiz.questions.length) {
        // Move to next question
        await updateDoc(doc(db, 'quizzes', quizId), {
          currentQuestion: nextIndex,
          showResults: false
        })
        console.log(`➡️ Moved to question ${nextIndex + 1}`)
      } else {
        // Finish quiz
        await updateDoc(doc(db, 'quizzes', quizId), {
          status: 'finished',
          showResults: false,
          endedAt: new Date().toISOString()
        })
        success('Quiz completed!')
        console.log('🏁 Quiz finished by host')
      }
    } catch (err) {
      console.error('Failed to advance quiz:', err)
      error('Failed to advance quiz')
    }
  }

  const showFinalLeaderboard = async () => {
    if (!isHost) return
    
    try {
      await updateDoc(doc(db, 'quizzes', quizId), {
        showLeaderboard: true
      })
      await loadPlayers() // Refresh leaderboard
      console.log('🏆 Final leaderboard shown')
    } catch (err) {
      console.error('Failed to show leaderboard:', err)
      error('Failed to show leaderboard')
    }
  }

  // PLAYER FUNCTIONS
  const submitAnswer = async () => {
    if (selectedAnswer === null || hasAnswered || !playerId) {
      if (!playerId) error('Player ID not found. Please rejoin the quiz.')
      return
    }
    
    try {
      const currentQuestion = quiz.questions[currentQuestionIndex]
      const isCorrect = selectedAnswer === currentQuestion.correctAnswer
      const timeBonus = Math.max(0, Math.floor(timer / 2))
      const totalScore = isCorrect ? 100 + timeBonus : 0
      
      // Submit answer to Firebase
      await submitAnswerToContext(quizId, playerId, currentQuestionIndex, selectedAnswer, isCorrect, timeBonus)
      
      setHasAnswered(true)
      
      if (isCorrect) {
        success(`Correct! +${totalScore} points`)
      } else {
        success('Answer submitted!')
      }
      
      console.log(`✅ Answer submitted: ${selectedAnswer}, Correct: ${isCorrect}, Score: ${totalScore}`)
      
      // Refresh leaderboard after answer submission
      await loadPlayers()
    } catch (err) {
      console.error('Failed to submit answer:', err)
      error('Failed to submit answer')
      setHasAnswered(false)
    }
  }

  // RENDER HELPERS
  const renderWaitingScreen = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-8 text-center"
    >
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Users className="w-10 h-10 text-blue-600" />
      </div>
      
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        {isHost ? 'Ready to Start?' : 'Waiting for Host'}
      </h2>
      
      <p className="text-xl text-gray-600 mb-8">
        {isHost 
          ? 'Click start when all players have joined'
          : 'The quiz will begin when the host starts it'
        }
      </p>
      
      <div className="text-sm text-gray-500 mb-6">
        Players Online: {players.length} | You are: {isHost ? 'Host' : 'Player'}
      </div>
      
      {isHost && (
        <button
          onClick={startQuiz}
          className="btn btn-primary text-lg px-8 py-4"
        >
          <Play className="w-5 h-5" />
          Start Quiz
        </button>
      )}
    </motion.div>
  )

  const renderActiveQuestion = () => {
    const currentQuestion = quiz.questions[currentQuestionIndex]
    
    return (
      <motion.div
        key={currentQuestionIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="card p-8"
      >
        {/* Question Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-primary-600">
              {currentQuestionIndex + 1}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </h2>
        </div>

        {/* Question Text */}
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-gray-900 leading-relaxed">
            {currentQuestion.text}
          </h3>
          
          {/* Prominent Timer for Players */}
          {!isHost && quizState === 'active' && !showResults && (
            <div className="mt-6 flex justify-center">
              {!hasAnswered ? (
                <div className={`inline-flex items-center space-x-2 px-6 py-3 rounded-full font-bold text-xl ${
                  timer <= 0 ? 'bg-red-200 text-red-800' :
                  timer <= 5 ? 'bg-red-100 text-red-700 animate-pulse' : 
                  timer <= 10 ? 'bg-yellow-100 text-yellow-700' : 
                  'bg-blue-100 text-blue-700'
                }`}>
                  <Clock className="w-6 h-6" />
                  <span>{timer <= 0 ? 'Time\'s up!' : `${timer}s remaining`}</span>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-2 px-6 py-3 rounded-full font-bold text-xl bg-green-100 text-green-700">
                  <CheckCircle className="w-6 h-6" />
                  <span>Answer submitted!</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Answer Options */}
        {currentQuestion.type === 'mcq' && (
          <div className="space-y-4 mb-8">
            {currentQuestion.options.map((option, index) => {
              // Only show stats to host OR to players if host has enabled stats visibility AND results are shown
              const shouldShowStats = isHost || (showStatsToPlayers && showResults)
              const totalResponses = shouldShowStats ? Object.values(statsAnswerStats || {}).reduce((sum, count) => sum + count, 0) : 0
              const optionCount = shouldShowStats ? (statsAnswerStats ? (statsAnswerStats[index] || 0) : 0) : 0
              const percentage = shouldShowStats && totalResponses > 0 ? Math.round((optionCount / totalResponses) * 100) : 0
              
              // Color scheme for percentage bars
              const colors = [
                'from-blue-500 to-blue-600',
                'from-purple-500 to-purple-600', 
                'from-pink-500 to-pink-600',
                'from-green-500 to-green-600',
                'from-orange-500 to-orange-600',
                'from-red-500 to-red-600',
              ]
              
              const correctColor = 'from-emerald-500 to-emerald-600'
              const isCorrectAnswer = showResults && index === currentQuestion.correctAnswer
              const barColor = isCorrectAnswer ? correctColor : colors[index % colors.length]
              
              return (
                <motion.button
                  key={index}
                  whileHover={{ scale: isHost ? 1 : 1.02 }}
                  whileTap={{ scale: isHost ? 1 : 0.98 }}
                  onClick={() => !isHost && !hasAnswered && setSelectedAnswer(index)}
                  disabled={isHost || hasAnswered}
                  className={`relative w-full rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                    selectedAnswer === index && !isHost
                      ? 'border-primary-500 shadow-lg shadow-primary-200/50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${
                    isCorrectAnswer
                      ? 'border-emerald-300 shadow-lg shadow-emerald-200/50'
                      : ''
                  } ${
                    showResults && selectedAnswer === index && index !== currentQuestion.correctAnswer
                      ? 'border-red-300 shadow-lg shadow-red-200/50'
                      : ''
                  } ${
                    isHost ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  {/* Background percentage fill bar - only show when results should be visible */}
                  {shouldShowStats && showResults && totalResponses > 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: index * 0.1 + 0.3, duration: 1.2, ease: "easeOut" }}
                      className={`absolute inset-y-0 left-0 bg-gradient-to-r ${barColor} opacity-20`}
                    />
                  )}
                  
                  {/* Content */}
                  <div className="relative z-10 flex items-center justify-between p-4 min-h-[70px]">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm ${
                        selectedAnswer === index && !isHost
                          ? 'border-primary-500 bg-primary-500 text-white'
                          : isCorrectAnswer
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-gray-300 bg-white text-gray-700'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className={`text-lg font-medium flex-1 text-left ${
                        isCorrectAnswer ? 'text-emerald-800 font-semibold' : 'text-gray-900'
                      }`}>
                        {option}
                      </span>
                    </div>
                    
                    {/* Show percentage and count when results should be visible */}
                    {shouldShowStats && showResults && totalResponses > 0 && (
                      <div className="flex items-center space-x-3">
                        {isCorrectAnswer && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 + 0.5, type: "spring", stiffness: 300 }}
                          >
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          </motion.div>
                        )}
                        
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.7, duration: 0.3 }}
                          className="text-right"
                        >
                          <div className={`text-xl font-bold ${
                            isCorrectAnswer ? 'text-emerald-700' : 'text-gray-800'
                          }`}>
                            {percentage}%
                          </div>
                          <div className={`text-xs ${
                            isCorrectAnswer ? 'text-emerald-600' : 'text-gray-600'
                          }`}>
                            ({optionCount} votes)
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}

        {/* True/False Questions */}
        {currentQuestion.type === 'truefalse' && (
          <div className="grid grid-cols-2 gap-6 mb-8">
            {['True', 'False'].map((option, index) => {
              // Only show stats to host OR to players if host has enabled stats visibility AND results are shown
              const shouldShowStats = isHost || (showStatsToPlayers && showResults)
              const totalResponses = shouldShowStats ? Object.values(statsAnswerStats || {}).reduce((sum, count) => sum + count, 0) : 0
              const optionCount = shouldShowStats ? (statsAnswerStats ? (statsAnswerStats[index] || 0) : 0) : 0
              const percentage = shouldShowStats && totalResponses > 0 ? Math.round((optionCount / totalResponses) * 100) : 0
              
              const correctColor = 'from-emerald-500 to-emerald-600'
              const falseColor = 'from-red-500 to-red-600'
              const trueColor = 'from-blue-500 to-blue-600'
              const isCorrectAnswer = showResults && index === currentQuestion.correctAnswer
              const barColor = isCorrectAnswer ? correctColor : (index === 0 ? trueColor : falseColor)
              
              return (
                <motion.button
                  key={index}
                  whileHover={{ scale: isHost ? 1 : 1.02 }}
                  whileTap={{ scale: isHost ? 1 : 0.98 }}
                  onClick={() => !isHost && !hasAnswered && setSelectedAnswer(index)}
                  disabled={isHost || hasAnswered}
                  className={`relative rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                    selectedAnswer === index && !isHost
                      ? 'border-primary-500 shadow-lg shadow-primary-200/50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${
                    isCorrectAnswer
                      ? 'border-emerald-300 shadow-lg shadow-emerald-200/50'
                      : ''
                  } ${
                    showResults && selectedAnswer === index && index !== currentQuestion.correctAnswer
                      ? 'border-red-300 shadow-lg shadow-red-200/50'
                      : ''
                  } ${
                    isHost ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  {/* Background percentage fill bar */}
                  {shouldShowStats && showResults && totalResponses > 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: index * 0.2 + 0.3, duration: 1.2, ease: "easeOut" }}
                      className={`absolute inset-y-0 left-0 bg-gradient-to-r ${barColor} opacity-20`}
                    />
                  )}
                  
                  {/* Content */}
                  <div className="relative z-10 p-6 min-h-[120px] flex flex-col items-center justify-center">
                    <span className={`text-2xl font-bold mb-2 ${
                      isCorrectAnswer ? 'text-emerald-700' : 'text-gray-900'
                    }`}>
                      {option}
                    </span>
                    
                    {shouldShowStats && showResults && totalResponses > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.2 + 0.7, duration: 0.3 }}
                        className="flex items-center space-x-2"
                      >
                        {isCorrectAnswer && (
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        )}
                        <span className={`text-lg font-bold ${
                          isCorrectAnswer ? 'text-emerald-700' : 'text-gray-700'
                        }`}>
                          {percentage}%
                        </span>
                        <span className={`text-sm ${
                          isCorrectAnswer ? 'text-emerald-600' : 'text-gray-600'
                        }`}>
                          ({optionCount})
                        </span>
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          {isHost ? (
            // Host Controls
            <div className="space-x-4">
              {!showResults && (
                <button
                  onClick={showQuestionResults}
                  className="btn btn-secondary text-lg px-6 py-3"
                >
                  <Eye className="w-5 h-5" />
                  Show Results
                </button>
              )}
              
              {showResults && (
                <button
                  onClick={nextQuestion}
                  className="btn btn-primary text-lg px-6 py-3"
                >
                  <Play className="w-5 h-5" />
                  {currentQuestionIndex < quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                </button>
              )}
            </div>
          ) : (
            // Player Controls
            <div>
              {!hasAnswered && !showResults && (
                <button
                  onClick={submitAnswer}
                  disabled={selectedAnswer === null}
                  className="btn btn-primary text-lg px-8 py-4 disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5" />
                  Submit Answer
                </button>
              )}
              
              {hasAnswered && !showResults && (
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600 mb-2">
                    ✅ Answer Submitted
                  </div>
                  <p className="text-gray-600">Waiting for host to show results...</p>
                </div>
              )}
              
              {showResults && (
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600 mb-2">
                    📊 Results Revealed
                  </div>
                  <p className="text-gray-600">Waiting for next question...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  const renderFinishedScreen = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-8 text-center"
    >
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Trophy className="w-10 h-10 text-green-600" />
      </div>
      
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Quiz Completed! 🎉
      </h2>
      
      <p className="text-xl text-gray-600 mb-8">
        {isHost ? 'All questions completed!' : 'Thanks for participating!'}
      </p>
      
      {isHost && !showLeaderboard && (
        <button
          onClick={showFinalLeaderboard}
          className="btn btn-primary text-lg px-8 py-4"
        >
          <BarChart3 className="w-5 h-5" />
          Show Final Results
        </button>
      )}
      
      {showLeaderboard && leaderboard.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">🏆 Final Leaderboard</h3>
          <div className="space-y-3">
            {leaderboard.slice(0, 5).map((player, index) => (
              <div key={player.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="font-semibold">{player.name}</span>
                </div>
                <span className="font-bold text-primary-600">{player.score} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="space-x-4 mt-6">
        <button
          onClick={() => navigate('/')}
          className="btn btn-outline text-lg px-6 py-3"
        >
          Back to Home
        </button>
        {isHost && (
          <button
            onClick={() => navigate('/create')}
            className="btn btn-secondary text-lg px-6 py-3"
          >
            Create New Quiz
          </button>
        )}
      </div>
    </motion.div>
  )

  // MAIN RENDER
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Quiz...</h2>
          <p className="text-gray-600">Setting up your quiz room</p>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Quiz Not Found</h2>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Enhanced Quiz Navigation Header */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Row - Navigation */}
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {/* Logo and Back Button */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center space-x-2 text-white hover:bg-white/20 px-3 py-2 rounded-xl transition-colors duration-200"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="hidden sm:block">QuizVerse</span>
                </button>
              </div>
              
              {/* Quiz Progress Indicator */}
              {quizState === 'active' && (
                <div className="hidden md:flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <div className="text-sm font-medium">
                    Question {currentQuestionIndex + 1} of {quiz.questions.length}
                  </div>
                  <div className="w-24 bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-white rounded-full h-2 transition-all duration-300"
                      style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Right Side Controls */}
            <div className="flex items-center space-x-4">
              {/* Timer Display - Show to both host and players during active questions */}
              {quizState === 'active' && !showResults && (
                <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2">
                  <Clock className="w-4 h-4" />
                  <span className="font-bold text-sm">{timer}s</span>
                  {isHost && (
                    <span className="text-xs text-white/60">remaining</span>
                  )}
                </div>
              )}
              
              {/* Players Count */}
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">{players.length}</span>
              </div>
              
              {/* User Role Badge */}
              <div className={`text-xs px-3 py-1 rounded-full font-medium ${
                isHost 
                  ? 'bg-yellow-400/20 text-yellow-100 border border-yellow-300/30' 
                  : 'bg-white/20 text-white border border-white/30'
              }`}>
                {isHost ? '👑 Host' : '👤 Player'}
              </div>
              
              {/* Host Quick Actions */}
              {isHost && quizState === 'waiting' && (
                <button
                  onClick={startQuiz}
                  className="hidden sm:flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl transition-colors duration-200 font-medium"
                >
                  <Play className="w-4 h-4" />
                  <span>Start</span>
                </button>
              )}
              
              {/* Host Menu Dropdown */}
              {isHost && (
                <div className="relative host-menu-container">
                  <button
                    onClick={() => setShowHostMenu(!showHostMenu)}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 transition-colors duration-200"
                  >
                    <MoreVertical className="w-5 h-5 text-white" />
                  </button>
                  
                  <AnimatePresence>
                    {showHostMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50"
                      >
                        {quizState === 'waiting' && (
                          <button
                            onClick={() => { startQuiz(); setShowHostMenu(false) }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                          >
                            <Play className="w-4 h-4 text-green-600" />
                            <span>Start Quiz</span>
                          </button>
                        )}
                        
                        {quizState === 'active' && !showResults && (
                          <button
                            onClick={() => { showQuestionResults(); setShowHostMenu(false) }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                            <span>Show Results</span>
                          </button>
                        )}
                        
                        {quizState === 'active' && showResults && (
                          <button
                            onClick={() => { nextQuestion(); setShowHostMenu(false) }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                          >
                            <Play className="w-4 h-4 text-primary-600" />
                            <span>{currentQuestionIndex < quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}</span>
                          </button>
                        )}
                        
                        {quizState === 'finished' && !showLeaderboard && (
                          <button
                            onClick={() => { showFinalLeaderboard(); setShowHostMenu(false) }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                          >
                            <BarChart3 className="w-4 h-4 text-purple-600" />
                            <span>Show Final Results</span>
                          </button>
                        )}
                        
                        <div className="border-t border-gray-100 my-1"></div>
                        
                        <button
                          onClick={() => { 
                            setShowStatsToPlayers(!showStatsToPlayers); 
                            setShowHostMenu(false);
                            success(showStatsToPlayers ? 'Stats hidden from players' : 'Stats now visible to players');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                        >
                          <BarChart3 className={`w-4 h-4 ${
                            showStatsToPlayers ? 'text-green-600' : 'text-gray-600'
                          }`} />
                          <span>{showStatsToPlayers ? 'Hide Stats from Players' : 'Show Stats to Players'}</span>
                        </button>
                        
                        <button
                          onClick={() => { loadPlayers(); setShowHostMenu(false) }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                        >
                          <RotateCcw className="w-4 h-4 text-gray-600" />
                          <span>Refresh Players</span>
                        </button>
                        
                        <button
                          onClick={() => { navigate('/'); setShowHostMenu(false) }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>End & Leave Quiz</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
          
          {/* Bottom Row - Quiz Info */}
          <div className="pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold mb-1">{quiz.title}</h1>
                <p className="text-white/80 text-sm sm:text-base">{quiz.description}</p>
                
                {/* Mobile Progress Indicator */}
                {quizState === 'active' && (
                  <div className="md:hidden mt-3 flex items-center space-x-2">
                    <span className="text-sm font-medium text-white/90">
                      {currentQuestionIndex + 1}/{quiz.questions.length}
                    </span>
                    <div className="flex-1 bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-white rounded-full h-2 transition-all duration-300"
                        style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Quiz State Indicator */}
              <div className="mt-4 sm:mt-0 flex items-center">
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${
                  quizState === 'waiting' ? 'bg-blue-500/20 text-blue-100' :
                  quizState === 'active' ? 'bg-green-500/20 text-green-100' :
                  quizState === 'finished' ? 'bg-purple-500/20 text-purple-100' :
                  'bg-gray-500/20 text-gray-100'
                }`}>
                  {quizState === 'waiting' && <><Users className="w-4 h-4" /> Waiting</>}
                  {quizState === 'active' && <><Play className="w-4 h-4" /> Active</>}
                  {quizState === 'finished' && <><Trophy className="w-4 h-4" /> Finished</>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {(quizState === 'active' || quizState === 'finished') ? (
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Quiz Content */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                {quizState === 'active' && renderActiveQuestion()}
                {quizState === 'finished' && renderFinishedScreen()}
              </AnimatePresence>
            </div>
            
            {/* Analytics Dashboard - Compact Side Panel */}
            <div className="lg:col-span-2">
              <div className="sticky top-24">
                <QuizDashboard
                  quiz={quiz}
                  currentQuestion={quiz?.questions[currentQuestionIndex]}
                  currentQuestionIndex={currentQuestionIndex}
                  showResults={showResults}
                  answerStats={(isHost || (showStatsToPlayers && showResults)) ? (statsAnswerStats || {}) : {}}
                  leaderboard={statsLeaderboard.length > 0 ? statsLeaderboard : leaderboard}
                  currentPlayerId={playerId}
                  isHost={isHost}
                  showStatsToPlayers={showStatsToPlayers}
                  className="transition-all duration-300"
                />
              </div>
            </div>
          </div>
        ) : (
          // Waiting Screen - Full Width
          <div className="max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
              {quizState === 'waiting' && renderWaitingScreen()}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

export default QuizRoom