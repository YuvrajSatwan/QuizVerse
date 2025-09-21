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
  X,
  Link2
} from 'lucide-react'
import { useQuiz } from '../contexts/QuizContext'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { testFirebaseConnection } from '../firebase/config'
import AuthenticationModal from '../components/AuthenticationModal'

const CreateQuiz = () => {
  const navigate = useNavigate()
  const { createQuiz } = useQuiz()
  const { success, error } = useToast()
  const { currentUser } = useAuth()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    questionTime: 30,
    showAnswers: 'live',
    enableRating: false
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
  const [copyLinkSuccess, setCopyLinkSuccess] = useState(false)
  
  // Auto-save states
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved') // 'saving', 'saved', 'error'
  const [lastSaved, setLastSaved] = useState(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // Authentication modal state
  const [showAuthModal, setShowAuthModal] = useState(false)
  
  // Monitor quizCode changes for debugging if needed

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
          // Loaded quiz draft from localStorage
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
      // Auto-saved quiz draft
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

  // Scroll to top when success screen (quizCode) is shown to avoid landing mid-page
  useEffect(() => {
    if (quizCode) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }
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

  // Helper function to check if an option is a duplicate
  const isDuplicateOption = (question, optionIndex, value) => {
    return question.options.some((option, index) => 
      index !== optionIndex && option === value && value.trim() !== ''
    )
  }
  
  const updateOption = (questionId, optionIndex, value) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newOptions = [...q.options]
        
        // Check for exact duplicates (case-sensitive) but allow different cases
        const isDuplicate = newOptions.some((option, index) => 
          index !== optionIndex && option === value && value.trim() !== ''
        )
        
        if (isDuplicate && value.trim() !== '') {
          // Show error message for exact duplicate
          error(`Duplicate option "${value}" is not allowed. Use different text or change the case.`)
          return q // Don't update if it's an exact duplicate
        }
        
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
    
    // Check for duplicate options in each MCQ question (case-sensitive)
    for (const question of questions) {
      if (question.type === 'mcq') {
        const optionTexts = question.options.filter(opt => opt.trim() !== '')
        const duplicates = optionTexts.filter((option, index) => 
          optionTexts.indexOf(option) !== index
        )
        if (duplicates.length > 0) {
          error(`Question "${question.text}" has duplicate options: ${duplicates.join(', ')}. Please use different text or change the case.`)
          return
        }
      }
    }
    
    // Validate timer - check if questionTime is valid and at least 5 seconds
    const questionTime = Number(formData.questionTime)
    if (!formData.questionTime || formData.questionTime === '' || isNaN(questionTime)) {
      error('Please enter a valid timer value for questions.')
      return
    }
    if (questionTime < 5) {
      error(`Question timer must be at least 5 seconds. Current value: ${questionTime} seconds. Please increase the timer.`)
      return
    }
    if (questionTime > 300) {
      error('Question timer cannot exceed 300 seconds (5 minutes). Please set a shorter timer.')
      return
    }

        setIsSubmitting(true)

    try {
      // Preparing quiz data for submission
      
      // Test Firebase connection first
      const isConnected = await testFirebaseConnection()
      if (!isConnected) {
        error('Failed to connect to Firebase. Please check your internet connection.')
        return
      }
      
      // Generate a unique user ID for the host
      const hostId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      
      const sanitizedQuestionTime = Number(formData.questionTime) || 30
      
      // Debug logging for timer values
      console.log('Debug - Timer values:', {
        originalInput: formData.questionTime,
        parsedNumber: Number(formData.questionTime),
        sanitizedValue: sanitizedQuestionTime
      })

      const quizData = {
        title: formData.title,
        description: formData.description,
        showAnswers: formData.showAnswers,
        enableRating: formData.enableRating,
        questionTime: sanitizedQuestionTime, // Use sanitized value explicitly
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

      // Creating quiz with prepared data
      
      const quizId = await createQuiz(quizData)
      
      // Store host ID for this quiz
      localStorage.setItem('userId', hostId)
      const code = quizId.slice(-6).toUpperCase()
      
      // Set host flag for later use
      localStorage.setItem('isQuizHost', quizId)
      
      setQuizCode(code)
      
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

  // Check if user needs authentication or email verification
  const needsAuthentication = !currentUser || (currentUser && !currentUser.isGuest && !currentUser.emailVerified)
  
  // If user is not authenticated or not verified, show authentication requirement
  if (needsAuthentication) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Branding & Benefits */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left order-2 lg:order-1"
            >
              {/* Back Button */}
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center space-x-2 text-gray-600 hover:text-primary-600 mb-6 sm:mb-8 transition-colors duration-200 min-h-[44px]"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </button>

              {/* Brand Logo */}
              <div className="flex items-center justify-center lg:justify-start space-x-3 mb-6 sm:mb-8">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Quizzer</h1>
                  <p className="text-primary-600 font-medium text-sm sm:text-base">Create & Share</p>
                </div>
              </div>

              {/* Headline */}
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                Start Creating
                <span className="block text-gradient">Amazing Quizzes</span>
              </h2>
              
              <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                Join thousands of educators and creators who trust Quizzer to build engaging, interactive learning experiences.
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

            {/* Right Side - Authentication Required */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative order-1 lg:order-2"
            >
              {/* Background Decoration - Hidden on mobile */}
              <div className="absolute -top-6 -right-6 w-72 h-72 bg-gradient-to-br from-primary-200/20 to-purple-200/20 rounded-full blur-3xl hidden lg:block"></div>
              
              <div className="relative bg-white rounded-2xl lg:rounded-3xl shadow-2xl border border-gray-100 p-6 sm:p-8 lg:p-10">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                    <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                    {!currentUser ? 'Welcome to Quizzer' : 'Verify Your Email'}
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base">
                    {!currentUser 
                      ? 'Sign in to start creating engaging quizzes'
                      : 'Please verify your email to continue creating quizzes'
                    }
                  </p>
                </div>

                {/* Authentication Action */}
                <div className="text-center">
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold py-3 sm:py-4 px-6 rounded-2xl transition-all duration-300 hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center space-x-2 sm:space-x-3 min-h-[48px] text-base sm:text-lg"
                  >
                    <Lock className="w-5 h-5" />
                    <span>
                      {!currentUser ? 'Sign In to Continue' : 'Complete Verification'}
                    </span>
                  </button>
                </div>

                {/* Security Note */}
                <div className="mt-6 sm:mt-8 p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-700 font-medium">Secure Authentication</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Your account is protected with email verification and industry-standard security measures.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Authentication Modal */}
        <AnimatePresence>
          {showAuthModal && (
            <AuthenticationModal
              onClose={() => setShowAuthModal(false)}
              onSuccess={() => {
                setShowAuthModal(false)
                // The component will re-render automatically due to currentUser state change
              }}
            />
          )}
        </AnimatePresence>
      </div>
    )
  }

  if (quizCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/70 border-b border-white/20 px-4 sm:px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">Quizzer</span>
            </div>
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6">
          <div className="w-full max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center space-y-5"
            >
              {/* Success Header */}
              <div className="space-y-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-3xl shadow-glow"
                >
                  <CheckCircle className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-0.5">
                    Quiz Ready! 🎉
                  </h1>
                </div>
              </div>

              {/* Quiz Code Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="bg-white border border-gray-100 rounded-2xl shadow-xl p-4 sm:p-5"
              >
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Quiz Code
                    </p>
                    <div className="text-4xl sm:text-5xl font-black text-gray-900 tracking-widest font-mono">
                      {quizCode}
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={copyToClipboard}
                    className={`btn btn-primary transition-all duration-300 ${
                      copySuccess 
                        ? '!bg-gradient-to-r from-green-500 to-green-600 !text-white shadow-glow' 
                        : ''
                    }`}
                  >
                    {copySuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </motion.button>

                  {/* Shareable Join Link */}
                  <div className="mt-3 text-left">
                    <div className="rounded-2xl border border-primary-200/60 bg-gradient-to-r from-primary-50 to-secondary-50 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white shadow-sm border border-primary-100">
                            <Link2 className="w-4 h-4 text-primary-600" />
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">Share with participants</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={`${window.location.origin}/join?code=${quizCode || ''}`}
                          className="flex-1 px-3 py-2 rounded-xl border border-primary-200 bg-white text-sm text-gray-800 select-all shadow-inner"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const link = `${window.location.origin}/join?code=${quizCode || ''}`
                              await navigator.clipboard.writeText(link)
                              setCopyLinkSuccess(true)
                              setTimeout(() => setCopyLinkSuccess(false), 2000)
                            } catch {
                              // Fallback
                              const link = `${window.location.origin}/join?code=${quizCode || ''}`
                              const ta = document.createElement('textarea')
                              ta.value = link
                              document.body.appendChild(ta)
                              ta.select()
                              document.execCommand('copy')
                              document.body.removeChild(ta)
                              setCopyLinkSuccess(true)
                              setTimeout(() => setCopyLinkSuccess(false), 2000)
                            }
                          }}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm ${
                            copyLinkSuccess
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                              : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700'
                          }`}
                          aria-label="Copy share link"
                        >
                          <Copy className="w-4 h-4" />
                          {copyLinkSuccess ? 'Copied' : 'Copy Link'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Quiz Info - Compact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="bg-white border border-gray-100 rounded-2xl shadow-lg p-3.5 text-left"
              >
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  {formData.title}
                </h3>
                <div className="flex items-center space-x-4 text-xs text-gray-600">
                  <span>{questions.length} questions</span>
                  <span>•</span>
                  <span>
                    Total time {(() => {
                      const totalSeconds = questions.length * (Number(formData.questionTime) || 30)
                      const minutes = Math.floor(totalSeconds / 60)
                      const seconds = totalSeconds % 60
                      return minutes > 0 ? `${minutes} min${seconds ? ` ${seconds}s` : ''}` : `${seconds}s`
                    })()}
                  </span>
                </div>
              </motion.div>

              {/* Action Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="space-y-3"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const quizId = localStorage.getItem('isQuizHost')
                    if (quizId) {
                      navigate(`/quiz/${quizId}`)
                    }
                  }}
                  className="w-full btn btn-primary text-base py-3"
                >
                  <Target className="w-4 h-4" />
                  <span>Enter Quiz Room</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setQuizCode(null)
                    setFormData({ title: '', description: '', questionTime: 30, showAnswers: 'live' })
                    setQuestions([{ id: Date.now(), text: '', type: 'mcq', options: ['', '', '', ''], correctAnswer: 0 }])
                  }}
                  className="w-full btn btn-outline text-sm py-2"
                >
                  <Plus className="w-3 h-3" />
                  <span>Create Another Quiz</span>
                </motion.button>
              </motion.div>
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
    <div className="min-h-screen pt-14 sm:pt-16 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 sm:mb-12"
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors duration-200 group min-h-[44px]"
            >
              <div className="p-2 rounded-full group-hover:bg-primary-50 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm sm:text-base">Back to Home</span>
            </button>
            
            {/* Progress Indicator */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">
                Step {currentStep} of {totalSteps}
              </div>
              <div className="w-20 sm:w-32 bg-gray-200 rounded-full h-2">
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
              className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl mb-4 sm:mb-6 shadow-xl"
            >
              <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </motion.div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              Create Your Quiz
              <span className="block text-xl sm:text-2xl lg:text-3xl text-gradient mt-1 sm:mt-2">Make Learning Interactive</span>
            </h1>
            
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
              Build engaging quizzes with our intuitive creator. Add questions, customize settings, and share with your audience in minutes.
            </p>
          </div>
        </motion.div>

        {/* Enhanced Form Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content - Quiz Setup */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
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
                className="bg-white rounded-2xl lg:rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-white">Quiz Information</h2>
                        <p className="text-primary-100 text-xs sm:text-sm">Give your quiz a name and description</p>
                      </div>
                    </div>
                    
                    {/* Auto-save Status Indicator - Hidden on mobile */}
                    <div className="hidden sm:flex items-center space-x-2 text-white/90">
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
                
                <div className="p-4 sm:p-6 lg:p-8">
                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                        <Target className="w-4 h-4 text-primary-500" />
                        <span>Quiz Title *</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-3 sm:py-4 border-2 border-gray-200 rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-200 transition-all duration-200 text-base sm:text-lg placeholder-gray-400"
                        placeholder="e.g., 'Science Quiz for Grade 5'"
                        required
                      />
                      
                    </div>
                    
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                        <FileText className="w-4 h-4 text-primary-500" />
                        <span>Description</span>
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-3 sm:py-4 border-2 border-gray-200 rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-200 transition-all duration-200 placeholder-gray-400 resize-none text-base"
                        rows="3"
                        placeholder="Optional: Add a brief description..."
                      />
                      
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                          <Clock className="w-4 h-4 text-primary-500" />
                          <span>Time per Question</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={formData.questionTime}
                            onChange={(e) => {
                              const val = e.target.value
                              
                              // Allow empty string for user to clear the input
                              if (val === '') {
                                setFormData({ ...formData, questionTime: '' })
                                return
                              }
                              
                              // Parse the input value
                              const num = parseInt(val, 10)
                              
                              // Only update if it's a valid number, but don't clamp it
                              // Let the user enter any value and validate on submit
                              if (!isNaN(num) && num >= 0) {
                                setFormData({ ...formData, questionTime: num })
                              }
                            }}
                            onWheel={(e) => {
                              // Prevent wheel events from changing the number input value
                              e.target.blur()
                            }}
                            onFocus={(e) => {
                              // Select all text when focused for easier editing
                              e.target.select()
                            }}
                            className="w-full px-4 py-3 sm:py-4 pr-14 sm:pr-16 border-2 border-gray-200 rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-200 transition-all duration-200 text-base sm:text-lg"
                            min="1"
                            max="300"
                            placeholder="30"
                          />
                          <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium text-sm sm:text-base">
                            sec
                          </div>
                        </div>
                        
                      </div>
                      
                      <div>
                        <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                          <Eye className="w-4 h-4 text-primary-500" />
                          <span>Answer Visibility</span>
                        </label>
                        <select
                          value={formData.showAnswers}
                          onChange={(e) => setFormData({ ...formData, showAnswers: e.target.value })}
                          className="w-full px-4 py-3 sm:py-4 border-2 border-gray-200 rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-200 transition-all duration-200 text-base sm:text-lg appearance-none bg-white"
                        >
                          <option value="live">Show immediately</option>
                          <option value="after">Show after quiz ends</option>
                        </select>
                        
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Step 2: Questions */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl lg:rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <HelpCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white">
                        Questions ({questions.length})
                      </h2>
                      <p className="text-purple-100 text-xs sm:text-sm">Add engaging questions to your quiz</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 sm:p-6 lg:p-8">

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
                          className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
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
                            className={`bg-white rounded-2xl border-2 overflow-hidden group transition-all duration-300 cursor-move ${
                              draggedItem === index 
                                ? 'border-primary-400 shadow-lg scale-[1.02] opacity-95'
                                : dragOverIndex === index 
                                ? 'border-primary-300 shadow-md bg-primary-50'
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
                                              // Check if this option is a duplicate
                                              isDuplicateOption(question, optionIndex, option) && option.trim() !== ''
                                                ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-200 text-red-700'
                                                : question.correctAnswer === optionIndex
                                                ? 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-4 focus:ring-green-200'
                                                : 'border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-200'
                                            }`}
                                            placeholder={`Option ${optionIndex + 1}`}
                                            required
                                          />
                                          
                                          {/* Duplicate warning icon */}
                                          {isDuplicateOption(question, optionIndex, option) && option.trim() !== '' && (
                                            <motion.div
                                              initial={{ scale: 0, rotate: -180 }}
                                              animate={{ scale: 1, rotate: 0 }}
                                              className="flex items-center justify-center w-8 h-8 bg-red-100 border-2 border-red-300 rounded-full ml-2 text-red-600"
                                              title="Duplicate option detected"
                                            >
                                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                              </svg>
                                            </motion.div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  
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
                className="flex flex-col items-center gap-4 pt-8"
              >
                {/* Enable Rating - Styled Toggle Card (UI only) */}
                <div
                  className={`w-full rounded-2xl border transition-all duration-300 p-4 sm:p-5 ${
                    formData.enableRating
                      ? 'bg-gradient-to-r from-primary-50 to-emerald-50 border-primary-200 shadow-md'
                      : 'bg-white border-gray-200 hover:border-primary-200'
                  }`}
                >
                  <label className="flex items-start gap-4 cursor-pointer select-none">
                    {/* Toggle Switch */}
                    <div className="relative inline-flex h-7 w-12 flex-shrink-0 items-center">
                      <input
                        type="checkbox"
                        checked={!!formData.enableRating}
                        onChange={(e) => setFormData({ ...formData, enableRating: e.target.checked })}
                        className="sr-only"
                        aria-label="Enable Quiz Rating"
                      />
                      <div
                        className={`${
                          formData.enableRating ? 'bg-primary-600' : 'bg-gray-300'
                        } h-7 w-12 rounded-full transition-colors duration-300`}
                      />
                      <span
                        className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-300 ${
                          formData.enableRating ? 'translate-x-5' : ''
                        }`}
                      />
                    </div>

                    {/* Text Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <BarChart3 className={`w-4 h-4 ${formData.enableRating ? 'text-primary-600' : 'text-gray-500'}`} />
                        <span className="font-semibold text-gray-900">Enable Quiz Rating</span>
                        {formData.enableRating && (
                          <span className="ml-1 inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                            On
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        Ask participants to rate the quiz at the end (anonymous).
                      </p>
                    </div>
                  </label>
                </div>

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
                      <span className="font-semibold text-gray-900">{Number(formData.questionTime) || 30}s</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-600">Total time</span>
                      <span className="font-semibold text-gray-900">{Math.ceil((questions.length * (Number(formData.questionTime) || 30)) / 60)} min</span>
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
