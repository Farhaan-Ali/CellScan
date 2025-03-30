import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Info,
  Loader2,
  X
} from 'lucide-react';
import AkinatorResults from './AkinatorResults';

interface AkinatorQuestionOption {
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

interface AkinatorQuestion {
  id: number;
  question_text: string;
  question_type: string;
  options: AkinatorQuestionOption;
  is_root: boolean;
  symptom_category: string;
  next_question_mapping: Record<string, number>;
  risk_score_modifier: number;
}

interface AkinatorResult {
  id: number;
  condition_name: string;
  description: string;
  risk_level: string;
  recommendation: string;
  followup_actions: string[];
  sources: string[];
}

interface AkinatorQuizProps {
  onComplete?: (result: AkinatorResult, score: number) => void;
}

const AkinatorQuiz: React.FC<AkinatorQuizProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [questions, setQuestions] = useState<AkinatorQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<AkinatorQuestion | null>(null);
  const [questionHistory, setQuestionHistory] = useState<AkinatorQuestion[]>([]);
  const [responseHistory, setResponseHistory] = useState<Record<number, any>>({});
  const [currentResponse, setCurrentResponse] = useState<any>(null);
  const [sliderValue, setSliderValue] = useState<number[]>([5]);
  const [riskScore, setRiskScore] = useState<number>(0);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [result, setResult] = useState<AkinatorResult | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [thinking, setThinking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.5, when: "beforeChildren", staggerChildren: 0.2 }
    },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  };

  const questionVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.3 } }
  };

  const optionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    selected: { 
      scale: 1.05, 
      backgroundColor: "rgb(139, 92, 246)",
      color: "white",
      transition: { duration: 0.3 }
    }
  };

  // On component mount, fetch the first (root) question
  useEffect(() => {
    const fetchRootQuestion = async () => {
      try {
        setLoading(true);
        
        // Create a new session ID for this quiz attempt
        const newSessionId = crypto.randomUUID();
        setSessionId(newSessionId);
        
        // Fetch the root question
        const { data, error } = await supabase
          .from('akinator_decision_tree')
          .select('*')
          .eq('is_root', true)
          .single();
        
        if (error) throw error;
        
        if (data) {
          // Parse the JSON fields
          const parsedQuestion = {
            ...data,
            options: typeof data.options === 'string' ? JSON.parse(data.options) : data.options,
            next_question_mapping: typeof data.next_question_mapping === 'string' 
              ? JSON.parse(data.next_question_mapping) 
              : data.next_question_mapping
          };
          
          setCurrentQuestion(parsedQuestion);
          
          // Also fetch all questions for later use
          const { data: allQuestions, error: allQuestionsError } = await supabase
            .from('akinator_decision_tree')
            .select('*');
          
          if (allQuestionsError) throw allQuestionsError;
          
          // Parse the JSON fields for all questions
          const parsedQuestions = allQuestions.map(q => ({
            ...q,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
            next_question_mapping: typeof q.next_question_mapping === 'string' 
              ? JSON.parse(q.next_question_mapping) 
              : q.next_question_mapping
          }));
          
          setQuestions(parsedQuestions);
        }
      } catch (err: any) {
        console.error('Error fetching root question:', err);
        setError('Failed to load the quiz. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRootQuestion();
  }, []);

  // Handle response to current question
  const handleResponse = async (response: any) => {
    if (!currentQuestion) return;
    
    setThinking(true);
    
    try {
      // Save the response
      const newResponseHistory = {
        ...responseHistory,
        [currentQuestion.id]: response
      };
      setResponseHistory(newResponseHistory);
      
      // Calculate risk score
      let newRiskScore = riskScore;
      
      // Basic risk calculation
      if (currentQuestion.question_type === 'boolean' && response === 'Yes') {
        newRiskScore += currentQuestion.risk_score_modifier;
      } else if (currentQuestion.question_type === 'range') {
        // For range, calculate a proportional risk
        const range = currentQuestion.options.max - currentQuestion.options.min;
        const normalizedValue = (response - currentQuestion.options.min) / range;
        newRiskScore += Math.round(normalizedValue * currentQuestion.risk_score_modifier);
      } else if (currentQuestion.question_type === 'select') {
        // For select, use the mapping if available, otherwise use a basic calculation
        const options = currentQuestion.options.options || [];
        if (options.length > 0) {
          const responseIndex = options.indexOf(response);
          const optionScore = (responseIndex / (options.length - 1)) * currentQuestion.risk_score_modifier;
          newRiskScore += Math.round(optionScore);
        }
      }
      
      setRiskScore(newRiskScore);
      
      // Save the current question to history
      setQuestionHistory([...questionHistory, currentQuestion]);
      
      // Determine the next question based on the response
      let nextQuestionId: number | null = null;
      
      if (currentQuestion.next_question_mapping && currentQuestion.next_question_mapping[response]) {
        // Direct mapping
        nextQuestionId = currentQuestion.next_question_mapping[response];
      } else if (currentQuestion.question_type === 'range') {
        // For range questions, determine if it's high or low
        const range = currentQuestion.options.max - currentQuestion.options.min;
        const midpoint = currentQuestion.options.min + range / 2;
        const key = response > midpoint ? 'high' : 'low';
        
        if (currentQuestion.next_question_mapping && currentQuestion.next_question_mapping[key]) {
          nextQuestionId = currentQuestion.next_question_mapping[key];
        } else if (currentQuestion.next_question_mapping && currentQuestion.next_question_mapping.default) {
          nextQuestionId = currentQuestion.next_question_mapping.default;
        }
      } else if (currentQuestion.next_question_mapping && currentQuestion.next_question_mapping.default) {
        // Use default if available
        nextQuestionId = currentQuestion.next_question_mapping.default;
      }
      
      // Save the response to the database
      const { error: saveError } = await supabase
        .from('akinator_responses')
        .insert({
          session_id: sessionId,
          question_id: currentQuestion.id,
          response: typeof response === 'object' ? response : { value: response },
        });
      
      if (saveError) {
        console.error('Error saving response:', saveError);
      }
      
      // If we have a next question, fetch and display it
      if (nextQuestionId) {
        const nextQuestion = questions.find(q => q.id === nextQuestionId);
        
        if (nextQuestion) {
          setCurrentQuestion(nextQuestion);
          setCurrentResponse(null);
          
          // Reset slider value for range questions
          if (nextQuestion.question_type === 'range') {
            const midpoint = Math.round((nextQuestion.options.min + nextQuestion.options.max) / 2);
            setSliderValue([midpoint]);
          }
        } else {
          // This shouldn't happen if the database is properly set up
          console.error('Next question not found:', nextQuestionId);
          handleQuizCompletion(newRiskScore);
        }
      } else {
        // If no next question, the quiz is complete
        handleQuizCompletion(newRiskScore);
      }
    } catch (err) {
      console.error('Error handling response:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setThinking(false);
    }
  };

  // Handle going back to the previous question
  const handleGoBack = () => {
    if (questionHistory.length === 0) return;
    
    // Get the previous question
    const previousQuestion = questionHistory[questionHistory.length - 1];
    
    // Update the current question
    setCurrentQuestion(previousQuestion);
    
    // Remove the previous question from history
    setQuestionHistory(questionHistory.slice(0, -1));
    
    // Remove the response for this question
    const newResponseHistory = { ...responseHistory };
    delete newResponseHistory[previousQuestion.id];
    setResponseHistory(newResponseHistory);
    
    // Recalculate the risk score
    let newRiskScore = 0;
    for (const [questionId, response] of Object.entries(newResponseHistory)) {
      const question = questions.find(q => q.id === parseInt(questionId));
      if (!question) continue;
      
      if (question.question_type === 'boolean' && response === 'Yes') {
        newRiskScore += question.risk_score_modifier;
      } else if (question.question_type === 'range') {
        const range = question.options.max - question.options.min;
        const normalizedValue = (response - question.options.min) / range;
        newRiskScore += Math.round(normalizedValue * question.risk_score_modifier);
      } else if (question.question_type === 'select') {
        const options = question.options.options || [];
        if (options.length > 0) {
          const responseIndex = options.indexOf(response);
          const optionScore = (responseIndex / (options.length - 1)) * question.risk_score_modifier;
          newRiskScore += Math.round(optionScore);
        }
      }
    }
    
    setRiskScore(newRiskScore);
    setCurrentResponse(null);
  };

  // Complete the quiz and determine the result
  const handleQuizCompletion = async (finalScore: number) => {
    try {
      // Fetch the appropriate result based on score and symptom category
      let category = '';
      
      // Determine the main symptom category from responses
      const categoryQuestion = questions.find(q => q.is_root);
      if (categoryQuestion && responseHistory[categoryQuestion.id]) {
        category = responseHistory[categoryQuestion.id];
      }
      
      // Fetch result based on score
      const { data, error } = await supabase
        .from('akinator_results')
        .select('*')
        .ilike('condition_name', `%${category}%`)
        .lte('min_score', finalScore)
        .gte('max_score', finalScore)
        .single();
      
      if (error) {
        console.error('Error fetching result:', error);
        // If no exact match, get the closest result
        const { data: allResults, error: allResultsError } = await supabase
          .from('akinator_results')
          .select('*')
          .ilike('condition_name', `%${category}%`);
        
        if (allResultsError) throw allResultsError;
        
        if (allResults && allResults.length > 0) {
          // Find the closest result based on score range
          const closestResult = allResults.reduce((closest, current) => {
            const closestDistance = Math.min(
              Math.abs(finalScore - closest.min_score),
              Math.abs(finalScore - closest.max_score)
            );
            
            const currentDistance = Math.min(
              Math.abs(finalScore - current.min_score),
              Math.abs(finalScore - current.max_score)
            );
            
            return currentDistance < closestDistance ? current : closest;
          });
          
          setResult(closestResult);
        } else {
          // If still no results, use a generic result
          setResult({
            id: 0,
            condition_name: 'Assessment Complete',
            description: 'Based on your responses, we were unable to determine a specific risk level. Please consult with a healthcare professional for a proper evaluation.',
            risk_level: 'Unknown',
            recommendation: 'Schedule an appointment with your healthcare provider to discuss your symptoms and concerns.',
            followup_actions: ['Consult with a healthcare professional', 'Keep track of your symptoms'],
            sources: ['General medical advice']
          });
        }
      } else {
        setResult(data);
      }
      
      // Update the session with final results
      await supabase
        .from('akinator_responses')
        .update({
          final_score: finalScore,
          final_condition: data?.id || null
        })
        .eq('session_id', sessionId);
      
      // Set quiz as completed
      setQuizCompleted(true);
      
      // Notify parent component if callback provided
      if (onComplete && data) {
        onComplete(data, finalScore);
      }
    } catch (err) {
      console.error('Error completing quiz:', err);
      setError('Failed to generate your results. Please try again later.');
    }
  };

  // Reset the quiz to start over
  const resetQuiz = async () => {
    try {
      setLoading(true);
      
      // Create a new session ID
      const newSessionId = crypto.randomUUID();
      setSessionId(newSessionId);
      
      // Reset all state
      setQuestionHistory([]);
      setResponseHistory({});
      setCurrentResponse(null);
      setRiskScore(0);
      setQuizCompleted(false);
      setResult(null);
      setError(null);
      
      // Fetch the root question again
      const { data, error } = await supabase
        .from('akinator_decision_tree')
        .select('*')
        .eq('is_root', true)
        .single();
      
      if (error) throw error;
      
      if (data) {
        // Parse the JSON fields
        const parsedQuestion = {
          ...data,
          options: typeof data.options === 'string' ? JSON.parse(data.options) : data.options,
          next_question_mapping: typeof data.next_question_mapping === 'string' 
            ? JSON.parse(data.next_question_mapping) 
            : data.next_question_mapping
        };
        
        setCurrentQuestion(parsedQuestion);
      }
    } catch (err) {
      console.error('Error resetting quiz:', err);
      setError('Failed to reset the quiz. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // Determine if response is valid and can proceed
  const canProceed = useMemo(() => {
    if (!currentQuestion) return false;
    
    if (currentQuestion.question_type === 'boolean' || currentQuestion.question_type === 'select') {
      return currentResponse !== null;
    } else if (currentQuestion.question_type === 'range') {
      return true; // Range always has a value
    }
    
    return false;
  }, [currentQuestion, currentResponse]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cancer-purple"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
        <p className="text-red-600 mb-4">{error}</p>
        <Button
          onClick={resetQuiz}
          className="bg-red-100 text-red-700 hover:bg-red-200 border border-red-300"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (quizCompleted && result) {
    return <AkinatorResults result={result} score={riskScore} resetQuiz={resetQuiz} />;
  }

  return (
    <motion.div
      className="bg-white rounded-xl border border-cancer-purple/20 shadow-lg p-6 relative overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Decorative elements */}
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-cancer-purple/10 rounded-full"></div>
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cancer-blue/10 rounded-full"></div>
      
      {/* Progress information */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
          <div className="text-sm text-gray-600 flex items-center">
            <Info className="w-4 h-4 mr-1" />
            <span>Risk Assessment Quiz</span>
          </div>
          <div className="text-sm font-medium text-cancer-purple">
            Questions answered: {Object.keys(responseHistory).length}
          </div>
        </div>
        
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-cancer-blue to-cancer-purple"
            initial={{ width: '0%' }}
            animate={{ width: `${riskScore * 2}%` }}
            transition={{ duration: 0.5 }}
          ></motion.div>
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        {currentQuestion && (
          <motion.div
            key={currentQuestion.id}
            variants={questionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mb-6"
          >
            <h2 className="text-xl md:text-2xl font-semibold mb-8 text-gray-800">
              {currentQuestion.question_text}
            </h2>
            
            {currentQuestion.question_type === 'boolean' && (
              <div className="grid grid-cols-2 gap-4">
                {currentQuestion.options.options?.map((option) => (
                  <motion.button
                    key={option}
                    variants={optionVariants}
                    whileHover="hover"
                    animate={currentResponse === option ? "selected" : "visible"}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 flex items-center justify-center
                      ${currentResponse === option 
                        ? 'border-cancer-purple bg-cancer-purple text-white' 
                        : 'border-gray-200 bg-white hover:border-cancer-purple/50'}`}
                    onClick={() => setCurrentResponse(option)}
                  >
                    <span className="text-lg font-medium">{option}</span>
                    {option === 'Yes' && <ThumbsUp className="ml-2 w-5 h-5" />}
                    {option === 'No' && <ThumbsDown className="ml-2 w-5 h-5" />}
                  </motion.button>
                ))}
              </div>
            )}
            
            {currentQuestion.question_type === 'range' && (
              <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
                <div className="text-center mb-8">
                  <motion.div 
                    key={sliderValue[0]}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl font-bold text-cancer-purple"
                  >
                    {sliderValue[0]}
                  </motion.div>
                  <div className="text-sm text-gray-500">
                    Drag the slider to indicate intensity
                  </div>
                </div>
                
                <Slider
                  value={sliderValue}
                  min={currentQuestion.options.min || 0}
                  max={currentQuestion.options.max || 10}
                  step={currentQuestion.options.step || 1}
                  onValueChange={(value) => {
                    setSliderValue(value);
                    setCurrentResponse(value[0]);
                  }}
                  className="my-6"
                />
                
                <div className="flex justify-between mt-2">
                  <span className="text-sm text-gray-500">
                    {currentQuestion.options.min || 0} - Mild
                  </span>
                  <span className="text-sm text-gray-500">
                    {currentQuestion.options.max || 10} - Severe
                  </span>
                </div>
              </div>
            )}
            
            {currentQuestion.question_type === 'select' && (
              <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
                <Select onValueChange={(value) => setCurrentResponse(value)}>
                  <SelectTrigger className="w-full text-base border-2 border-gray-200 hover:border-cancer-purple/50 transition-colors">
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent className="border border-gray-200 bg-white">
                    {currentQuestion.options.options?.map((option) => (
                      <SelectItem 
                        key={option} 
                        value={option}
                        className="focus:bg-cancer-purple/10 focus:text-cancer-purple"
                      >
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex justify-between mt-8">
        <Button
          onClick={handleGoBack}
          disabled={questionHistory.length === 0 || thinking}
          className={`border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 
            ${questionHistory.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back
        </Button>
        
        <Button
          onClick={() => {
            if (currentQuestion?.question_type === 'range') {
              handleResponse(sliderValue[0]);
            } else {
              handleResponse(currentResponse);
            }
          }}
          disabled={!canProceed || thinking}
          className={`bg-gradient-to-r from-cancer-blue to-cancer-purple hover:from-cancer-purple hover:to-cancer-blue text-white
            ${!canProceed ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {thinking ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              Thinking...
            </>
          ) : (
            <>
              Next
              <ArrowRight className="ml-2 w-4 h-4" />
            </>
          )}
        </Button>
      </div>
      
      {/* Info text */}
      <div className="text-xs text-gray-500 text-center mt-8">
        This quiz is for informational purposes only and does not constitute medical advice.
        <br />
        Please consult a healthcare professional for proper diagnosis and treatment.
      </div>
    </motion.div>
  );
};

export default AkinatorQuiz; 