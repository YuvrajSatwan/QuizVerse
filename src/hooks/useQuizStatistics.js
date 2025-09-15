import { useState, useEffect, useCallback } from 'react'
import { collection, query, where, onSnapshot, doc, getDoc, onSnapshot as firestoreOnSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

export const useQuizStatistics = (quizId, currentQuestionIndex = 0) => {
  const [answerStats, setAnswerStats] = useState({})
  const [participants, setParticipants] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [questionStatistics, setQuestionStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Calculate answer statistics for the current question (legacy support)
  const calculateAnswerStats = useCallback((participants, questionIndex) => {
    const stats = {}
    
    participants.forEach(participant => {
      if (participant.answers && participant.answers[questionIndex] !== undefined) {
        const answerData = participant.answers[questionIndex]
        const answerIndex = typeof answerData === 'object' ? answerData.answer : answerData
        stats[answerIndex] = (stats[answerIndex] || 0) + 1
      }
    })
    
    return stats
  }, [])

  // Calculate leaderboard with position changes
  const calculateLeaderboard = useCallback((participants) => {
    return participants
      .map(participant => {
        // Calculate total score and correct answers
        const answers = participant.answers || {}
        let totalScore = 0
        let correctAnswers = 0
        
        Object.entries(answers).forEach(([questionIndex, answerData]) => {
          if (typeof answerData === 'object' && answerData.score) {
            totalScore += answerData.score
            if (answerData.isCorrect) {
              correctAnswers++
            }
          }
        })
        
        return {
          id: participant.id,
          name: participant.name || 'Anonymous',
          score: totalScore,
          correctAnswers,
          answers: participant.answers,
          joinedAt: participant.joinedAt,
          lastAnswered: participant.lastAnswered
        }
      })
      .sort((a, b) => {
        // Sort by score first, then by time (earlier joiners win ties)
        if (b.score !== a.score) {
          return b.score - a.score
        }
        return new Date(a.joinedAt) - new Date(b.joinedAt)
      })
  }, [])

  // Real-time listener for participants and their answers
  useEffect(() => {
    if (!quizId) {
      setLoading(false)
      return
    }

    console.log('📊 Setting up quiz statistics listener for:', quizId)
    
    const unsubscribes = []

    // Listen for participants in this quiz (legacy structure for leaderboard)
    const participantsQuery = query(
      collection(db, `quizzes/${quizId}/players`)
    )

    const participantsUnsubscribe = onSnapshot(
      participantsQuery,
      (snapshot) => {
        try {
          const participantData = []
          
          snapshot.forEach((doc) => {
            participantData.push({
              id: doc.id,
              ...doc.data()
            })
          })

          console.log(`📈 Participants updated: ${participantData.length} participants`)
          
          // Update participants
          setParticipants(participantData)
          
          // Calculate leaderboard
          const currentLeaderboard = calculateLeaderboard(participantData)
          setLeaderboard(currentLeaderboard)
          
          setError(null)
        } catch (err) {
          console.error('Error processing participants:', err)
          setError(err.message)
        }
      },
      (err) => {
        console.error('Participants listener error:', err)
        setError('Failed to load participants data')
      }
    )
    unsubscribes.push(participantsUnsubscribe)

    // Listen for enhanced question statistics
    const questionStatsUnsubscribe = firestoreOnSnapshot(
      doc(db, `quizStatistics/${quizId}/questions`, `question_${currentQuestionIndex}`),
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const questionData = snapshot.data()
            setQuestionStatistics(questionData)
            setAnswerStats(questionData.answerDistribution || {})
            console.log(`📊 Question ${currentQuestionIndex} stats updated:`, questionData)
          } else {
            // Fallback to legacy calculation if enhanced stats don't exist
            console.log('📊 Using legacy statistics calculation')
            const legacyStats = calculateAnswerStats(participants, currentQuestionIndex)
            setAnswerStats(legacyStats)
          }
          setLoading(false)
        } catch (err) {
          console.error('Error processing question statistics:', err)
          // Fallback to legacy method
          const legacyStats = calculateAnswerStats(participants, currentQuestionIndex)
          setAnswerStats(legacyStats)
          setLoading(false)
        }
      },
      (err) => {
        console.warn('Question statistics listener error, using fallback:', err.message)
        // Use legacy calculation as fallback
        const legacyStats = calculateAnswerStats(participants, currentQuestionIndex)
        setAnswerStats(legacyStats)
        setLoading(false)
      }
    )
    unsubscribes.push(questionStatsUnsubscribe)

    return () => {
      console.log('📊 Cleaning up quiz statistics listeners')
      unsubscribes.forEach(unsubscribe => unsubscribe())
    }
  }, [quizId, currentQuestionIndex, calculateAnswerStats, calculateLeaderboard, participants])

  // Update answer stats when question changes
  useEffect(() => {
    if (participants.length > 0) {
      const newAnswerStats = calculateAnswerStats(participants, currentQuestionIndex)
      setAnswerStats(newAnswerStats)
      console.log(`📊 Answer stats for Q${currentQuestionIndex + 1}:`, newAnswerStats)
    }
  }, [currentQuestionIndex, participants, calculateAnswerStats])

  // Get participant by ID
  const getParticipantById = useCallback((participantId) => {
    return participants.find(p => p.id === participantId)
  }, [participants])

  // Get answer statistics for a specific question
  const getQuestionStats = useCallback((questionIndex) => {
    return calculateAnswerStats(participants, questionIndex)
  }, [participants, calculateAnswerStats])

  // Get participation rate (how many participants have answered current question)
  const getParticipationRate = useCallback(() => {
    if (participants.length === 0) return 0
    
    const answeredCount = participants.filter(p => 
      p.answers && p.answers[currentQuestionIndex] !== undefined
    ).length
    
    return Math.round((answeredCount / participants.length) * 100)
  }, [participants, currentQuestionIndex])

  // Get average score
  const getAverageScore = useCallback(() => {
    if (participants.length === 0) return 0
    
    const totalScore = participants.reduce((sum, p) => {
      const answers = p.answers || {}
      let participantScore = 0
      
      Object.values(answers).forEach(answerData => {
        if (typeof answerData === 'object' && answerData.score) {
          participantScore += answerData.score
        }
      })
      
      return sum + participantScore
    }, 0)
    
    return Math.round(totalScore / participants.length)
  }, [participants])

  // Get top performers (top 3)
  const getTopPerformers = useCallback(() => {
    return leaderboard.slice(0, 3)
  }, [leaderboard])

  return {
    // Data
    answerStats,
    participants,
    leaderboard,
    questionStatistics,
    
    // State
    loading,
    error,
    
    // Utility functions
    getParticipantById,
    getQuestionStats,
    getParticipationRate,
    getAverageScore,
    getTopPerformers,
    
    // Computed values
    totalParticipants: participants.length,
    participationRate: getParticipationRate(),
    averageScore: getAverageScore(),
    topPerformers: getTopPerformers(),
    
    // Enhanced statistics (if available)
    accuracyRate: questionStatistics?.accuracyRate || 0,
    totalAnswers: questionStatistics?.totalAnswers || 0,
    correctCount: questionStatistics?.correctCount || 0,
    incorrectCount: questionStatistics?.incorrectCount || 0,
    responseTime: questionStatistics?.responseTime || null
  }
}