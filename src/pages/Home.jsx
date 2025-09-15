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
  ArrowRight,
  Check,
  ChevronRight,
  Mail,
  Github,
  Twitter,
  ExternalLink
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
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-24">
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
              Transform learning into an adventure. 
              <span className="text-primary-600 font-semibold">Ignite curiosity, unlock potential.</span>
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
      <section className="py-24 px-4 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">
              Three simple steps to get started
            </p>
          </motion.div>

          {/* Interactive Workflow Steps */}
          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-green-200 transform -translate-y-1/2" />
            
            <div className="grid lg:grid-cols-3 gap-12 lg:gap-8">
              {workflowSteps.map((step, index) => {
                const Icon = step.icon
                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: index * 0.2 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -8 }}
                    className="relative group cursor-pointer"
                  >
                    {/* Step Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group-hover:border-primary-200 relative z-10">
                      {/* Step Number */}
                      <div className="absolute -top-4 left-6">
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center font-bold text-sm shadow-lg`}>
                          {index + 1}
                        </div>
                      </div>
                      
                      {/* Icon */}
                      <div className={`w-16 h-16 rounded-2xl ${step.bgColor} flex items-center justify-center mb-4 mx-auto group-hover:scale-105 transition-transform duration-300`}>
                        <Icon className={`w-8 h-8 ${step.iconColor}`} />
                      </div>
                      
                      {/* Content */}
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {step.title}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {step.description.split('.')[0]}.
                        </p>
                      </div>
                    </div>
                    
                    {/* Arrow Connector (Hidden on last item) */}
                    {index < workflowSteps.length - 1 && (
                      <div className="hidden lg:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-20">
                        <div className="bg-white rounded-full p-2 shadow-md border border-gray-200">
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
          
          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            viewport={{ once: true }}
            className="text-center mt-20"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Ready to get started?
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/create"
                className="group bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Create Your First Quiz</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/join"
                className="group bg-white border-2 border-gray-200 hover:border-primary-300 text-gray-700 hover:text-primary-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-primary-50 transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Play className="w-5 h-5" />
                <span>Join a Quiz</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">QuizVerse</span>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Create engaging, interactive quizzes that bring learning to life. Perfect for educators, trainers, and anyone who loves to share knowledge.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-primary-500 rounded-2xl flex items-center justify-center transition-colors duration-300">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-primary-500 rounded-2xl flex items-center justify-center transition-colors duration-300">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-primary-500 rounded-2xl flex items-center justify-center transition-colors duration-300">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            {/* Product */}
            <div>
              <h3 className="text-white font-semibold mb-6">Product</h3>
              <ul className="space-y-3">
                <li><Link to="/create" className="hover:text-white transition-colors duration-300 flex items-center group"><span>Create Quiz</span><ExternalLink className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" /></Link></li>
                <li><Link to="/join" className="hover:text-white transition-colors duration-300 flex items-center group"><span>Join Quiz</span><ExternalLink className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" /></Link></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">Templates</a></li>
              </ul>
            </div>
            
            {/* Support */}
            <div>
              <h3 className="text-white font-semibold mb-6">Support</h3>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-white transition-colors duration-300">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">Status</a></li>
              </ul>
            </div>
            
            {/* Legal */}
            <div>
              <h3 className="text-white font-semibold mb-6">Legal</h3>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-white transition-colors duration-300">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">GDPR</a></li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 QuizVerse. All rights reserved. Made with ❤️ for better learning.
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <span className="text-sm text-gray-400">Powered by modern web technologies</span>
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-500">All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
