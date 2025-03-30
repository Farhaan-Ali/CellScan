import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  ChevronRight, 
  ThumbsUp, 
  FileDown, 
  Share2,
  Redo,
  ExternalLink
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AkinatorResult {
  id: number;
  condition_name: string;
  description: string;
  risk_level: string;
  recommendation: string;
  followup_actions: string[];
  sources: string[];
}

interface AkinatorResultsProps {
  result: AkinatorResult;
  score: number;
  resetQuiz: () => void;
}

const AkinatorResults: React.FC<AkinatorResultsProps> = ({ result, score, resetQuiz }) => {
  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'low':
        return 'bg-green-500';
      case 'moderate':
        return 'bg-yellow-500';
      case 'high':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleDownloadPDF = () => {
    // This would be connected to a PDF generation service
    console.log('Download PDF functionality would be implemented here');
    // Example implementation might use jsPDF or other PDF libraries
    alert('PDF download feature coming soon!');
  };

  const handleShare = () => {
    // This would be connected to a sharing service
    if (navigator.share) {
      navigator.share({
        title: `My ${result.condition_name} Risk Assessment`,
        text: `My risk level: ${result.risk_level}. ${result.recommendation}`,
        url: window.location.href,
      })
      .catch((error) => console.log('Error sharing:', error));
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(
        `My ${result.condition_name} Risk Assessment\nRisk level: ${result.risk_level}\n${result.recommendation}\n${window.location.href}`
      );
      alert('Assessment details copied to clipboard!');
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  const riskBarVariants = {
    hidden: { width: 0 },
    visible: { 
      width: '100%',
      transition: { duration: 1.5, ease: "easeOut" }
    }
  };

  // Determine risk percentage for visual representation
  const getRiskPercentage = () => {
    switch (result.risk_level.toLowerCase()) {
      case 'low':
        return '25%';
      case 'moderate':
        return '60%';
      case 'high':
        return '90%';
      default:
        return '50%';
    }
  };

  return (
    <motion.div
      className="bg-white rounded-xl border border-cancer-purple/20 shadow-lg p-6 relative overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Decorative elements */}
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-cancer-purple/5 rounded-full"></div>
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cancer-blue/5 rounded-full"></div>

      {/* Result Header */}
      <motion.div
        className="text-center mb-8"
        variants={itemVariants}
      >
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Assessment Complete
        </h2>
        <p className="text-gray-600">
          Here's your personalized risk assessment for {result.condition_name}
        </p>
      </motion.div>

      {/* Risk Level Indicator */}
      <motion.div
        className="mb-8"
        variants={itemVariants}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Risk Level</span>
          <span className={`px-3 py-1 rounded-full text-white font-medium text-sm ${getRiskLevelColor(result.risk_level)}`}>
            {result.risk_level}
          </span>
        </div>
        
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            className={`h-full ${getRiskLevelColor(result.risk_level)}`}
            style={{ width: getRiskPercentage() }}
            variants={riskBarVariants}
          ></motion.div>
        </div>
        
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">Low</span>
          <span className="text-xs text-gray-500">Moderate</span>
          <span className="text-xs text-gray-500">High</span>
        </div>
      </motion.div>

      {/* Result Description */}
      <motion.div
        className="bg-gray-50 border border-gray-100 rounded-xl p-5 mb-6"
        variants={itemVariants}
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-3">What This Means</h3>
        <p className="text-gray-700 leading-relaxed">{result.description}</p>
      </motion.div>

      {/* Recommendation */}
      <motion.div
        className="bg-cancer-purple/10 border border-cancer-purple/20 rounded-xl p-5 mb-6"
        variants={itemVariants}
      >
        <h3 className="text-lg font-semibold text-cancer-purple mb-3">Recommended Action</h3>
        <p className="text-gray-700 leading-relaxed">{result.recommendation}</p>
      </motion.div>

      {/* Follow-up Actions */}
      <motion.div variants={itemVariants}>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Follow-up Steps</h3>
        <ul className="space-y-2">
          {result.followup_actions.map((action, index) => (
            <motion.li 
              key={index}
              className="flex items-start"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 * index }}
            >
              <div className="mt-1 mr-3 flex-shrink-0">
                <ChevronRight className="h-4 w-4 text-cancer-purple" />
              </div>
              <p className="text-gray-700">{action}</p>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Sources */}
      <motion.div
        className="mt-8"
        variants={itemVariants}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-600">Sources & References</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2">
                  <ExternalLink className="h-3.5 w-3.5 text-gray-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">View all sources</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
          {result.sources.map((source, index) => (
            <p key={index} className="mb-1 last:mb-0">
              {source}
            </p>
          ))}
        </div>
      </motion.div>

      {/* Disclaimer */}
      <motion.div
        className="mt-8 mb-8 bg-yellow-50 border border-yellow-100 rounded-xl p-4"
        variants={itemVariants}
      >
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-sm text-yellow-700">
            This assessment is for informational purposes only and does not constitute medical advice. 
            Always consult with a qualified healthcare provider for proper diagnosis and treatment.
          </p>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        className="flex flex-col sm:flex-row justify-center gap-4"
        variants={itemVariants}
      >
        <Button
          onClick={resetQuiz}
          className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
        >
          <Redo className="mr-2 h-4 w-4" />
          Retake Assessment
        </Button>
        
        <Button
          onClick={handleDownloadPDF}
          className="bg-cancer-blue hover:bg-cancer-blue/90 text-white"
        >
          <FileDown className="mr-2 h-4 w-4" />
          Download Results
        </Button>
        
        <Button
          onClick={handleShare}
          className="bg-cancer-purple hover:bg-cancer-purple/90 text-white"
        >
          <Share2 className="mr-2 h-4 w-4" />
          Share Results
        </Button>
      </motion.div>
      
      {/* Score indicator (For developers) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 border-t border-gray-200 pt-4 text-xs text-gray-400">
          Debug: Risk Score Calculation: {score}
        </div>
      )}
    </motion.div>
  );
};

export default AkinatorResults; 