import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardSidebar from '@/components/DashboardSidebar';
import AkinatorQuiz from '@/components/AkinatorQuiz';
import { 
  Heart,
  Wind,
  CircleDashed,
  Activity,
  Stethoscope,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Attempt to load Helmet, but don't fail if not available
let Helmet: any;
try {
  // Dynamic import to prevent build errors
  Helmet = require('react-helmet-async').Helmet;
} catch (error) {
  // Create a placeholder component if react-helmet-async is not available
  Helmet = ({ children }: { children: React.ReactNode }) => null;
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const RiskAssessment: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [quizStarted, setQuizStarted] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  useEffect(() => {
    // Set document title manually as a fallback for Helmet
    document.title = "Risk Assessment | CellScan";
  }, []);

  const categories: Category[] = [
    {
      id: 'breast',
      name: 'Breast Cancer',
      icon: <Heart className="h-6 w-6" />,
      description: 'Answer questions about breast health, family history, and risk factors.',
      color: 'bg-pink-500',
    },
    {
      id: 'skin',
      name: 'Skin Cancer',
      icon: <CircleDashed className="h-6 w-6" />,
      description: 'Evaluate moles, skin changes, and UV exposure risks.',
      color: 'bg-amber-500',
    },
    {
      id: 'lung',
      name: 'Lung Cancer',
      icon: <Wind className="h-6 w-6" />,
      description: 'Assess respiratory symptoms, smoking history, and environmental factors.',
      color: 'bg-blue-500',
    },
    {
      id: 'general',
      name: 'General Health',
      icon: <Activity className="h-6 w-6" />,
      description: 'Overall health assessment based on lifestyle, symptoms, and medical history.',
      color: 'bg-emerald-500',
    },
  ];

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
  };

  const handleResetSelection = () => {
    setSelectedCategory(null);
    setQuizStarted(false);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    },
    hover: {
      scale: 1.02,
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <DashboardSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <div className="flex-1 flex flex-col overflow-y-auto">
        {Helmet && (
          <Helmet>
            <title>Risk Assessment | CellScan</title>
          </Helmet>
        )}

        <div className="p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              Cancer Risk Assessment
            </h1>
            <p className="text-gray-600">
              Answer a series of questions to help understand your potential risk factors.
            </p>
          </div>

          {!selectedCategory && (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {categories.map((category) => (
                <motion.div
                  key={category.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer"
                  variants={itemVariants}
                  whileHover="hover"
                  onClick={() => handleCategorySelect(category.id)}
                >
                  <div className="flex items-center p-5">
                    <div className={`${category.color} rounded-full p-3 text-white mr-4`}>
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{category.name}</h3>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {selectedCategory && !quizStarted && (
            <motion.div
              className="bg-white rounded-xl shadow-md border border-gray-100 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center mb-8">
                <div className={`${categories.find(c => c.id === selectedCategory)?.color} rounded-full p-4 inline-block text-white mb-4`}>
                  {categories.find(c => c.id === selectedCategory)?.icon}
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {categories.find(c => c.id === selectedCategory)?.name} Risk Assessment
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  This interactive assessment will ask you a series of questions to help understand your potential risk factors 
                  for {categories.find(c => c.id === selectedCategory)?.name.toLowerCase()}.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
                <div className="flex">
                  <Stethoscope className="h-5 w-5 text-blue-500 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-700 mb-1">
                      Before you begin
                    </h3>
                    <p className="text-sm text-blue-600">
                      You'll be asked questions about your medical history, family history, 
                      lifestyle factors, and any symptoms you may have experienced. Your answers 
                      will be kept private and used only to generate your risk assessment.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-700 mb-1">
                      Important disclaimer
                    </h3>
                    <p className="text-sm text-yellow-600">
                      This assessment is for informational purposes only and does not constitute medical advice. 
                      It cannot diagnose cancer or other medical conditions. Always consult with a qualified 
                      healthcare provider for proper diagnosis and treatment.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
                <Button
                  onClick={handleResetSelection}
                  className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Back to Categories
                </Button>
                <Button
                  onClick={handleStartQuiz}
                  className="bg-gradient-to-r from-cancer-blue to-cancer-purple hover:from-cancer-purple hover:to-cancer-blue text-white"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Start Assessment
                </Button>
              </div>
            </motion.div>
          )}

          {selectedCategory && quizStarted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <AkinatorQuiz />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskAssessment; 