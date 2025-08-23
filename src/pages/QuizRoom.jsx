import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, 
  Users, 
  Trophy, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Play,
  Pause
} from 'lucide-react'
import { useQuiz } from '../contexts/QuizContext'
import { useToast } from '../contexts/ToastContext'
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

const QuizRoom = () => {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const { currentQuiz, quizState, players, leaderboard, timeLeft } = useQuiz()
  const { success, error } = useToast()
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timer, setTimer] = useState(30)
  const [isHost, setIsHost] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [quizStatus, setQuizStatus] = useState('waiting') // waiting, active, finished
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  // Load quiz data and set up real-time listeners
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        console.log('Loading quiz with ID:', quizId)
        const quizDoc = await getDoc(doc(db, 'quizzes', quizId))
        
        if (quizDoc.exists()) {
          const quizData = quizDoc.data()
          console.log('Quiz data loaded:', quizData)
          setQuiz(quizData)
          setCurrentQuestionIndex(quizData.currentQuestion || 0)
          setQuizStatus(quizData.status || 'waiting')
          setShowResults(quizData.showResults || false)
          
          // Check if current user is the host (quiz creator)
          const storedPlayerName = localStorage.getItem('playerName')
          if (storedPlayerName && quizData.createdBy === storedPlayerName) {
            setIsHost(true)
          }
          setPlayerName(storedPlayerName || '')
        } else {
          error('Quiz not found')
          navigate('/')
        }
      } catch (err) {
        console.error('Error loading quiz:', err)
        error('Failed to load quiz')
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    if (quizId) {
      loadQuiz()
    }

    // Set up real-time listener for quiz updates
    const unsubscribe = onSnapshot(doc(db, 'quizzes', quizId), (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        setCurrentQuestionIndex(data.currentQuestion || 0)
        setQuizStatus(data.status || 'waiting')
        setShowResults(data.showResults || false)
        setShowLeaderboard(data.showLeaderboard || false)
      }
    })

    return () => unsubscribe()
  }, [quizId, navigate, error])

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1)
      }, 1000)
      return () => clearInterval(interval)
    } else {
      // Time's up
      if (!hasAnswered) {
        setHasAnswered(true)
        setShowResults(true)
      }
    }
  }, [timer, hasAnswered])

  const handleAnswerSelect = (answerIndex) => {
    if (hasAnswered) return
    setSelectedAnswer(answerIndex)
  }

  // Host control functions
  const startQuiz = async () => {
    try {
      await updateDoc(doc(db, 'quizzes', quizId), {
        status: 'active',
        currentQuestion: 0,
        startedAt: new Date().toISOString()
      })
      success('Quiz started!')
    } catch (err) {
      error('Failed to start quiz')
    }
  }

  const nextQuestion = async () => {
    try {
      const nextIndex = currentQuestionIndex + 1
      if (nextIndex < quiz.questions.length) {
        await updateDoc(doc(db, 'quizzes', quizId), {
          currentQuestion: nextIndex,
          showResults: false
        })
      } else {
        // Quiz finished
        await updateDoc(doc(db, 'quizzes', quizId), {
          status: 'finished',
          endedAt: new Date().toISOString()
        })
      }
    } catch (err) {
      error('Failed to advance question')
    }
  }

  const toggleResults = async () => {
    try {
      await updateDoc(doc(db, 'quizzes', quizId), {
        showResults: true
      })
    } catch (err) {
      error('Failed to show results')
    }
  }

  const toggleLeaderboard = async () => {
    try {
      await updateDoc(doc(db, 'quizzes', quizId), {
        showLeaderboard: true
      })
    } catch (err) {
      error('Failed to show leaderboard')
    }
  }

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) {
      error('Please select an answer')
      return
    }

    setHasAnswered(true)
    
    // Check if answer is correct
    const currentQuestion = quiz.questions[currentQuestionIndex]
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer
    
    if (isCorrect) {
      success('Answer submitted!')
    } else {
      error('Answer submitted!')
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Quiz...</h2>
          <p className="text-gray-600">Please wait while we load your quiz</p>
        </div>
      </div>
    )
  }

  // Show error if quiz not found
  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Not Found</h2>
          <p className="text-gray-600 mb-4">The quiz you're looking for doesn't exist</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const currentQuestion = quiz.questions[currentQuestionIndex]

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
                <span>Leave Quiz</span>
              </button>
              <h1 className="text-3xl font-bold">{quiz.title}</h1>
              <p className="text-white/80">{quiz.description}</p>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{players.length || 0}</div>
                <div className="text-sm text-white/80">Players</div>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span className="text-xl font-bold">{timer}s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Question Area */}
          <div className="lg:col-span-2">
            {quizStatus === 'waiting' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-8 text-center"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                  <Users className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Waiting for Host to Start
                </h2>
                <p className="text-xl text-gray-600 mb-6">
                  The quiz will begin when the host starts it
                </p>
                {isHost && (
                  <button
                    onClick={startQuiz}
                    className="btn btn-primary text-lg px-8 py-4"
                  >
                    <Play className="w-5 h-5" />
                    <span>Start Quiz</span>
                  </button>
                )}
              </motion.div>
            )}

            {quizStatus === 'active' && (
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="card p-8"
              >
              {/* Question Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                  <span className="text-2xl font-bold text-primary-600">
                    {currentQuestionIndex + 1}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Question {currentQuestionIndex + 1} of {quiz.questions.length}
                </h2>
                <p className="text-gray-600">
                  {currentQuestion.type === 'mcq' && 'Multiple Choice'}
                  {currentQuestion.type === 'truefalse' && 'True/False'}
                  {currentQuestion.type === 'short' && 'Short Answer'}
                </p>
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
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={hasAnswered}
                      className={`w-full p-6 text-left rounded-xl border-2 transition-all duration-200 ${
                        selectedAnswer === index
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
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                          selectedAnswer === index
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

              {currentQuestion.type === 'truefalse' && (
                <div className="grid grid-cols-2 gap-6 mb-8">
                  {['True', 'False'].map((option, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={hasAnswered}
                      className={`p-8 text-center rounded-xl border-2 transition-all duration-200 ${
                        selectedAnswer === index
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
                      }`}
                    >
                      <span className="text-2xl font-bold">{option}</span>
                    </motion.button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'short' && (
                <div className="mb-8">
                  <input
                    type="text"
                    placeholder="Type your answer..."
                    className="input text-center text-xl py-6"
                    disabled={hasAnswered}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="text-center">
                {isHost ? (
                  // Host controls
                  <div className="space-y-4">
                    {quizStatus === 'waiting' && (
                      <button
                        onClick={startQuiz}
                        className="btn btn-primary text-lg px-8 py-4"
                      >
                        <Play className="w-5 h-5" />
                        <span>Start Quiz</span>
                      </button>
                    )}
                    
                    {quizStatus === 'active' && !showResults && (
                      <button
                        onClick={toggleResults}
                        className="btn btn-secondary text-lg px-8 py-4"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span>Show Results</span>
                      </button>
                    )}
                    
                    {quizStatus === 'active' && showResults && (
                      <div className="space-x-4">
                        <button
                          onClick={nextQuestion}
                          className="btn btn-primary text-lg px-8 py-4"
                        >
                          <Play className="w-5 h-5" />
                          <span>
                            {currentQuestionIndex < quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                          </span>
                        </button>
                      </div>
                    )}
                    
                    {quizStatus === 'finished' && !showLeaderboard && (
                      <button
                        onClick={toggleLeaderboard}
                        className="btn btn-secondary text-lg px-8 py-4"
                      >
                        <Trophy className="w-5 h-5" />
                        <span>Show Leaderboard</span>
                      </button>
                    )}
                  </div>
                ) : (
                  // Player controls
                  <div>
                    {quizStatus === 'active' && !hasAnswered && (
                      <button
                        onClick={handleSubmitAnswer}
                        disabled={selectedAnswer === null}
                        className="btn btn-primary text-lg px-8 py-4"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span>Submit Answer</span>
                      </button>
                    )}
                    
                    {quizStatus === 'active' && hasAnswered && (
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600 mb-2">
                          ✓ Answer Submitted
                        </div>
                        <p className="text-gray-600">Waiting for host to show results...</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
            )}

            {quizStatus === 'finished' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-8 text-center"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                  <Trophy className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Quiz Completed!
                </h2>
                <p className="text-xl text-gray-600 mb-6">
                  Thanks for participating in the quiz
                </p>
                {isHost && !showLeaderboard && (
                  <button
                    onClick={toggleLeaderboard}
                    className="btn btn-primary text-lg px-8 py-4"
                  >
                    <Trophy className="w-5 h-5" />
                    <span>Show Leaderboard</span>
                  </button>
                )}
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Questions</span>
                  <span className="font-semibold">
                    {currentQuestionIndex + 1} / {quiz.questions.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                Leaderboard
              </h3>
              <div className="space-y-3">
                {leaderboard.length > 0 ? (
                  leaderboard.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-amber-600 text-white' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="font-medium">{player.name}</span>
                      </div>
                      <span className="font-bold text-primary-600">{player.score}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No players yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Players Online */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-500" />
                Players Online
              </h3>
              <div className="space-y-2">
                {players.length > 0 ? (
                  players.map((player) => (
                    <div key={player.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm">{player.name}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No players online</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuizRoom

