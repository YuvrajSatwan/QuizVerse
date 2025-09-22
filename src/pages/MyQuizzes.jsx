import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Pencil, Play, Trash2, Loader2, Plus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useQuiz } from '../contexts/QuizContext'
import { useToast } from '../contexts/ToastContext'
import { listDrafts, deleteDraft, getDraft, saveDraft as saveDraftRemote } from '../services/DraftsService'
import { listHostedQuizzes } from '../services/QuizzesService'

const MyQuizzes = () => {
  const { currentUser } = useAuth()
  const { createQuiz } = useQuiz()
  const { success, error } = useToast()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('drafts') // 'drafts' | 'previous'
  const [loadingDrafts, setLoadingDrafts] = useState(true)
  const [loadingPrevious, setLoadingPrevious] = useState(true)
  const [drafts, setDrafts] = useState([])
  const [previous, setPrevious] = useState([])

  const isGuest = !currentUser || currentUser.isGuest

  // Load drafts
  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        setLoadingDrafts(true)
        if (isGuest) {
          const saved = localStorage.getItem('quizDraft')
          if (saved) {
            const data = JSON.parse(saved)
            if (active) setDrafts([{ id: 'local', ...data }])
          } else {
            if (active) setDrafts([])
          }
        } else {
          const items = await listDrafts(currentUser.uid)
          if (active) setDrafts(items)
        }
      } catch (e) {
        console.error(e)
        error('Failed to load drafts')
      } finally {
        if (active) setLoadingDrafts(false)
      }
    }
    load()
    return () => { active = false }
  }, [currentUser, isGuest, error])

  // Load previous quizzes
  useEffect(() => {
    let active = true
    const loadPrev = async () => {
      try {
        setLoadingPrevious(true)
        if (!currentUser || currentUser.isGuest) {
          if (active) setPrevious([])
          return
        }
        const items = await listHostedQuizzes(currentUser.uid)
        if (active) setPrevious(items)
      } catch (e) {
        console.error(e)
        error('Failed to load previous quizzes')
      } finally {
        if (active) setLoadingPrevious(false)
      }
    }
    loadPrev()
    return () => { active = false }
  }, [currentUser, error])

  const handleEdit = async (draftId) => {
    if (isGuest) {
      navigate('/create') // Create will auto-load local draft
      return
    }
    navigate(`/create?draftId=${draftId}`)
  }

  const handleLaunch = async (draft) => {
    try {
      // Validate minimal fields
      const { formData, questions } = draft
      if (!formData?.title || !Array.isArray(questions) || questions.length === 0) {
        error('Draft is incomplete. Please edit and complete before launching.')
        return
      }

      const sanitizedQuestionTime = Number(formData.questionTime) || 30

      const quizData = {
        title: formData.title,
        description: formData.description || '',
        showAnswers: formData.showAnswers || 'live',
        enableRating: !!formData.enableRating,
        questionTime: sanitizedQuestionTime,
        questions: questions.map(q => ({
          text: q.text,
          type: q.type,
          options: q.type === 'mcq' ? q.options : [],
          correctAnswer: q.correctAnswer
        })),
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.uid || `guest_${Date.now()}`,
        status: 'waiting',
        currentQuestion: 0,
        showResults: false,
        showLeaderboard: false
      }
      const quizId = await createQuiz(quizData)
      success('Quiz launched!')

      // Mark this client as the host for this quiz
      const hostId = currentUser?.uid || `guest_${Date.now()}`
      localStorage.setItem('userId', hostId)
      localStorage.setItem('isQuizHost', quizId)

      // Save lightweight meta so Create page can show info on success screen
      try {
        sessionStorage.setItem('launchedDraftMeta', JSON.stringify({
          title: formData.title || '',
          questionTime: sanitizedQuestionTime,
          questionsLength: Array.isArray(questions) ? questions.length : 0
        }))
      } catch {}

      // Remove draft after launch
      if (isGuest && draft.id === 'local') {
        try { localStorage.removeItem('quizDraft') } catch {}
        setDrafts(prev => prev.filter(d => d.id !== 'local'))
      } else if (!isGuest && draft.id !== 'local') {
        await deleteDraft(currentUser.uid, draft.id)
        setDrafts(prev => prev.filter(d => d.id !== draft.id))
      }

      // Refresh previous list so the launched quiz appears immediately
      if (!isGuest && currentUser?.uid) {
        try {
          const updated = await listHostedQuizzes(currentUser.uid)
          setPrevious(updated)
        } catch {}
      }

      // Navigate to Create page success screen instead of Quiz Room
      const code = quizId.slice(-6).toUpperCase()
      navigate(`/create?launchedId=${quizId}&code=${code}`)
    } catch (e) {
      console.error(e)
      error('Failed to launch quiz')
    }
  }

  const handleDelete = async (draftId) => {
    try {
      if (isGuest && draftId === 'local') {
        localStorage.removeItem('quizDraft')
        setDrafts([])
        success('Draft deleted')
        return
      }
      await deleteDraft(currentUser.uid, draftId)
      setDrafts(prev => prev.filter(d => d.id !== draftId))
      success('Draft deleted')
    } catch (e) {
      console.error(e)
      error('Failed to delete draft')
    }
  }

  const handleLaunchFromPrevious = async (q) => {
    try {
      const quizData = {
        title: q.title || 'Untitled Quiz',
        description: q.description || '',
        showAnswers: q.showAnswers || 'live',
        enableRating: !!q.enableRating,
        questionTime: Number(q.questionTime) || 30,
        questions: (q.questions || []).map(item => ({
          text: item.text,
          type: item.type,
          options: item.type === 'mcq' ? (item.options || []) : [],
          correctAnswer: item.correctAnswer
        })),
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.uid || `guest_${Date.now()}`,
        status: 'waiting',
        currentQuestion: 0,
        showResults: false,
        showLeaderboard: false
      }
      const newId = await createQuiz(quizData)
      success('Quiz duplicated and ready!')

      const hostId = currentUser?.uid || `guest_${Date.now()}`
      localStorage.setItem('userId', hostId)
      localStorage.setItem('isQuizHost', newId)

      try {
        sessionStorage.setItem('launchedDraftMeta', JSON.stringify({
          title: quizData.title,
          questionTime: quizData.questionTime,
          questionsLength: quizData.questions.length
        }))
      } catch {}

      const code = newId.slice(-6).toUpperCase()
      navigate(`/create?launchedId=${newId}&code=${code}`)
    } catch (e) {
      console.error(e)
      error('Failed to launch previous quiz')
    }
  }

  const handleEditFromPrevious = async (q) => {
    try {
      const draftPayload = {
        formData: {
          title: q.title || 'Untitled Quiz',
          description: q.description || '',
          showAnswers: q.showAnswers || 'live',
          enableRating: !!q.enableRating,
          questionTime: Number(q.questionTime) || 30
        },
        questions: (q.questions || []).map(item => ({
          id: Date.now() + Math.random(),
          text: item.text,
          type: item.type,
          options: item.type === 'mcq' ? (item.options || []) : [],
          correctAnswer: item.correctAnswer
        })),
        timestamp: Date.now()
      }

      if (!currentUser || currentUser.isGuest) {
        // Guests: save locally and go to editor
        localStorage.setItem('quizDraft', JSON.stringify(draftPayload))
        success('Loaded quiz into editor')
        navigate('/create')
      } else {
        // Signed-in: create remote draft and open in editor
        const id = await saveDraftRemote(currentUser.uid, draftPayload)
        success('Loaded quiz into editor')
        navigate(`/create?draftId=${id}`)
      }
    } catch (e) {
      console.error(e)
      error('Failed to open quiz for editing')
    }
  }

  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center shadow">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">My Quizzes</h1>
          </div>
          <button
            onClick={() => navigate('/create')}
            className="btn btn-primary px-5 py-2.5 rounded-xl"
          >
            <Plus className="w-4 h-4" />
            <span>Create New</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 bg-white rounded-xl p-1 border border-gray-200 w-full max-w-md">
          <button
            onClick={() => setActiveTab('drafts')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab==='drafts' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Draft Quizzes
          </button>
          <button
            onClick={() => setActiveTab('previous')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab==='previous' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Previous Quizzes
          </button>
        </div>

        {activeTab === 'drafts' ? (
          loadingDrafts ? (
            <div className="flex items-center justify-center py-16 text-gray-600">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading drafts...
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 mx-auto mb-4 flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No drafts yet</h3>
              <p className="text-gray-500 mt-1">Save a draft from the Create Quiz page to see it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {drafts.map((d) => (
                <div key={d.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                  <div>
                    <div className="font-semibold text-gray-900">{d.formData?.title || 'Untitled Quiz'}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Draft</span>
                      <span>
                        {Array.isArray(d.questions) ? d.questions.length : 0} questions • Updated {d.updatedAt?.toDate ? d.updatedAt.toDate().toLocaleString() : 'recently'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(d.id)}
                      className="btn btn-outline px-4 py-2 rounded-xl"
                    >
                      <Pencil className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleLaunch(d)}
                      className="btn btn-primary px-4 py-2 rounded-xl"
                    >
                      <Play className="w-4 h-4" />
                      <span>Launch</span>
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          loadingPrevious ? (
            <div className="flex items-center justify-center py-16 text-gray-600">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading previous quizzes...
            </div>
          ) : (!currentUser || currentUser.isGuest) ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Sign in to see your previous quizzes</h3>
              <p className="text-gray-500 mt-1">Previous quizzes are linked to your account.</p>
            </div>
          ) : previous.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 mx-auto mb-4 flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No previous quizzes</h3>
              <p className="text-gray-500 mt-1">Launch a quiz to see it here for quick reuse later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {previous.map((q) => (
                <div key={q.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                  <div>
                    <div className="font-semibold text-gray-900">{q.title || 'Untitled Quiz'}</div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {(q.questions?.length || 0)} questions • <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{q.status || 'waiting'}</span> • {q.createdAt?.toDate ? q.createdAt.toDate().toLocaleString() : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLaunchFromPrevious(q)}
                      className="btn btn-primary px-4 py-2 rounded-xl"
                    >
                      <Play className="w-4 h-4" />
                      <span>Launch Again</span>
                    </button>
                    <button
                      onClick={() => handleEditFromPrevious(q)}
                      className="btn btn-outline px-4 py-2 rounded-xl"
                    >
                      <Pencil className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default MyQuizzes
