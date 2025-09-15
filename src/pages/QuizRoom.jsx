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
  BarChart3
} from 'lucide-react'
import { useQuiz } from '../contexts/QuizContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

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
  
  // User Interaction State
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [timer, setTimer] = useState(30)
  const [playerId, setPlayerId] = useState('')

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
          }
          
          // Reset timer when quiz becomes active or results are hidden
          if ((newState === 'active' && quizState !== 'active') || 
              (showResults && !newShowResults)) {
            setTimer(30)
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

  // Timer Logic
  useEffect(() => {
    if (quizState === 'active' && !showResults && !hasAnswered && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1)
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [timer, quizState, showResults, hasAnswered])

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
        </div>

        {/* Answer Options */}
        {currentQuestion.type === 'mcq' && (
          <div className="space-y-4 mb-8">
            {currentQuestion.options.map((option, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: isHost ? 1 : 1.02 }}
                whileTap={{ scale: isHost ? 1 : 0.98 }}
                onClick={() => !isHost && !hasAnswered && setSelectedAnswer(index)}
                disabled={isHost || hasAnswered}
                className={`w-full p-6 text-left rounded-xl border-2 transition-all duration-200 ${
                  selectedAnswer === index && !isHost
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                } ${
                  showResults && index === currentQuestion.correctAnswer
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : ''
                } ${
                  showResults && selectedAnswer === index && index !== currentQuestion.correctAnswer
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : ''
                } ${
                  isHost ? 'cursor-default opacity-75' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                    selectedAnswer === index && !isHost
                      ? 'border-primary-500 bg-primary-500 text-white'
                      : 'border-gray-300'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="text-xl font-medium">{option}</span>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {/* True/False Questions */}
        {currentQuestion.type === 'truefalse' && (
          <div className="grid grid-cols-2 gap-6 mb-8">
            {['True', 'False'].map((option, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: isHost ? 1 : 1.02 }}
                whileTap={{ scale: isHost ? 1 : 0.98 }}
                onClick={() => !isHost && !hasAnswered && setSelectedAnswer(index)}
                disabled={isHost || hasAnswered}
                className={`p-8 text-center rounded-xl border-2 transition-all duration-200 ${
                  selectedAnswer === index && !isHost
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                } ${
                  showResults && index === currentQuestion.correctAnswer
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : ''
                } ${
                  showResults && selectedAnswer === index && index !== currentQuestion.correctAnswer
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : ''
                } ${
                  isHost ? 'cursor-default opacity-75' : ''
                }`}
              >
                <span className="text-2xl font-bold">{option}</span>
              </motion.button>
            ))}
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
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate('/')}
                className="btn btn-ghost text-white hover:bg-white/20 mb-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Leave Quiz
              </button>
              <h1 className="text-3xl font-bold">{quiz.title}</h1>
              <p className="text-white/80">{quiz.description}</p>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{players.length}</div>
                <div className="text-sm text-white/80">Players</div>
              </div>
              
              {quizState === 'active' && !showResults && !isHost && (
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span className="text-xl font-bold">{timer}s</span>
                  </div>
                </div>
              )}
              
              <div className="text-sm bg-white/20 px-3 py-1 rounded-full">
                {isHost ? '👑 Host' : '👤 Player'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {quizState === 'waiting' && renderWaitingScreen()}
          {quizState === 'active' && renderActiveQuestion()}
          {quizState === 'finished' && renderFinishedScreen()}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default QuizRoom