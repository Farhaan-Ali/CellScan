
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/DashboardSidebar";
import QuizComponent from "@/components/QuizComponent";
import QuizResults from "@/components/QuizResults";

const Quiz = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const navigate = useNavigate();

  // Fetch questions from the database
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data, error } = await supabase
          .from("questions")
          .select("*")
          .order("id");

        if (error) throw error;
        setQuestions(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching questions:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch quiz questions. Please try again later.",
        });
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  // Handle response saving
  const handleResponse = async (questionId, response) => {
    try {
      // Store response in state
      const newResponses = { ...responses, [questionId]: response };
      setResponses(newResponses);

      // Get the current question
      const currentQuestion = questions[currentQuestionIndex];
      
      // Determine the next question based on the response
      let nextQuestionIndex;
      if (currentQuestion.next_question_logic && currentQuestion.next_question_logic[response]) {
        // Use logic mapping if applicable
        const nextQuestionId = currentQuestion.next_question_logic[response];
        nextQuestionIndex = questions.findIndex(q => q.id === nextQuestionId);
      } else if (currentQuestion.next_question_logic && currentQuestion.next_question_logic.default) {
        // Use default if specific mapping not found
        const nextQuestionId = currentQuestion.next_question_logic.default;
        nextQuestionIndex = questions.findIndex(q => q.id === nextQuestionId);
      } else {
        // Just go to the next question in sequence
        nextQuestionIndex = currentQuestionIndex + 1;
      }

      // If there are more questions, go to the next one
      if (nextQuestionIndex < questions.length && nextQuestionIndex >= 0) {
        setCurrentQuestionIndex(nextQuestionIndex);
      } else {
        // Quiz is completed, save all responses to the database
        await saveAllResponses(newResponses);
        calculateRiskScore(newResponses);
        setQuizCompleted(true);
      }

    } catch (error) {
      console.error("Error handling response:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process your response. Please try again.",
      });
    }
  };

  // Save all responses to the database
  const saveAllResponses = async (allResponses) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You need to be logged in to save quiz results.",
      });
      navigate("/login");
      return;
    }

    try {
      // Loop through responses and save each one
      for (const [questionId, response] of Object.entries(allResponses)) {
        const { error } = await supabase
          .from("user_responses")
          .insert({
            user_id: user.id,
            question_id: parseInt(questionId),
            response: typeof response === 'object' ? JSON.stringify(response) : response.toString()
          });

        if (error) throw error;
      }
      
      toast({
        title: "Success",
        description: "Your quiz responses have been saved successfully!",
      });
      
    } catch (error) {
      console.error("Error saving responses:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save your responses. Please try again later.",
      });
    }
  };

  // Calculate risk score based on responses
  const calculateRiskScore = async (allResponses) => {
    let totalScore = 0;
    
    // Calculate score based on responses and question weights
    for (const question of questions) {
      const response = allResponses[question.id];
      
      if (!response) continue;
      
      // Different calculation based on question type
      switch (question.question_type) {
        case 'boolean':
          if (response === 'Yes') {
            totalScore += question.weight;
          }
          break;
        case 'range':
          // For range, we normalize the score based on the range
          const range = question.options.max - question.options.min;
          const normalizedValue = (response - question.options.min) / range;
          totalScore += Math.round(normalizedValue * question.weight);
          break;
        case 'select':
          // For select, we assign different weights based on the selection
          // This is simplified - you might want a more complex mapping
          const options = question.options.options;
          const responseIndex = options.indexOf(response);
          const optionScore = (responseIndex / (options.length - 1)) * question.weight;
          totalScore += Math.round(optionScore);
          break;
      }
    }
    
    setScore(totalScore);
    
    // Fetch the appropriate risk assessment based on the score
    try {
      const { data, error } = await supabase
        .from("risk_assessments")
        .select("*")
        .lte("min_score", totalScore)
        .gte("max_score", totalScore)
        .single();
        
      if (error) throw error;
      setRiskAssessment(data);
      
    } catch (error) {
      console.error("Error fetching risk assessment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to determine your risk assessment. Please try again later.",
      });
    }
  };

  // Reset the quiz
  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setResponses({});
    setQuizCompleted(false);
    setScore(0);
    setRiskAssessment(null);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <DashboardSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-6">
          <div className="flex flex-col gap-8 max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-white rounded-xl border border-cancer-blue/10 shadow-sm p-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  <span className="text-gradient bg-gradient-to-r from-cancer-blue to-cancer-purple bg-clip-text text-transparent">
                    Cancer Risk Assessment Quiz
                  </span>
                </h1>
                <p className="text-gray-600">
                  Answer a few questions to help us assess your cancer risk factors.
                </p>
              </div>
            </motion.div>
            
            {isLoading ? (
              <div className="bg-white rounded-xl border border-cancer-blue/10 shadow-sm p-6 flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cancer-blue"></div>
              </div>
            ) : quizCompleted ? (
              <QuizResults 
                score={score} 
                riskAssessment={riskAssessment} 
                resetQuiz={resetQuiz} 
              />
            ) : questions.length > 0 ? (
              <QuizComponent 
                question={questions[currentQuestionIndex]} 
                onResponse={handleResponse}
                currentQuestion={currentQuestionIndex + 1}
                totalQuestions={questions.length}
              />
            ) : (
              <div className="bg-white rounded-xl border border-cancer-blue/10 shadow-sm p-6">
                <p className="text-center text-gray-600">No questions available. Please try again later.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
