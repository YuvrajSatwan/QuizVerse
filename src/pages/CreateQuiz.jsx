import React, { useState, useEffect, useCallback } from 'react'
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
  Play,
  Shield,
  Zap,
  Sparkles,
  Lock,
  Check,
  Clock,
  Eye,
  GripVertical,
  FileText,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Palette,
  BarChart3,
  Target,
  BookOpen,
  Lightbulb,
  X
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
  const [copySuccess, setCopySuccess] = useState(false)
  
  // Auto-save states
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved') // 'saving', 'saved', 'error'
  const [lastSaved, setLastSaved] = useState(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // Debug: Log when quizCode changes
  console.log('Current quizCode state:', quizCode)
  
  // Monitor quizCode changes
  useEffect(() => {
    console.log('quizCode changed to:', quizCode)
  }, [quizCode])

  // Load draft from localStorage on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('quizDraft')
    if (savedDraft) {
      try {
        const { formData: savedFormData, questions: savedQuestions, timestamp } = JSON.parse(savedDraft)
        // Only load if draft is less than 24 hours old
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setFormData(savedFormData)
          setQuestions(savedQuestions)
          setLastSaved(new Date(timestamp))
          setHasUnsavedChanges(true)
          console.log('📝 Loaded quiz draft from localStorage')
        } else {
          localStorage.removeItem('quizDraft')
        }
      } catch (error) {
        console.error('Failed to load quiz draft:', error)
        localStorage.removeItem('quizDraft')
      }
    }
  }, [])

  // Auto-save functionality
  const saveToLocalStorage = useCallback(() => {
    try {
      const draftData = {
        formData,
        questions,
        timestamp: Date.now()
      }
      localStorage.setItem('quizDraft', JSON.stringify(draftData))
      setAutoSaveStatus('saved')
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
      console.log('💾 Auto-saved quiz draft')
    } catch (error) {
      console.error('Failed to save quiz draft:', error)
      setAutoSaveStatus('error')
    }
  }, [formData, questions])

  // Auto-save every 30 seconds when there are unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return

    setAutoSaveStatus('saving')
    const timeoutId = setTimeout(() => {
      saveToLocalStorage()
    }, 2000) // Save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId)
  }, [formData, questions, hasUnsavedChanges, saveToLocalStorage])

  // Mark as unsaved when data changes
  useEffect(() => {
    setHasUnsavedChanges(true)
  }, [formData, questions])

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

  // Drag & Drop functionality
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  const handleDragStart = (e, index) => {
    setDraggedItem(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.target.outerHTML)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedItem !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    if (draggedItem !== null && draggedItem !== dropIndex) {
      const newQuestions = [...questions]
      const draggedQuestion = newQuestions[draggedItem]
      
      // Remove dragged item
      newQuestions.splice(draggedItem, 1)
      
      // Insert at new position
      newQuestions.splice(dropIndex, 0, draggedQuestion)
      
      setQuestions(newQuestions)
    }
    
    setDraggedItem(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverIndex(null)
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
      
      // Clear the draft since quiz was successfully created
      localStorage.removeItem('quizDraft')
      setHasUnsavedChanges(false)
      setAutoSaveStatus('saved')
      
      success('Quiz created successfully!')
    } catch (err) {
      error('Failed to create quiz. Please try again.')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(quizCode)
      setCopySuccess(true)
      success('Quiz code copied to clipboard!')
      // Reset copy success state after 2 seconds
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = quizCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopySuccess(true)
      success('Quiz code copied to clipboard!')
      setTimeout(() => setCopySuccess(false), 2000)
    }
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Branding & Benefits */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              {/* Back Button */}
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center space-x-2 text-gray-600 hover:text-primary-600 mb-8 transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </button>

              {/* Brand Logo */}
              <div className="flex items-center justify-center lg:justify-start space-x-3 mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">QuizVerse</h1>
                  <p className="text-primary-600 font-medium">Create & Share</p>
                </div>
              </div>

              {/* Headline */}
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Start Creating
                <span className="block text-gradient">Amazing Quizzes</span>
              </h2>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Join thousands of educators and creators who trust QuizVerse to build engaging, interactive learning experiences.
              </p>

              {/* Benefits List */}
              <div className="space-y-4">
                <div className="flex items-center justify-center lg:justify-start space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-2xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Create quizzes in under 5 minutes</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Secure and privacy-focused</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Real-time participant engagement</span>
                </div>
              </div>
            </motion.div>

            {/* Right Side - Sign In Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              {/* Background Decoration */}
              <div className="absolute -top-6 -right-6 w-72 h-72 bg-gradient-to-br from-primary-200/20 to-purple-200/20 rounded-full blur-3xl"></div>
              
              <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 lg:p-10">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome Back
                  </h3>
                  <p className="text-gray-600">
                    Sign in to start creating engaging quizzes
                  </p>
                </div>

                {/* Sign In Options */}
                <div className="space-y-4">
                  <button
                    onClick={() => handleSignIn('google')}
                    className="group w-full bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 font-semibold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 hover:shadow-lg transform hover:scale-[1.02]"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-lg">Continue with Google</span>
                  </button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">or</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleSignIn('guest')}
                    className="group w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center space-x-3"
                  >
                    <User className="w-6 h-6" />
                    <span className="text-lg">Continue as Guest</span>
                  </button>
                </div>

                {/* Security Note */}
                <div className="mt-8 p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-700 font-medium">Secure Authentication</p>
                      <p className="text-xs text-gray-500 mt-1">Your data is protected with industry-standard security measures.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  console.log('Rendering component, quizCode:', quizCode)
  if (quizCode) {
    console.log('Rendering success screen')
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">QuizVerse</span>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              {/* Success Icon & Title */}
              <div className="mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  Your presentation is ready!
                </h1>
                <p className="text-gray-500 text-lg">
                  Share the code below so your audience can join.
                </p>
              </div>

              {/* Quiz Code - Mentimeter Style */}
              <div className="bg-gray-50 rounded-3xl p-12 mb-8">
                <div className="text-center">
                  <p className="text-gray-500 text-sm mb-2 uppercase tracking-wide font-medium">
                    Go to menti.com and use code
                  </p>
                  <div className="text-6xl font-black text-gray-900 tracking-wider mb-6 font-mono">
                    {quizCode}
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className={`inline-flex items-center space-x-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                      copySuccess 
                        ? 'bg-green-500 text-white' 
                        : 'bg-primary-600 hover:bg-primary-700 text-white'
                    }`}
                  >
                    {copySuccess ? (
                      <>
                        <Check className="w-5 h-5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        <span>Copy code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quiz Info Card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
                <div className="flex items-start justify-between">
                  <div className="text-left flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{formData.title}</h3>
                    {formData.description && (
                      <p className="text-gray-600 mb-3">{formData.description}</p>
                    )}
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span>{questions.length} questions</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>{formData.questionTime}s per question</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <Play className="w-6 h-6 text-primary-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  const quizId = localStorage.getItem('isQuizHost')
                  if (quizId) {
                    navigate(`/quiz/${quizId}`)
                  }
                }}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02] mb-4"
              >
                Start presentation
              </button>

              {/* Secondary Actions */}
              <div className="flex justify-center space-x-4 text-sm">
                <button
                  onClick={() => {
                    setQuizCode(null)
                    setFormData({ title: '', description: '', questionTime: 30, showAnswers: 'live' })
                    setQuestions([{ id: Date.now(), text: '', type: 'mcq', options: ['', '', '', ''], correctAnswer: 0 }])
                  }}
                  className="text-gray-500 hover:text-gray-700 transition-colors flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create new</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  // Calculate progress
  const totalSteps = 3
  const currentStep = formData.title ? (questions[0]?.text ? 3 : 2) : 1
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors duration-200 group"
            >
              <div className="p-2 rounded-full group-hover:bg-primary-50 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <span className="font-medium">Back to Home</span>
            </button>
            
            {/* Progress Indicator */}
            <div className="flex items-center space-x-3">
              <div className="text-sm font-medium text-gray-600">
                Step {currentStep} of {totalSteps}
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <motion.div 
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl mb-6 shadow-xl"
            >
              <FileText className="w-10 h-10 text-white" />
            </motion.div>
            
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Create Your Quiz
              <span className="block text-3xl text-gradient mt-2">Make Learning Interactive</span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Build engaging quizzes with our intuitive creator. Add questions, customize settings, and share with your audience in minutes.
            </p>
          </div>
        </motion.div>

        {/* Enhanced Form Layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Quiz Setup */}
          <div className="lg:col-span-2 space-y-8">
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onSubmit={handleSubmit}
              className="space-y-8"
            >
              {/* Step 1: Basic Information */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Quiz Information</h2>
                        <p className="text-primary-100 text-sm">Give your quiz a name and description</p>
                      </div>
                    </div>
                    
                    {/* Auto-save Status Indicator */}
                    <div className="flex items-center space-x-2 text-white/90">
                      {autoSaveStatus === 'saving' && (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span className="text-sm font-medium">Saving...</span>
                        </>
                      )}
                      {autoSaveStatus === 'saved' && lastSaved && (
                        <>
                          <div className="w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium">
                            Saved {new Date(lastSaved).toLocaleTimeString()}
                          </span>
                        </>
                      )}
                      {autoSaveStatus === 'error' && (
                        <>
                          <div className="w-4 h-4 bg-red-400 rounded-full flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-red-200">Save failed</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                        <Target className="w-4 h-4 text-primary-500" />
                        <span>Quiz Title *</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-200 transition-all duration-200 text-lg placeholder-gray-400"
                        placeholder="e.g., 'Science Quiz for Grade 5' or 'Company Knowledge Test'"
                        required
                      />
                      <div className="mt-2 flex justify-between items-center">
                        <p className="text-xs text-gray-500">Choose a clear, descriptive title</p>
                        <span className={`text-xs font-medium ${
                          formData.title.length > 50 ? 'text-red-500' : 'text-gray-400'
                        }`}>
                          {formData.title.length}/50
                        </span>
                      </div>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                        <FileText className="w-4 h-4 text-primary-500" />
                        <span>Description</span>
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-200 transition-all duration-200 placeholder-gray-400 resize-none"
                        rows="3"
                        placeholder="Optional: Add a brief description of what this quiz covers..."
                      />
                      <div className="mt-2 flex justify-between items-center">
                        <p className="text-xs text-gray-500">Help participants understand the quiz content</p>
                        <span className={`text-xs font-medium ${
                          formData.description.length > 200 ? 'text-red-500' : 'text-gray-400'
                        }`}>
                          {formData.description.length}/200
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                        <Clock className="w-4 h-4 text-primary-500" />
                        <span>Time per Question</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.questionTime}
                          onChange={(e) => setFormData({ ...formData, questionTime: parseInt(e.target.value) || 30 })}
                          className="w-full px-4 py-4 pr-16 border-2 border-gray-200 rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-200 transition-all duration-200 text-lg"
                          min="5"
                          max="300"
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                          sec
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Recommended: 30-60 seconds</p>
                    </div>
                    
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                        <Eye className="w-4 h-4 text-primary-500" />
                        <span>Answer Visibility</span>
                      </label>
                      <select
                        value={formData.showAnswers}
                        onChange={(e) => setFormData({ ...formData, showAnswers: e.target.value })}
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-200 transition-all duration-200 text-lg appearance-none bg-white"
                      >
                        <option value="live">Show immediately</option>
                        <option value="after">Show after quiz ends</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-2">When should participants see correct answers?</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Step 2: Questions */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-8 py-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <HelpCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Questions ({questions.length})
                      </h2>
                      <p className="text-purple-100 text-sm">Add engaging questions to your quiz</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-8">

                  {questions.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <HelpCircle className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">No questions yet</h3>
                      <p className="text-gray-500 mb-6">Click "Add Question" to get started</p>
                      <button
                        type="button"
                        onClick={addQuestion}
                        className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl transition-all duration-200"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Add Your First Question</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Drag & Drop Hint */}
                      {questions.length > 1 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center space-x-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3"
                        >
                          <GripVertical className="w-4 h-4 text-blue-500" />
                          <span>💡 Drag questions by the grip handle to reorder them</span>
                        </motion.div>
                      )}
                      
                      <AnimatePresence>
                        {questions.map((question, index) => (
                          <motion.div
                            key={question.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl border-2 overflow-hidden group transition-all duration-300 cursor-move ${
                              draggedItem === index 
                                ? 'border-primary-500 shadow-2xl scale-105 opacity-75 rotate-2'
                                : dragOverIndex === index 
                                ? 'border-primary-400 shadow-lg scale-102 border-dashed bg-primary-50'
                                : 'border-gray-200 hover:shadow-lg hover:border-primary-200'
                            }`}
                          >
                            {/* Question Header */}
                            <div className="bg-white px-6 py-4 border-b border-gray-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">{index + 1}</span>
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-gray-900">Question {index + 1}</h3>
                                    <p className="text-xs text-gray-500 capitalize">{question.type === 'mcq' ? 'Multiple Choice' : question.type === 'truefalse' ? 'True/False' : 'Word Answer'}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <button
                                    type="button"
                                    className={`p-2 rounded-lg transition-all duration-200 ${
                                      draggedItem === index 
                                        ? 'text-primary-600 bg-primary-100'
                                        : 'text-gray-400 hover:text-primary-600 hover:bg-primary-50'
                                    }`}
                                    title="Drag to reorder questions"
                                  >
                                    <GripVertical className="w-4 h-4" />
                                  </button>
                                  
                                  {questions.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeQuestion(question.id)}
                                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 group"
                                      title="Delete question"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Question Content */}
                            <div className="p-6 space-y-6">
                              {/* Question Text */}
                              <div>
                                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                                  <HelpCircle className="w-4 h-4 text-primary-500" />
                                  <span>Question Text *</span>
                                </label>
                                <textarea
                                  value={question.text}
                                  onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-200 transition-all duration-200 placeholder-gray-400 resize-none text-lg"
                                  rows="2"
                                  placeholder="Ask a clear, engaging question..."
                                  required
                                />
                                <div className="mt-2 flex justify-between items-center">
                                  <p className="text-xs text-gray-500">Make it clear and concise</p>
                                  <span className={`text-xs font-medium ${
                                    question.text.length > 150 ? 'text-red-500' : 'text-gray-400'
                                  }`}>
                                    {question.text.length}/150
                                  </span>
                                </div>
                              </div>

                              {/* Question Type */}
                              <div>
                                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                                  <Settings className="w-4 h-4 text-primary-500" />
                                  <span>Question Type</span>
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                  <button
                                    type="button"
                                    onClick={() => updateQuestion(question.id, 'type', 'mcq')}
                                    className={`p-4 rounded-2xl border-2 transition-all duration-200 text-center ${
                                      question.type === 'mcq'
                                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                    }`}
                                  >
                                    <Target className="w-5 h-5 mx-auto mb-2" />
                                    <div className="text-sm font-medium">Multiple Choice</div>
                                    <div className="text-xs text-gray-500">2-6 options</div>
                                  </button>
                                  
                                  <button
                                    type="button"
                                    onClick={() => updateQuestion(question.id, 'type', 'truefalse')}
                                    className={`p-4 rounded-2xl border-2 transition-all duration-200 text-center ${
                                      question.type === 'truefalse'
                                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                    }`}
                                  >
                                    <CheckCircle className="w-5 h-5 mx-auto mb-2" />
                                    <div className="text-sm font-medium">True/False</div>
                                    <div className="text-xs text-gray-500">Yes or No</div>
                                  </button>
                                  
                                  <button
                                    type="button"
                                    onClick={() => updateQuestion(question.id, 'type', 'word')}
                                    className={`p-4 rounded-2xl border-2 transition-all duration-200 text-center ${
                                      question.type === 'word'
                                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                    }`}
                                  >
                                    <FileText className="w-5 h-5 mx-auto mb-2" />
                                    <div className="text-sm font-medium">Word Answer</div>
                                    <div className="text-xs text-gray-500">Single word</div>
                                  </button>
                                </div>
                              </div>

                              {/* Question Options */}
                              {question.type === 'mcq' && (
                                <div>
                                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-4">
                                    <Target className="w-4 h-4 text-primary-500" />
                                    <span>Answer Options *</span>
                                  </label>
                                  <div className="space-y-3">
                                    {question.options.map((option, optionIndex) => (
                                      <div key={optionIndex} className="flex items-center space-x-3 group">
                                        <div className="relative flex items-center">
                                          <input
                                            type="radio"
                                            name={`correct-${question.id}`}
                                            checked={question.correctAnswer === optionIndex}
                                            onChange={() => updateQuestion(question.id, 'correctAnswer', optionIndex)}
                                            className="w-5 h-5 text-primary-600 border-2 border-gray-300 focus:ring-primary-500 focus:ring-2"
                                            required
                                          />
                                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            {question.correctAnswer === optionIndex && (
                                              <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-2 h-2 bg-white rounded-full"
                                              />
                                            )}
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2 flex-1">
                                          <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${
                                            question.correctAnswer === optionIndex
                                              ? 'bg-green-100 text-green-700'
                                              : 'bg-gray-100 text-gray-500'
                                          }`}>
                                            {String.fromCharCode(65 + optionIndex)}
                                          </span>
                                          
                                          <input
                                            type="text"
                                            value={option}
                                            onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                                            className={`flex-1 px-4 py-3 border-2 rounded-2xl transition-all duration-200 ${
                                              question.correctAnswer === optionIndex
                                                ? 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-4 focus:ring-green-200'
                                                : 'border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-200'
                                            }`}
                                            placeholder={`Option ${optionIndex + 1}`}
                                            required
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-3">
                                    💡 Select the radio button to mark the correct answer
                                  </p>
                                </div>
                              )}

                              {question.type === 'truefalse' && (
                                <div>
                                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-4">
                                    <CheckCircle className="w-4 h-4 text-primary-500" />
                                    <span>Correct Answer *</span>
                                  </label>
                                  <div className="grid grid-cols-2 gap-4">
                                    <button
                                      type="button"
                                      onClick={() => updateQuestion(question.id, 'correctAnswer', 0)}
                                      className={`p-6 rounded-2xl border-2 transition-all duration-200 text-center ${
                                        question.correctAnswer === 0
                                          ? 'border-green-500 bg-green-50 text-green-700'
                                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                      }`}
                                    >
                                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                                        question.correctAnswer === 0
                                          ? 'bg-green-100'
                                          : 'bg-gray-100'
                                      }`}>
                                        <Check className="w-6 h-6" />
                                      </div>
                                      <div className="text-lg font-bold">True</div>
                                      <div className="text-sm text-gray-500">This statement is correct</div>
                                    </button>
                                    
                                    <button
                                      type="button"
                                      onClick={() => updateQuestion(question.id, 'correctAnswer', 1)}
                                      className={`p-6 rounded-2xl border-2 transition-all duration-200 text-center ${
                                        question.correctAnswer === 1
                                          ? 'border-red-500 bg-red-50 text-red-700'
                                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                      }`}
                                    >
                                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                                        question.correctAnswer === 1
                                          ? 'bg-red-100'
                                          : 'bg-gray-100'
                                      }`}>
                                        <X className="w-6 h-6" />
                                      </div>
                                      <div className="text-lg font-bold">False</div>
                                      <div className="text-sm text-gray-500">This statement is incorrect</div>
                                    </button>
                                  </div>
                                </div>
                              )}

                              {question.type === 'word' && (
                                <div>
                                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-4">
                                    <FileText className="w-4 h-4 text-primary-500" />
                                    <span>Correct Answer *</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={question.correctAnswer || ''}
                                    onChange={(e) => updateQuestion(question.id, 'correctAnswer', e.target.value.trim())}
                                    className="w-full px-4 py-4 border-2 border-green-300 bg-green-50 focus:border-green-500 focus:ring-4 focus:ring-green-200 rounded-2xl transition-all duration-200 placeholder-gray-400"
                                    placeholder="e.g., 'Paris' or 'Democracy'"
                                    required
                                  />
                                  <p className="text-xs text-gray-500 mt-2">
                                    💡 Enter the exact word answer. Answers will be checked case-insensitively
                                  </p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      
                      {/* Add Question Button - Now at the bottom */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex justify-center pt-4"
                      >
                        <button
                          type="button"
                          onClick={addQuestion}
                          className="flex items-center space-x-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg font-medium text-lg"
                        >
                          <Plus className="w-5 h-5" />
                          <span>Add Question</span>
                        </button>
                      </motion.div>
                    </div>
                  )}

                </div>
              </motion.div>
              
              {/* Submit Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex justify-center pt-8"
              >
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.title || questions.some(q => !q.text.trim())}
                  className="group bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold py-6 px-12 rounded-3xl transition-all duration-300 transform hover:scale-105 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-3"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="text-xl">Creating Your Quiz...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6" />
                      <span className="text-xl">Create Quiz</span>
                    </>
                  )}
                </button>
              </motion.div>
            </motion.form>
          </div>
          
          {/* Sidebar - Tips and Preview */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
                <div className="flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5 text-white" />
                  <h3 className="font-bold text-white">Quick Tips</h3>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-blue-600 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">Keep questions clear</h4>
                    <p className="text-xs text-gray-600">Use simple language that your audience will understand</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-green-600 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">Vary question types</h4>
                    <p className="text-xs text-gray-600">Mix multiple choice with true/false for engagement</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-purple-600 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">Test your timing</h4>
                    <p className="text-xs text-gray-600">30-45 seconds works well for most questions</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-red-600 font-bold text-sm">4</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">Preview before publishing</h4>
                    <p className="text-xs text-gray-600">Double-check answers and question flow</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Quiz Preview */}
            {formData.title && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-5 h-5 text-white" />
                    <h3 className="font-bold text-white">Quiz Preview</h3>
                  </div>
                </div>
                
                <div className="p-6">
                  <h4 className="font-bold text-gray-900 mb-2 text-lg">{formData.title}</h4>
                  {formData.description && (
                    <p className="text-gray-600 text-sm mb-4">{formData.description}</p>
                  )}
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-600">Questions</span>
                      <span className="font-semibold text-gray-900">{questions.length}</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-600">Time per question</span>
                      <span className="font-semibold text-gray-900">{formData.questionTime}s</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-600">Total time</span>
                      <span className="font-semibold text-gray-900">{Math.ceil((questions.length * formData.questionTime) / 60)} min</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateQuiz
