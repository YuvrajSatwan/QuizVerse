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
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 pt-20 sm:pt-24">
        {/* Background Elements - Hidden on mobile for better performance */}
        <div className="absolute inset-0 overflow-hidden hidden sm:block">
          <motion.div
            variants={floatingVariants}
            animate="animate"
            className="absolute top-20 left-4 lg:left-10 w-12 h-12 lg:w-20 lg:h-20 bg-gradient-to-br from-primary-200/20 to-primary-300/20 rounded-2xl backdrop-blur-sm"
          />
          <motion.div
            variants={floatingVariants}
            animate="animate"
            transition={{ delay: 2 }}
            className="absolute top-32 lg:top-40 right-4 lg:right-20 w-10 h-10 lg:w-16 lg:h-16 bg-gradient-to-br from-secondary-200/20 to-secondary-300/20 rounded-2xl backdrop-blur-sm"
          />
          <motion.div
            variants={floatingVariants}
            animate="animate"
            transition={{ delay: 4 }}
            className="absolute bottom-32 lg:bottom-40 left-4 lg:left-20 w-16 h-16 lg:w-24 lg:h-24 bg-gradient-to-br from-accent-200/20 to-accent-300/20 rounded-2xl backdrop-blur-sm"
          />
        </div>

        {/* Hero Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 text-center max-w-4xl mx-auto px-2"
        >
          <motion.div variants={itemVariants} className="mb-8 sm:mb-12">
            <motion.div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl mb-4 sm:mb-6 shadow-glow">
              <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 px-2">
              Welcome to{' '}
              <span className="text-gradient block sm:inline">Quizzer</span>
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-4">
              Transform learning into an adventure.{' '}
              <span className="text-primary-600 font-semibold block sm:inline">
                Ignite curiosity, unlock potential.
              </span>
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4">
            <Link
              to="/create"
              className="group btn btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto max-w-sm"
            >
              <Plus className="w-5 h-5" />
              <span>Create Quiz</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/join"
              className="group btn btn-secondary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto max-w-sm"
            >
              <Play className="w-5 h-5" />
              <span>Join Quiz</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Floating Icons - Optimized for mobile */}
        <div className="absolute inset-0 pointer-events-none hidden md:block">
          <motion.div
            animate={{ y: [-20, 20, -20] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-32 left-8 lg:left-16 text-primary-400/60"
          >
            <Users className="w-8 h-8 lg:w-12 lg:h-12" />
          </motion.div>
          <motion.div
            animate={{ y: [20, -20, 20] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-48 right-8 lg:right-24 text-secondary-400/60"
          >
            <Trophy className="w-6 h-6 lg:w-10 lg:h-10" />
          </motion.div>
          <motion.div
            animate={{ y: [-15, 15, -15] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-32 left-8 lg:left-32 text-accent-400/60"
          >
            <Brain className="w-6 h-6 lg:w-8 lg:h-8" />
          </motion.div>
        </div>
        
        {/* Mobile-specific decorative elements */}
        <div className="absolute inset-0 pointer-events-none md:hidden">
          <div className="absolute top-24 right-4 w-6 h-6 bg-primary-200/30 rounded-full" />
          <div className="absolute top-40 left-6 w-4 h-4 bg-secondary-200/30 rounded-full" />
          <div className="absolute bottom-40 right-8 w-8 h-8 bg-accent-200/30 rounded-full" />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              How It Works
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              Three simple steps to get started
            </p>
          </motion.div>

          {/* Interactive Workflow Steps */}
          <div className="relative">
            {/* Connection Line - Only on desktop */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-green-200 transform -translate-y-1/2" />
            
            {/* Mobile: Vertical connector line */}
            <div className="lg:hidden absolute left-6 top-12 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-green-200" />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-8">
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
                    className="relative group"
                  >
                    {/* Step Card */}
                    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group-hover:border-primary-200 relative z-10 ml-0 lg:ml-0">
                      {/* Step Number */}
                      <div className="absolute -top-3 left-6 lg:-top-4 lg:left-6">
                        <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center font-bold text-sm lg:text-base shadow-lg`}>
                          {index + 1}
                        </div>
                      </div>
                      
                      {/* Icon */}
                      <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${step.bgColor} flex items-center justify-center mb-4 mx-auto group-hover:scale-105 transition-transform duration-300 mt-2 lg:mt-0`}>
                        <Icon className={`w-7 h-7 sm:w-8 sm:h-8 ${step.iconColor}`} />
                      </div>
                      
                      {/* Content */}
                      <div className="text-center">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                          {step.title}
                        </h3>
                        <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                          {step.description.split('.')[0]}.
                        </p>
                        
                        {/* Mobile: Show features list */}
                        <div className="lg:hidden mt-4 space-y-2">
                          {step.features.map((feature, featureIndex) => (
                            <div key={featureIndex} className="flex items-center justify-center space-x-2">
                              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                              <span className="text-xs text-gray-600">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Arrow Connector (Desktop only) */}
                    {index < workflowSteps.length - 1 && (
                      <div className="hidden lg:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-20">
                        <div className="bg-white rounded-full p-2 shadow-md border border-gray-200">
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    )}
                    
                    {/* Mobile: Down arrow connector */}
                    {index < workflowSteps.length - 1 && (
                      <div className="lg:hidden flex justify-center mt-6 mb-2 relative z-20">
                        <div className="bg-white rounded-full p-2 shadow-md border border-gray-200">
                          <ChevronRight className="w-5 h-5 text-gray-400 transform rotate-90" />
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
            className="text-center mt-16 sm:mt-20"
          >
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 px-4">
              Ready to get started?
            </h3>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 max-w-lg sm:max-w-none mx-auto">
              <Link
                to="/create"
                className="group bg-primary-500 hover:bg-primary-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 min-h-[48px]"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Create Your First Quiz</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/join"
                className="group bg-white border-2 border-gray-200 hover:border-primary-300 text-gray-700 hover:text-primary-600 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-semibold text-base sm:text-lg hover:bg-primary-50 transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 min-h-[48px]"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Join a Quiz</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Quizzer</span>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed text-sm sm:text-base">
                Create engaging, interactive quizzes that bring learning to life. Perfect for educators, trainers, and anyone who loves to share knowledge.
              </p>
              <div className="flex space-x-3 sm:space-x-4">
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
              <h3 className="text-white font-semibold mb-4 sm:mb-6 text-base sm:text-lg">Product</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li><Link to="/create" className="hover:text-white transition-colors duration-300 flex items-center group text-sm sm:text-base"><span>Create Quiz</span><ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" /></Link></li>
                <li><Link to="/join" className="hover:text-white transition-colors duration-300 flex items-center group text-sm sm:text-base"><span>Join Quiz</span><ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" /></Link></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 text-sm sm:text-base">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 text-sm sm:text-base">Templates</a></li>
              </ul>
            </div>
            
            {/* Support */}
            <div>
              <h3 className="text-white font-semibold mb-4 sm:mb-6 text-base sm:text-lg">Support</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li><a href="#" className="hover:text-white transition-colors duration-300 text-sm sm:text-base">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 text-sm sm:text-base">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 text-sm sm:text-base">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 text-sm sm:text-base">Status</a></li>
              </ul>
            </div>
            
            {/* Legal */}
            <div>
              <h3 className="text-white font-semibold mb-4 sm:mb-6 text-base sm:text-lg">Legal</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li><a href="#" className="hover:text-white transition-colors duration-300 text-sm sm:text-base">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 text-sm sm:text-base">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 text-sm sm:text-base">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 text-sm sm:text-base">GDPR</a></li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-8 sm:mt-12 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-xs sm:text-sm text-center md:text-left">
              © 2024 Quizzer. All rights reserved. Made with ❤️ for better learning.
            </p>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 md:space-x-6">
              <span className="text-xs sm:text-sm text-gray-400 text-center">Powered by modern web technologies</span>
              <div className="flex items-center space-x-2">
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
