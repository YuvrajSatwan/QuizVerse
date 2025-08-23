import React, { createContext, useContext, useState, useEffect } from 'react'
import { 
  doc, 
  onSnapshot, 
  collection, 
  addDoc, 
  updateDoc,
  getDoc,
  serverTimestamp,
  query,
  orderBy,
  limit
} from 'firebase/firestore'
import { db } from '../firebase/config'

const QuizContext = createContext()

export function useQuiz() {
  return useContext(QuizContext)
}

export function QuizProvider({ children }) {
  const [currentQuiz, setCurrentQuiz] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [quizState, setQuizState] = useState('waiting') // waiting, active, finished
  const [players, setPlayers] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [timeLeft, setTimeLeft] = useState(0)

  const createQuiz = async (quizData) => {
    try {
      console.log('Creating quiz with data:', quizData)
      console.log('Firestore db instance:', db)
      
      const quizRef = await addDoc(collection(db, 'quizzes'), {
        ...quizData,
        createdAt: serverTimestamp(),
        status: 'waiting',
        currentQuestion: 0,
        players: [],
        leaderboard: []
      })
      
      console.log('Quiz created successfully with ID:', quizRef.id)
      return quizRef.id
    } catch (error) {
      console.error('Error creating quiz:', error)
      console.error('Error details:', error.message, error.code)
      throw error
    }
  }

  const checkQuizExists = async (quizId) => {
    try {
      const quizDoc = await getDoc(doc(db, 'quizzes', quizId))
      return quizDoc.exists()
    } catch (error) {
      console.error('Error checking quiz existence:', error)
      return false
    }
  }

  const joinQuiz = async (quizId, playerName) => {
    try {
      // First check if the quiz exists
      const quizExists = await checkQuizExists(quizId)
      if (!quizExists) {
        throw new Error('Quiz not found')
      }

      const playerRef = await addDoc(collection(db, `quizzes/${quizId}/players`), {
        name: playerName,
        score: 0,
        joinedAt: serverTimestamp(),
        answers: []
      })
      
      return playerRef.id
    } catch (error) {
      console.error('Error joining quiz:', error)
      throw error
    }
  }

  const startQuiz = async (quizId) => {
    try {
      await updateDoc(doc(db, 'quizzes', quizId), {
        status: 'active',
        startedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error starting quiz:', error)
      throw error
    }
  }

  const submitAnswer = async (quizId, playerId, questionIndex, answer) => {
    try {
      // Update player's answer
      await updateDoc(doc(db, `quizzes/${quizId}/players/${playerId}`), {
        [`answers.${questionIndex}`]: answer,
        lastAnsweredAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error submitting answer:', error)
      throw error
    }
  }

  const nextQuestion = async (quizId) => {
    try {
      const quizRef = doc(db, 'quizzes', quizId)
      const quizDoc = await quizRef.get()
      const currentQuestionIndex = quizDoc.data().currentQuestion || 0
      
      await updateDoc(quizRef, {
        currentQuestion: currentQuestionIndex + 1
      })
    } catch (error) {
      console.error('Error moving to next question:', error)
      throw error
    }
  }

  const endQuiz = async (quizId) => {
    try {
      await updateDoc(doc(db, 'quizzes', quizId), {
        status: 'finished',
        endedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error ending quiz:', error)
      throw error
    }
  }

  const value = {
    currentQuiz,
    currentQuestion,
    quizState,
    players,
    leaderboard,
    timeLeft,
    createQuiz,
    joinQuiz,
    checkQuizExists,
    startQuiz,
    submitAnswer,
    nextQuestion,
    endQuiz,
    setCurrentQuiz,
    setCurrentQuestion,
    setQuizState,
    setPlayers,
    setLeaderboard,
    setTimeLeft
  }

  return (
    <QuizContext.Provider value={value}>
      {children}
    </QuizContext.Provider>
  )
}

