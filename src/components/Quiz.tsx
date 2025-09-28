import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle } from "lucide-react";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

const generateQuizQuestions = (): QuizQuestion[] => {
  const securityTopics = [
    "Physical Security", "Cybersecurity", "Risk Assessment", "Emergency Response",
    "Access Control", "Surveillance Systems", "Threat Detection", "Security Protocols",
    "Incident Management"
  ];
  
  const questions: QuizQuestion[] = [];
  
  for (let i = 1; i <= 100; i++) {
    const topic = securityTopics[Math.floor(Math.random() * securityTopics.length)];
    questions.push({
      id: i,
      question: `${topic} Question ${i}: What is the most important aspect of ${topic.toLowerCase()} in a security environment?`,
      options: [
        `Standard ${topic} protocol implementation`,
        `Advanced ${topic} monitoring systems`,
        `Comprehensive ${topic} assessment procedures`,
        `Emergency ${topic} response protocols`
      ],
      correctAnswer: Math.floor(Math.random() * 4)
    });
  }
  
  return questions;
};

const Quiz = () => {
  const [questions] = useState(generateQuizQuestions());
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

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const score = calculateScore();
  const percentage = Math.round((score / questions.length) * 100);

  if (showResults) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
            <CardDescription>Here are your results</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="text-6xl">
              {percentage >= 70 ? "🎉" : "📚"}
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">
                {score}/{questions.length}
              </div>
              <div className="text-xl text-muted-foreground">
                {percentage}% Score
              </div>
            </div>
            <div className={`text-lg font-semibold ${percentage >= 70 ? 'text-green-600' : 'text-orange-600'}`}>
              {percentage >= 70 ? 'Congratulations! You passed!' : 'Keep studying and try again!'}
            </div>
            <Button onClick={() => window.location.reload()} size="lg">
              Retake Quiz
            </Button>
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
              <CardTitle>Security Academy Final Exam</CardTitle>
              <CardDescription>
                Question {currentQuestion + 1} of {questions.length}
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