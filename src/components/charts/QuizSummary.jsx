import React from 'react'
import { motion } from 'framer-motion'
import { Trophy, Users, Target, Clock, CheckCircle, XCircle, BarChart3 } from 'lucide-react'

const QuizSummary = ({ quiz, leaderboard, isVisible = false }) => {
  if (!quiz || !isVisible) return null

  // Calculate overall quiz statistics
  const totalQuestions = quiz.questions?.length || 0
  const totalParticipants = leaderboard.length
  
  // Calculate overall accuracy across all questions
  let totalCorrectAnswers = 0
  let totalAnswersGiven = 0
  let totalPossiblePoints = 0
  let totalEarnedPoints = 0

  leaderboard.forEach(player => {
    if (player.answers && Array.isArray(player.answers)) {
      player.answers.forEach(answer => {
        if (typeof answer === 'object') {
          totalAnswersGiven++
          if (answer.isCorrect) {
            totalCorrectAnswers++
          }
          totalEarnedPoints += answer.score || 0
        }
      })
    }
    totalPossiblePoints += totalQuestions * 100 // Assuming 100 points per question
  })

  const overallAccuracy = totalAnswersGiven > 0 ? Math.round((totalCorrectAnswers / totalAnswersGiven) * 100) : 0
  const averageScore = totalParticipants > 0 ? Math.round(totalEarnedPoints / totalParticipants) : 0

  // Question-by-question breakdown
  const questionBreakdown = quiz.questions?.map((question, index) => {
    let correctCount = 0
    let totalResponses = 0

    leaderboard.forEach(player => {
      if (player.answers && Array.isArray(player.answers) && player.answers[index]) {
        totalResponses++
        const answer = player.answers[index]
        if (typeof answer === 'object' && answer.isCorrect) {
          correctCount++
        }
      }
    })

    const questionAccuracy = totalResponses > 0 ? Math.round((correctCount / totalResponses) * 100) : 0

    return {
      questionNumber: index + 1,
      text: question.text,
      type: question.type,
      correctCount,
      totalResponses,
      accuracy: questionAccuracy,
      difficulty: questionAccuracy >= 70 ? 'Easy' : questionAccuracy >= 50 ? 'Medium' : 'Hard'
    }
  }) || []

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6"
    >
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Quiz Summary</h3>
            <p className="text-gray-600">Complete results for "{quiz.title}"</p>
          </div>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center"
        >
          <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-900">{totalParticipants}</div>
          <div className="text-sm text-blue-700">Participants</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center"
        >
          <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-900">{overallAccuracy}%</div>
          <div className="text-sm text-green-700">Overall Accuracy</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 text-center"
        >
          <Trophy className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-900">{averageScore}</div>
          <div className="text-sm text-purple-700">Average Score</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 text-center"
        >
          <CheckCircle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-orange-900">{totalCorrectAnswers}</div>
          <div className="text-sm text-orange-700">Correct Answers</div>
        </motion.div>
      </div>

      {/* Top 3 Performers */}
      <div className="mb-8">
        <h4 className="text-lg font-bold text-gray-900 mb-4">🏆 Top Performers</h4>
        <div className="space-y-2">
          {leaderboard.slice(0, 3).map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                index === 0 ? 'bg-yellow-50 border-yellow-300' :
                index === 1 ? 'bg-gray-50 border-gray-300' :
                'bg-orange-50 border-orange-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-gray-400' :
                  'bg-orange-500'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{player.name}</div>
                  <div className="text-sm text-gray-600">
                    {player.correctAnswers || 0}/{totalQuestions} correct answers
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900">{player.score} pts</div>
                <div className="text-sm text-gray-600">
                  {totalQuestions > 0 ? Math.round(((player.correctAnswers || 0) / totalQuestions) * 100) : 0}% accuracy
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Question-by-Question Breakdown */}
      <div className="mb-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">📊 Question Analysis</h4>
        <div className="space-y-3">
          {questionBreakdown.map((q, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-gray-50 rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">
                    Question {q.questionNumber}: {q.text}
                  </div>
                  <div className="text-sm text-gray-600 capitalize">
                    Type: {q.type} • Difficulty: {q.difficulty}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className={`text-lg font-bold ${
                    q.accuracy >= 70 ? 'text-green-600' :
                    q.accuracy >= 50 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {q.accuracy}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {q.correctCount}/{q.totalResponses}
                  </div>
                </div>
              </div>
              
              {/* Visual accuracy bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${q.accuracy}%` }}
                  transition={{ delay: 0.2 * index, duration: 1 }}
                  className={`h-2 rounded-full ${
                    q.accuracy >= 70 ? 'bg-green-500' :
                    q.accuracy >= 50 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* All Participants Performance */}
      <div>
        <h4 className="text-lg font-bold text-gray-900 mb-4">👥 All Participants</h4>
        <div className="max-h-64 overflow-y-auto space-y-2">
          {leaderboard.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * index }}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-gray-700">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{player.name}</div>
                  <div className="text-xs text-gray-600">
                    {player.correctAnswers || 0}/{totalQuestions} correct
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">{player.score} pts</div>
                <div className="text-xs text-gray-600">
                  {totalQuestions > 0 ? Math.round(((player.correctAnswers || 0) / totalQuestions) * 100) : 0}%
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default QuizSummary