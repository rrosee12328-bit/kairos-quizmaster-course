import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

const feedbackSchema = z.object({
  // Section A
  nameRole: z.string().min(1, "This field is required"),
  experienceLevel: z.string().min(1, "This field is required"),
  deviceBrowser: z.string().min(1, "This field is required"),
  testingTime: z.string().min(1, "This field is required"),
  
  // Section B
  loginClarity: z.string().min(1, "This field is required"),
  layoutRating: z.string().min(1, "This field is required"),
  materialsLocation: z.string().min(1, "This field is required"),
  visualDesign: z.string().min(1, "This field is required"),
  branding: z.string().min(1, "This field is required"),
  
  // Section C
  videoPlayback: z.string().min(1, "This field is required"),
  aiAssistant: z.string().min(1, "This field is required"),
  materialsUsefulness: z.string().min(1, "This field is required"),
  contentEngagement: z.string().min(1, "This field is required"),
  technicalIssues: z.string().min(1, "This field is required"),
  
  // Section D
  testLocation: z.string().min(1, "This field is required"),
  testInterface: z.string().min(1, "This field is required"),
  scoreComm: z.string().min(1, "This field is required"),
  certificateDelivery: z.string().min(1, "This field is required"),
  certificateDownload: z.string().min(1, "This field is required"),
  
  // Section E
  accessibilityIssues: z.string().min(1, "This field is required"),
  mobileAdaptation: z.string().min(1, "This field is required"),
});

type FeedbackForm = z.infer<typeof feedbackSchema>;

export default function BetaFeedback() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FeedbackForm>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      nameRole: "",
      experienceLevel: "",
      deviceBrowser: "",
      testingTime: "",
      loginClarity: "",
      layoutRating: "",
      materialsLocation: "",
      visualDesign: "",
      branding: "",
      videoPlayback: "",
      aiAssistant: "",
      materialsUsefulness: "",
      contentEngagement: "",
      technicalIssues: "",
      testLocation: "",
      testInterface: "",
      scoreComm: "",
      certificateDelivery: "",
      certificateDownload: "",
      accessibilityIssues: "",
      mobileAdaptation: "",
    },
  });

  const onSubmit = async (data: FeedbackForm) => {
    setIsSubmitting(true);
    try {
      const { data: functionData, error } = await supabase.functions.invoke("send-beta-feedback", {
        body: data,
      });

      if (error) throw error;

      toast({
        title: "Thank you for your feedback!",
        description: "Your responses have been submitted successfully.",
      });
      form.reset();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1">
        <div className="container mx-auto max-w-4xl px-4 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Website Beta Testing Feedback</h1>
            <p className="text-muted-foreground">
              Help us improve by sharing your experience testing our platform.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Section A */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold border-b pb-2">Section A: User Profile & Context</h2>
                
                <FormField
                  control={form.control}
                  name="nameRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What is your name (or pseudonym) and role?</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Your answer..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="experienceLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How would you describe your level of experience with online training platforms?</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Your answer..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deviceBrowser"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>On what device and browser did you access the site?</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Your answer..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="testingTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How much time did you spend testing the site?</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Your answer..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Section B */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold border-b pb-2">Section B: First Impression & Navigation</h2>
                
                <FormField
                  control={form.control}
                  name="loginClarity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upon first logging in, how clear and intuitive was the process of starting a course?</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Your answer..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="layoutRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How would you rate the overall layout of the home/dashboard page in terms of clarity and organization?</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Your answer..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="materialsLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Were you able to easily locate the materials (video, PowerPoint, AI assistant) for your class without help? If not, where were you stuck?</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Your answer..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visualDesign"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How did you feel about the colour scheme, fonts, and general visual design? Did anything stand out?</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Your answer..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="branding"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Was the branding and theme aligned with your expectations for a security training company?</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Your answer..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Section C */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold border-b pb-2">Section C: Course Materials & Learning Experience</h2>
                
                <FormField
                  control={form.control}
                  name="videoPlayback"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How easy was it to play the videos and view the PowerPoint presentations (e.g., load times, controls, navigation)?</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Your answer..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="aiAssistant"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Did the AI assistant feature (e.g., chatbot, guided help) function as expected?</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Your answer..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="materialsUsefulness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How useful were the materials (video, PowerPoint, AI assistant) in helping you understand the course content?</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Your answer..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contentEngagement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Were the course materials engaging and clear in content, pace, and delivery?</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Your answer..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="technicalIssues"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Did you encounter any technical issues? If yes, please describe.</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Your answer..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Section D */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold border-b pb-2">Section D: Test & Certificate Functionality</h2>
                
                <FormField
                  control={form.control}
                  name="testLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Was the test easy to locate and start after you finished the course materials?</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Your answer..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="testInterface"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How straightforward was the test interface?</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Your answer..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scoreComm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Did the system clearly communicate the pass threshold and your score?</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Your answer..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="certificateDelivery"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Once you passed (or failed), did you receive confirmation or a certificate in a timely manner?</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Your answer..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="certificateDownload"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Did the certificate download/print feature work smoothly?</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Your answer..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Section E */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold border-b pb-2">Section E: Usability & Accessibility</h2>
                
                <FormField
                  control={form.control}
                  name="accessibilityIssues"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Did you experience any accessibility issues?</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Your answer..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mobileAdaptation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>On mobile or tablet, did the site adapt well? Did you notice layout problems?</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Your answer..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
