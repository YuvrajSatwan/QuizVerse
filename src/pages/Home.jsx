import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Play, 
  Edit3, 
  Share2, 
  Gamepad2,
  Brain,
  Users,
  Trophy,
  ArrowRight
} from 'lucide-react'

const Home = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  const workflowSteps = [
    {
      icon: Edit3,
      title: "Create Quiz",
      description: "Design your quiz with custom questions, multiple choice, true/false, or short answers",
      features: ["Multiple question types", "Custom time limits", "Instant or delayed results"],
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      icon: Share2,
      title: "Share Code",
      description: "Get a unique 6-digit code that participants can use to join from any device",
      features: ["Easy 6-digit codes", "No app downloads", "Works on any device"],
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      iconColor: "text-green-600"
    },
    {
      icon: Gamepad2,
      title: "Play Live",
      description: "Real-time interactive experience with live leaderboards and instant feedback",
      features: ["Live leaderboards", "Real-time updates", "Instant scoring"],
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600"
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-16">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            variants={floatingVariants}
            animate="animate"
            className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-primary-200/30 to-primary-300/30 rounded-2xl backdrop-blur-sm"
          />
          <motion.div
            variants={floatingVariants}
            animate="animate"
            transition={{ delay: 2 }}
            className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-br from-secondary-200/30 to-secondary-300/30 rounded-2xl backdrop-blur-sm"
          />
          <motion.div
            variants={floatingVariants}
            animate="animate"
            transition={{ delay: 4 }}
            className="absolute bottom-40 left-20 w-24 h-24 bg-gradient-to-br from-accent-200/30 to-accent-300/30 rounded-2xl backdrop-blur-sm"
          />
        </div>

        {/* Hero Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 text-center max-w-4xl mx-auto"
        >
          <motion.div variants={itemVariants} className="mb-8">
            <motion.div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl mb-6 shadow-glow">
              <Brain className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Welcome to{' '}
              <span className="text-gradient">QuizVerse</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Create, share, and play interactive quizzes in real-time with a beautiful, modern interface
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              to="/create"
              className="group btn btn-primary text-lg px-8 py-4"
            >
              <Plus className="w-5 h-5" />
              <span>Create Quiz</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/join"
              className="group btn btn-secondary text-lg px-8 py-4"
            >
              <Play className="w-5 h-5" />
              <span>Join Quiz</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Floating Icons */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ y: [-20, 20, -20] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-32 left-16 text-primary-400/60"
          >
            <Users className="w-12 h-12" />
          </motion.div>
          <motion.div
            animate={{ y: [20, -20, 20] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-48 right-24 text-secondary-400/60"
          >
            <Trophy className="w-10 h-10" />
          </motion.div>
          <motion.div
            animate={{ y: [-15, 15, -15] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-32 left-32 text-accent-400/60"
          >
            <Brain className="w-8 h-8" />
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-gray-600 text-lg">
              Three simple steps to create and play
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Edit3 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Create</h3>
              <p className="text-gray-600">Add questions and answers</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Share</h3>
              <p className="text-gray-600">Get a 6-digit code to share</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Gamepad2 className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Play</h3>
              <p className="text-gray-600">Join and compete in real-time</p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
