import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft,
  CheckCircle,
  Copy
} from 'lucide-react'
import { useQuiz } from '../contexts/QuizContext'
import { useToast } from '../contexts/ToastContext'
import { testFirebaseConnection } from '../firebase/config'

const CreateQuiz = () => {
  const navigate = useNavigate()
  const { createQuiz } = useQuiz()
  const { success, error } = useToast()
  
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
      
      const quizData = {
        ...formData,
        questions: questions.map(q => ({
          text: q.text,
          type: q.type,
          options: q.type === 'mcq' ? q.options : [],
          correctAnswer: q.correctAnswer
        })),
        createdAt: new Date().toISOString(),
        createdBy: 'Quiz Creator', // This will be the quiz creator
        status: 'waiting',
        currentQuestion: 0,
        showResults: false,
        showLeaderboard: false
      }

      console.log('Quiz data to be created:', quizData)
      console.log('createQuiz function:', createQuiz)
      
      const quizId = await createQuiz(quizData)
      console.log('Quiz ID received:', quizId)
      const code = quizId.slice(-6).toUpperCase()
      console.log('Generated quiz code:', code)
      
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
                onClick={() => navigate('/')}
                className="btn btn-primary"
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

