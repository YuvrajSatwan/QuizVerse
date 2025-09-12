import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft,
  CheckCircle,
  Copy,
  User,
  Play
} from 'lucide-react'
import { useQuiz } from '../contexts/QuizContext'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { testFirebaseConnection } from '../firebase/config'

const CreateQuiz = () => {
  const navigate = useNavigate()
  const { createQuiz } = useQuiz()
  const { success, error } = useToast()
  const { currentUser, signInWithGoogle, signInAsGuest } = useAuth()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    questionTime: 30,
    showAnswers: 'live'
  })
  
  const [questions, setQuestions] = useState([
    {
      id: 1,
      text: '',
      type: 'mcq',
      options: ['', '', '', ''],
      correctAnswer: 0
    }
  ])
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quizCode, setQuizCode] = useState(null)
  
  // Debug: Log when quizCode changes
  console.log('Current quizCode state:', quizCode)
  
  // Monitor quizCode changes
  useEffect(() => {
    console.log('quizCode changed to:', quizCode)
  }, [quizCode])

  const addQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      text: '',
      type: 'mcq',
      options: ['', '', '', ''],
      correctAnswer: 0
    }
    setQuestions([...questions, newQuestion])
  }

  const removeQuestion = (id) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id))
    }
  }

  const updateQuestion = (id, field, value) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ))
  }

  const updateOption = (questionId, optionIndex, value) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newOptions = [...q.options]
        newOptions[optionIndex] = value
        return { ...q, options: newOptions }
      }
      return q
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      error('Please enter a quiz title')
      return
    }

    if (questions.some(q => !q.text.trim())) {
      error('Please fill in all questions')
      return
    }

    if (questions.some(q => q.type === 'mcq' && q.options.some(opt => !opt.trim()))) {
      error('Please fill in all options for multiple choice questions')
      return
    }

        setIsSubmitting(true)

    try {
      console.log('Form data:', formData)
      console.log('Questions:', questions)
      
      // Test Firebase connection first
      const isConnected = await testFirebaseConnection()
      if (!isConnected) {
        error('Failed to connect to Firebase. Please check your internet connection.')
        return
      }
      
      // Generate a unique user ID for the host
      const hostId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      
      const quizData = {
        ...formData,
        questions: questions.map(q => ({
          text: q.text,
          type: q.type,
          options: q.type === 'mcq' ? q.options : [],
          correctAnswer: q.correctAnswer
        })),
        createdAt: new Date().toISOString(),
        createdBy: hostId,
        status: 'waiting',
        currentQuestion: 0,
        showResults: false,
        showLeaderboard: false
      }

      console.log('Quiz data to be created:', quizData)
      console.log('createQuiz function:', createQuiz)
      
      const quizId = await createQuiz(quizData)
      
      // Store host ID for this quiz
      localStorage.setItem('userId', hostId)
      console.log('Quiz ID received:', quizId)
      const code = quizId.slice(-6).toUpperCase()
      console.log('Generated quiz code:', code)
      
      // Set host flag for later use
      localStorage.setItem('isQuizHost', quizId)
      console.log('Host flag set for quiz:', quizId)
      
      setQuizCode(code)
      console.log('Quiz code state set to:', code)
      success('Quiz created successfully!')
    } catch (err) {
      error('Failed to create quiz. Please try again.')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(quizCode)
    success('Quiz code copied to clipboard!')
  }

  const handleSignIn = async (method) => {
    try {
      if (method === 'google') {
        await signInWithGoogle()
      } else {
        signInAsGuest()
      }
      success('Signed in successfully!')
    } catch (err) {
      error('Failed to sign in. Please try again.')
      console.error(err)
    }
  }

  // If user is not authenticated, show sign-in options
  if (!currentUser) {
    return (
      <div className="min-h-screen pt-20 px-4 bg-gradient-to-br from-primary-50 to-secondary-50">
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
              Sign In to Create Quiz
            </h1>
            <p className="text-xl text-gray-600">
              Please sign in to create and manage your quizzes
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-8 text-center"
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Create Quiz
              </h2>
              <p className="text-gray-600">
                Choose how to continue
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => handleSignIn('google')}
                className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center space-x-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </button>
              
              <button
                onClick={() => handleSignIn('guest')}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors"
              >
                Continue as Guest
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  console.log('Rendering component, quizCode:', quizCode)
  if (quizCode) {
    console.log('Rendering success screen')
    return (
      <div className="min-h-screen pt-20 px-4 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Quiz Created Successfully!
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Share this code with participants to join your quiz
            </p>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Quiz Code
              </h2>
              <div className="flex items-center justify-center space-x-4 mb-6">
                <span className="text-6xl font-bold text-primary-600 tracking-wider">
                  {quizCode}
                </span>
                <button
                  onClick={copyToClipboard}
                  className="btn btn-outline"
                >
                  <Copy className="w-5 h-5" />
                  <span>Copy</span>
                </button>
              </div>
              <p className="text-gray-600">
                Participants can use this code to join your quiz
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  const quizId = localStorage.getItem('isQuizHost')
                  if (quizId) {
                    navigate(`/quiz/${quizId}`)
                  }
                }}
                className="btn btn-primary text-lg px-8 py-4"
              >
                <Play className="w-5 h-5" />
                <span>Start Hosting Quiz</span>
              </button>
              <button
                onClick={() => navigate('/')}
                className="btn btn-outline"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </button>
              <button
                onClick={() => {
                  setQuizCode(null)
                  setFormData({ title: '', description: '', questionTime: 30, showAnswers: 'live' })
                  setQuestions([{ id: Date.now(), text: '', type: 'mcq', options: ['', '', '', ''], correctAnswer: 0 }])
                }}
                className="btn btn-outline"
              >
                <Plus className="w-5 h-5" />
                <span>Create Another Quiz</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 px-4 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-4xl mx-auto">
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
            Create New Quiz
          </h1>
          <p className="text-xl text-gray-600">
            Design your quiz with custom questions and settings
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          {/* Basic Quiz Info */}
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Quiz Information
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  placeholder="Enter quiz title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time per Question (seconds)
                </label>
                <input
                  type="number"
                  value={formData.questionTime}
                  onChange={(e) => setFormData({ ...formData, questionTime: parseInt(e.target.value) })}
                  className="input"
                  min="10"
                  max="300"
                />
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input min-h-[100px]"
                placeholder="Enter quiz description (optional)"
              />
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Show Answers
              </label>
              <select
                value={formData.showAnswers}
                onChange={(e) => setFormData({ ...formData, showAnswers: e.target.value })}
                className="input"
              >
                <option value="live">Live (immediately)</option>
                <option value="after">After Quiz</option>
              </select>
            </div>
          </div>

          {/* Questions */}
          <div className="card p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Questions ({questions.length})
              </h2>
              <button
                type="button"
                onClick={addQuestion}
                className="btn btn-outline"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            </div>

            <AnimatePresence>
              {questions.map((question, index) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-semibold text-gray-700">
                      Question {index + 1}
                    </span>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(question.id)}
                        className="btn btn-ghost text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Text *
                      </label>
                      <input
                        type="text"
                        value={question.text}
                        onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                        className="input"
                        placeholder="Enter your question"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Type
                      </label>
                      <select
                        value={question.type}
                        onChange={(e) => updateQuestion(question.id, 'type', e.target.value)}
                        className="input"
                      >
                        <option value="mcq">Multiple Choice</option>
                        <option value="truefalse">True/False</option>
                        <option value="short">Short Answer</option>
                      </select>
                    </div>

                    {question.type === 'mcq' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Options *
                        </label>
                        <div className="space-y-3">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center space-x-3">
                              <input
                                type="radio"
                                name={`correct-${question.id}`}
                                checked={question.correctAnswer === optionIndex}
                                onChange={() => updateQuestion(question.id, 'correctAnswer', optionIndex)}
                                className="w-4 h-4 text-primary-600"
                                required
                              />
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                                className="input flex-1"
                                placeholder={`Option ${optionIndex + 1}`}
                                required
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {question.type === 'truefalse' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Correct Answer *
                        </label>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={question.correctAnswer === 0}
                              onChange={() => updateQuestion(question.id, 'correctAnswer', 0)}
                              className="w-4 h-4 text-primary-600"
                              required
                            />
                            <span>True</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={question.correctAnswer === 1}
                              onChange={() => updateQuestion(question.id, 'correctAnswer', 1)}
                              className="w-4 h-4 text-primary-600"
                              required
                            />
                            <span>False</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {question.type === 'short' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Correct Answer (optional)
                        </label>
                        <input
                          type="text"
                          value={question.options[0] || ''}
                          onChange={(e) => updateOption(question.id, 0, e.target.value)}
                          className="input"
                          placeholder="Enter correct answer (optional)"
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary text-lg px-8 py-4"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Quiz...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Create Quiz</span>
                </>
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  )
}

export default CreateQuiz

