import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Download } from "lucide-react";
import { level3ExamQuestions } from "@/data/level3ExamQuestions";
import { level2ExamQuestions } from "@/data/level2ExamQuestions";
import { pepperSprayExamQuestions } from "@/data/pepperSprayExamQuestions";
import { level4ExamQuestions } from "@/data/level4ExamQuestions";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizProps {
  courseType?: 'level2' | 'level3' | 'pepper-spray' | 'level-4';
  questions?: QuizQuestion[];
  passingPercentage?: number;
  attemptsRemaining?: number;
  onQuizComplete?: () => void;
}

const Quiz = ({ courseType = 'level3', questions: customQuestions, passingPercentage = 70, attemptsRemaining = 3, onQuizComplete }: QuizProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [questions] = useState(
    customQuestions || 
    (courseType === 'level2' ? level2ExamQuestions : 
     courseType === 'pepper-spray' ? pepperSprayExamQuestions :
     courseType === 'level-4' ? level4ExamQuestions :
     level3ExamQuestions)
  );
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [startTime] = useState(new Date().toISOString());
  const [isSavingCompletion, setIsSavingCompletion] = useState(false);
  const completionSavedRef = useRef(false);

  const handleAnswerSelect = (value: string) => {
    setSelectedAnswer(value);
  };

  const handleNextQuestion = async () => {
    if (selectedAnswer) {
      // Create updated answers object including current answer
      const updatedAnswers = {
        ...selectedAnswers,
        [currentQuestion]: parseInt(selectedAnswer)
      };
      
      setSelectedAnswers(updatedAnswers);
      
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer("");
      } else {
        // Save completion immediately when quiz is finished
        // Pass the updated answers directly to avoid race condition with state update
        setIsSavingCompletion(true);
        await saveCompletion(updatedAnswers);
        setIsSavingCompletion(false);
        setShowResults(true);
        // Notify parent to refresh progress data
        onQuizComplete?.();
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setSelectedAnswer(selectedAnswers[currentQuestion - 1]?.toString() || "");
    }
  };

  const calculateScore = (answers: Record<number, number> = selectedAnswers) => {
    let correct = 0;
    Object.entries(answers).forEach(([questionIndex, answer]) => {
      if (questions[parseInt(questionIndex)].correctAnswer === answer) {
        correct++;
      }
    });
    return correct;
  };

  const saveCompletion = async (answers: Record<number, number> = selectedAnswers) => {
    // Prevent duplicate saves for this specific quiz attempt
    if (completionSavedRef.current) {
      console.warn('Completion already saved for this attempt');
      return false;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save your results.",
        variant: "destructive",
      });
      return false;
    }

    const score = calculateScore(answers);
    const percentage = Math.round((score / questions.length) * 100);
    const passed = percentage >= passingPercentage;

    // Check for existing passing completion before inserting
    const { data: existingPassing } = await supabase
      .from('course_completions')
      .select('id, passed')
      .eq('user_id', user.id)
      .eq('course_type', courseType)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // If there's already a passing completion, reuse it and don't insert again
    if (existingPassing?.passed) {
      console.warn('Reusing existing passing completion:', existingPassing.id);
      completionSavedRef.current = true;
      return true;
    }

    // Get enrollment data for user's name
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('first_name, last_name, last_six_digits, identification_type')
      .eq('user_id', user.id)
      .eq('course_type', courseType)
      .maybeSingle();

    const fullName = enrollment 
      ? `${enrollment.first_name} ${enrollment.last_name}` 
      : 'Student';

    // Save course completion with attempt tracking
    const endTime = new Date().toISOString();
    const durationSeconds = Math.floor((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000);
    
    let completionData: { id: string; completed_at: string } | null = null;

    const { data: newCompletion, error: completionError } = await supabase
      .from('course_completions')
      .insert({
        user_id: user.id,
        course_type: courseType,
        score,
        total_questions: questions.length,
        percentage,
        passed,
        started_at: startTime,
        ended_at: endTime,
        duration_seconds: durationSeconds,
        user_agent: navigator.userAgent
      })
      .select()
      .single();

    if (completionError) {
      // Handle case where a passing completion already exists due to DB constraint
      if (completionError.code === '23505' &&
          (completionError as any).message?.includes('unique_passing_completion')) {
        console.warn('Duplicate passing completion detected, reusing latest passing record');

        const { data: existingCompletion, error: existingError } = await supabase
          .from('course_completions')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_type', courseType)
          .eq('passed', true)
          .order('completed_at', { ascending: false })
          .limit(1)
          .single();

        if (existingError || !existingCompletion) {
          console.error('Error fetching existing completion after duplicate constraint:', existingError);
          toast({
            title: "Error",
            description: "Failed to save your results. Please contact support.",
            variant: "destructive",
          });
          return false;
        }

        completionData = existingCompletion;
      } else {
        console.error('Error saving completion:', completionError);
        toast({
          title: "Error",
          description: "Failed to save your results. Please contact support.",
          variant: "destructive",
        });
        return false;
      }
    } else {
      completionData = newCompletion;
    }
    let registrationNumber: string | null = null;
    let approvalCode: string | null = null;
    let approvalExpiresAt: string | null = null;

    if (passed && completionData && enrollment) {
      if (courseType === 'level2' || courseType === 'pepper-spray') {
        // For Level 2 and Pepper Spray: Check if certificate already exists or create new one
        const { data: existingCert } = await supabase
          .from('certificates')
          .select()
          .eq('completion_id', completionData.id)
          .single();

        let certData = existingCert;
        let certError = null;

        if (!existingCert) {
          // Generate registration number using database function
          const { data: regNumData, error: regNumError } = await supabase
            .rpc('generate_registration_number');

          if (regNumError || !regNumData) {
            console.error('Failed to generate registration number:', regNumError);
            toast({
              title: "Certificate Error",
              description: "Failed to generate certificate number. Please contact support.",
              variant: "destructive",
              duration: 10000,
            });
            certError = regNumError;
          } else {
            // Create certificate with generated registration number
            const { data: newCert, error: newCertError } = await supabase
              .from('certificates')
              .insert({
                user_id: user.id,
                completion_id: completionData.id,
                course_type: courseType,
                student_name: fullName,
                completion_date: completionData.completed_at.split('T')[0],
                last_six_digits: enrollment.last_six_digits,
                identification_type: enrollment.identification_type,
                registration_number: regNumData
              })
              .select()
              .single();

            certData = newCert;
            certError = newCertError;

            if (newCertError) {
              console.error('CRITICAL: Certificate creation failed:', newCertError);
              toast({
                title: "Certificate Error",
                description: "Your completion was saved but certificate generation failed. Please contact support with completion ID: " + completionData.id,
                variant: "destructive",
                duration: 10000,
              });
            }
          }
        }

        if (!certError && certData) {
          registrationNumber = certData.registration_number;
          
          // Send certificate email with PDF attachment (generated server-side)
          try {
            await supabase.functions.invoke('send-certificate', {
              body: {
                name: fullName,
                email: user.email,
                date: certData.completion_date,
                registrationNumber: certData.registration_number,
                lastSixDigits: enrollment.last_six_digits,
                courseType: courseType,
              }
            });
            console.log('Certificate email with PDF sent successfully');
            toast({
              title: "Certificate Sent!",
              description: "Your certificate has been emailed to you as a PDF attachment.",
            });
          } catch (emailError) {
            console.error('Error sending certificate email:', emailError);
            toast({
              title: "Email Error",
              description: "Certificate created but email failed. You can download it from your profile.",
              variant: "destructive",
            });
          }
        }
      } else {
        // For Level 3: Generate approval code instead of certificate
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const { data: approvalData, error: approvalError } = await supabase
          .from('level3_approvals')
          .insert({
            user_id: user.id,
            completion_id: completionData.id,
            approval_code: null, // Will be generated by database function
            expires_at: expiresAt.toISOString()
          })
          .select()
          .single();

        if (!approvalError && approvalData) {
          approvalCode = approvalData.approval_code;
          approvalExpiresAt = new Date(approvalData.expires_at).toLocaleString();
          
          // Save approval code to user's profile
          await supabase
            .from('profiles')
            .update({ level3_approval_code: approvalCode })
            .eq('id', user.id);
        }
      }
    }

    // Send completion email (for both pass and fail)
    try {
      const { error: emailError } = await supabase.functions.invoke('send-course-completion', {
        body: {
          email: user.email,
          studentName: fullName,
          courseType: courseType,
          score,
          totalQuestions: questions.length,
          percentage,
          passed,
          registrationNumber,
          approvalCode,
          approvalExpiresAt
        }
      });

      if (emailError) {
        console.error('Error sending email:', emailError);
        toast({
          title: "Note",
          description: "Results saved but confirmation email failed to send.",
          variant: "default",
        });
      } else {
        toast({
          title: "Email Sent",
          description: "Check your email for your exam results.",
        });
      }
    } catch (error) {
      console.error('Error sending email:', error);
    }

    // Send admin notification
    try {
      await supabase.functions.invoke('send-admin-notification', {
        body: {
          studentName: fullName,
          studentEmail: user.email,
          courseType: courseType,
          score,
          totalQuestions: questions.length,
          percentage,
          passed,
          registrationNumber,
          approvalCode,
          completedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error sending admin notification:', error);
      // Don't show error to user - admin notifications are internal
    }

    // Mark this attempt as saved
    completionSavedRef.current = true;
    return true;
  };


  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const score = calculateScore();
  const percentage = Math.round((score / questions.length) * 100);

  if (showResults) {
    const passed = percentage >= passingPercentage;
    
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {courseType === 'level2' ? 'Level 2 Security Officer' : 
               courseType === 'level3' ? 'Level 3 Security Officer' :
               courseType === 'pepper-spray' ? 'Pepper Spray Training' :
               courseType === 'level-4' ? 'Level 4 Personal Protection Officer' : 'Security Officer'} Exam Complete!
            </CardTitle>
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
                ? `Congratulations! You passed the ${courseType === 'level2' ? 'Level 2' : courseType === 'level3' ? 'Level 3' : courseType === 'pepper-spray' ? 'Pepper Spray' : 'Level 4'} Certification Exam!` 
                : `You need ${passingPercentage}% to pass. Keep studying and try again!`}
            </div>
            {passed && (courseType === 'level2' || courseType === 'pepper-spray') && (
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border-2 border-green-500">
                <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
                  ✓ Certificate Available
                </p>
                <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                  Your {courseType === 'pepper-spray' ? 'Pepper Spray Training' : 'Level 2 Security Officer'} certificate is now available in your user profile. 
                  You can download it at any time by visiting your profile page.
                </p>
                <Button 
                  onClick={() => navigate('/profile')}
                  className="w-full"
                  size="lg"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Go to Profile & Download Certificate
                </Button>
              </div>
            )}
            {passed && courseType === 'level3' && (
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border-2 border-green-500 space-y-3">
                <p className="text-lg font-bold text-green-900 dark:text-green-100 mb-2">
                  ✓ You Passed the Level 3 Online Portion!
                </p>
                <p className="text-sm text-green-800 dark:text-green-200 mb-4">
                  Congratulations! You have successfully completed Part 1 (Online) of your Level 3 Security Officer training.
                </p>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-300 dark:border-blue-700">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    📋 Next Step: Schedule In-Person Training (Part 2)
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    To complete your armed certification, you must attend Part 2 in-person training. 
                    Click below to schedule your session, or a member of our team will contact you.
                  </p>
                  <Button 
                    onClick={() => window.open('https://calendly.com/rrosee12328/30min', '_blank')}
                    className="w-full"
                    size="lg"
                  >
                    Schedule In-Person Training Now
                  </Button>
                </div>
              </div>
            )}
            {!passed && (courseType === 'level3' || courseType === 'level-4') && (
              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border-2 border-orange-500 space-y-3">
                <p className="text-lg font-bold text-orange-900 dark:text-orange-100 mb-2">
                  ✗ You Did Not Pass This Attempt
                </p>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  You need {passingPercentage}% to pass. Your score was {percentage}%. 
                  Please review the course materials and try again when you're ready.
                </p>
                {attemptsRemaining > 0 && (
                  <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                    You have {attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} remaining.
                  </p>
                )}
              </div>
            )}
            {passed && courseType === 'level-4' && (
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border-2 border-green-500 space-y-3">
                <p className="text-lg font-bold text-green-900 dark:text-green-100 mb-2">
                  ✓ You Passed the Level 4 Online Portion!
                </p>
                <p className="text-sm text-green-800 dark:text-green-200 mb-4">
                  Congratulations! You have successfully completed Part 1 (Online) of your Personal Protection Officer training.
                </p>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-300 dark:border-blue-700">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    📋 Next Step: Schedule In-Person Training (Part 2)
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    To complete your certification, you must attend Part 2 in-person training. 
                    Click below to schedule your session, or a member of our team will contact you.
                  </p>
                  <Button 
                    onClick={() => window.open('https://calendly.com/rrosee12328/30min', '_blank')}
                    className="w-full"
                    size="lg"
                  >
                    Schedule In-Person Training Now
                  </Button>
                </div>
              </div>
            )}
            {!passed && courseType !== 'level3' && courseType !== 'level-4' && (
              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg space-y-2">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Review the course materials and retake the exam when you're ready. You'll need a score of {passingPercentage}% or higher to pass.
                </p>
                {attemptsRemaining !== undefined && attemptsRemaining > 0 && attemptsRemaining < 3 && (
                  <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                    ⚠️ You have {attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} remaining. After 3 failed attempts, you'll need to re-purchase the course.
                  </p>
                )}
                {attemptsRemaining !== undefined && attemptsRemaining === 0 && (
                  <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                    ❌ You have used all 3 exam attempts. Please re-purchase the course to try again.
                  </p>
                )}
              </div>
            )}
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">
                {passed 
                  ? "Great job! You got all required questions correct!" 
                  : "Questions You Got Wrong:"}
              </h3>
              {!passed && (
                <p className="text-sm text-muted-foreground">
                  Review these questions in the course materials, then retake the exam to try again.
                </p>
              )}
              {questions.map((question, index) => {
                const userAnswer = selectedAnswers[index];
                const isCorrect = userAnswer === question.correctAnswer;
                
                // Only show incorrect answers
                if (isCorrect) return null;
                
                return (
                  <div 
                    key={index} 
                    className="p-4 rounded-lg border-2 bg-red-50 dark:bg-red-950/20 border-red-500"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <p className="font-medium mb-2">{question.question}</p>
                        <div className="space-y-1 text-sm">
                          <p className="text-red-700 dark:text-red-300">
                            Your answer: {question.options[userAnswer]}
                          </p>
                          <p className="text-muted-foreground text-xs mt-2">
                            Review the course material to find the correct answer.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={() => {
                  setShowResults(false);
                  setCurrentQuestion(0);
                  setSelectedAnswers({});
                  setSelectedAnswer("");
                  completionSavedRef.current = false; // Reset for next attempt
                }}
              >
                Retake Exam
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/courses'}>
                Back to Courses
              </Button>
            </div>
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
          <div className="flex justify-between items-center mb-2">
            <CardTitle>
              {courseType === 'level2' ? 'Level 2 Security Officer' : 
               courseType === 'level3' ? 'Level 3 Security Officer' :
               courseType === 'pepper-spray' ? 'Pepper Spray Training' :
               courseType === 'level-4' ? 'Level 4 Personal Protection Officer' : 'Security Officer'} Exam
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{question.question}</h3>
            <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect}>
              {question.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>
            <Button
              onClick={handleNextQuestion}
              disabled={!selectedAnswer || isSavingCompletion}
            >
              {isSavingCompletion 
                ? "Saving Results..." 
                : currentQuestion === questions.length - 1 
                  ? "Finish" 
                  : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Quiz;
