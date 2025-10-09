import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle } from "lucide-react";
import { level3ExamQuestions } from "@/data/level3ExamQuestions";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Quiz = () => {
  const { toast } = useToast();
  const [questions] = useState(level3ExamQuestions);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");

  const handleAnswerSelect = (value: string) => {
    setSelectedAnswer(value);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer) {
      setSelectedAnswers(prev => ({
        ...prev,
        [currentQuestion]: parseInt(selectedAnswer)
      }));
      
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer("");
      } else {
        setShowResults(true);
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setSelectedAnswer(selectedAnswers[currentQuestion - 1]?.toString() || "");
    }
  };

  const calculateScore = () => {
    let correct = 0;
    Object.entries(selectedAnswers).forEach(([questionIndex, answer]) => {
      if (questions[parseInt(questionIndex)].correctAnswer === answer) {
        correct++;
      }
    });
    return correct;
  };

  const saveCompletion = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Save course completion
    const { error: completionError } = await supabase
      .from('course_completions')
      .insert({
        user_id: user.id,
        course_type: 'level3',
        score,
        total_questions: questions.length,
        percentage,
        passed: percentage >= 75
      });

    if (completionError) {
      console.error('Error saving completion:', completionError);
      toast({
        title: "Error",
        description: "Failed to save your results. Please contact support.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };


  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const score = calculateScore();
  const percentage = Math.round((score / questions.length) * 100);

  if (showResults) {
    const passingScore = 75;
    const passed = percentage >= passingScore;
    
    // Save completion when results are shown
    if (passed) {
      saveCompletion();
    }
    
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Level 3 Security Officer Exam Complete!</CardTitle>
            <CardDescription>Here are your results</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="text-6xl">
              {passed ? "🎉" : "📚"}
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">
                {score}/{questions.length}
              </div>
              <div className="text-xl text-muted-foreground">
                {percentage}% Score
              </div>
            </div>
            <div className={`text-lg font-semibold ${passed ? 'text-green-600' : 'text-orange-600'}`}>
              {passed 
                ? 'Congratulations! You passed the Level 3 Security Officer Certification Exam!' 
                : `You need ${passingScore}% to pass. Keep studying and try again!`}
            </div>
            {passed && (
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                  You have successfully completed the online portion of the Level 3 Security Officer Certification Course.
                </p>
                <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                  You are now approved to proceed to the in-person training portion of Level 3.
                </p>
              </div>
            )}
            <Button onClick={() => window.location.reload()} size="lg" variant="secondary">
              Retake Exam
            </Button>
          </CardContent>
        </Card>

        {/* Review Section */}
        <Card>
          <CardHeader>
            <CardTitle>Review Your Answers</CardTitle>
            <CardDescription>Questions marked incorrect require further study</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((q, index) => {
              const userAnswer = selectedAnswers[index];
              const isCorrect = userAnswer === q.correctAnswer;
              
              return (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    isCorrect 
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                      : 'border-red-500 bg-red-50 dark:bg-red-950/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="font-semibold">
                        Question {index + 1}: {isCorrect ? 'Correct' : 'Incorrect'}
                      </div>
                      <div className="text-sm">{q.question}</div>
                      <div className="text-sm">
                        <span className="font-medium">Your answer: </span>
                        <span className={isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                          {q.options[userAnswer]}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Level 3 Security Officer Final Exam</CardTitle>
              <CardDescription>
                Question {currentQuestion + 1} of {questions.length} - Passing score: 75%
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.round(progress)}% Complete
            </div>
          </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">{question.question}</h3>
            
            <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect}>
              {question.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-secondary/50 transition-colors">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label 
                    htmlFor={`option-${index}`} 
                    className="flex-1 cursor-pointer text-sm leading-relaxed"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>
            
            <div className="text-sm text-muted-foreground">
              Questions answered: {Object.keys(selectedAnswers).length + (selectedAnswer ? 1 : 0)}/{questions.length}
            </div>
            
            <Button
              onClick={handleNextQuestion}
              disabled={!selectedAnswer}
            >
              {currentQuestion === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Quiz;