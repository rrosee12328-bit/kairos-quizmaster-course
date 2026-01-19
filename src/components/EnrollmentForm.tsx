import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const enrollmentSchema = z.object({
  email: z.string().email("Please enter a valid email address").max(255),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits").max(15),
  identificationType: z.enum(["ssn", "driver_license", "texas_id"], {
    required_error: "Please select an identification type",
  }),
  lastFourDigits: z.string().length(4, "Please enter exactly 4 digits").regex(/^\d{4}$/, "Must be 4 digits only"),
  courseType: z.string().min(1, "Please select a course"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

interface EnrollmentFormProps {
  onSuccess?: () => void;
  priceId?: string;
  defaultCourseType?: string;
}

const EnrollmentForm = ({ onSuccess, priceId, defaultCourseType }: EnrollmentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      identificationType: undefined,
      lastFourDigits: "",
      courseType: defaultCourseType || "",
      password: "",
    },
  });

  const onSubmit = async (data: EnrollmentFormData) => {
    setIsSubmitting(true);

    try {
      // Use existing session if logged in, otherwise attempt sign up
      const { data: sessionData } = await supabase.auth.getSession();
      let currentUser = sessionData.session?.user ?? null;

      if (!currentUser) {
        // Try to sign up
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: {
              first_name: data.firstName,
              last_name: data.lastName,
            },
          },
        });

        if (authError) {
          // If user already exists, try to sign in instead
          const msg = authError.message?.toLowerCase() || "";
          if (msg.includes("already registered") || msg.includes("exists")) {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: data.email,
              password: data.password,
            });
            if (signInError) {
              // If sign-in fails due to email confirmation, still proceed with signup data
              console.warn('Sign-in failed, proceeding with signup data:', signInError.message);
              if (authData?.user) {
                currentUser = authData.user;
                toast.success("Account created! You can sign in once you confirm your email.");
              } else {
                toast.error("Account exists but sign-in failed. Please check your password or confirm your email first.");
                return;
              }
            } else {
              currentUser = signInData.user ?? null;
              toast.success("Welcome back!");
            }
          } else {
            toast.error(`Registration failed: ${authError.message}`);
            return;
          }
        } else {
          currentUser = authData.user ?? null;
          toast.success("Account created successfully!");
        }
      }

      if (!currentUser) {
        toast.error("Unable to authenticate. Please try signing in again.");
        return;
      }

      // Ensure we have an active session (nice to have but not required for checkout)
      const { data: { session } } = await supabase.auth.getSession();
      const hasSession = !!session;

      // Save enrollment data (RLS allows any authenticated user to insert)
      if (hasSession) {
        const { error: enrollmentError } = await supabase
          .from('enrollments')
          .insert({
            user_id: currentUser.id,
            email: data.email,
            first_name: data.firstName,
            last_name: data.lastName,
            phone_number: data.phoneNumber,
            identification_type: data.identificationType,
            last_six_digits: data.lastFourDigits, // Using last 4 now, column name kept for compatibility
            course_type: data.courseType,
            enrollment_status: 'pending',
          });

        if (enrollmentError) {
          console.error('Enrollment error:', enrollmentError);
          const msg = (enrollmentError as any)?.message || 'Failed to save enrollment. Please try again.';
          toast.error(msg);
          // Don't block checkout; continue
        } else {
          toast.success("Enrollment saved!");
        }
      } else {
        console.warn('No session yet; skipping enroll save before payment');
      }

      // If there's a priceId, redirect to Stripe checkout
      if (priceId) {
        toast.success("Enrollment saved! Redirecting to payment...");
        const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
          body: { priceId, email: data.email }
        });

        if (checkoutError) {
          console.error('Checkout error:', checkoutError);
          toast.error("Failed to create checkout session");
          return;
        }

        if (checkoutData?.url) {
          window.open(checkoutData.url, '_blank');
          toast.success("Payment window opened! Complete your purchase to access the course.");
        }
      } else {
        toast.success("Enrollment completed successfully!");
      }

      onSuccess?.();
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    const email = form.getValues('email')?.trim();
    if (!email) {
      toast.error('Please enter your email above first.');
      return;
    }
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth` }
      });
      if (error) {
        toast.error(`Could not resend: ${error.message}`);
        return;
      }
      toast.success('Confirmation email sent. Please check your inbox or spam folder.');
    } catch (e) {
      console.error('Resend error:', e);
      toast.error('Failed to resend confirmation email.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enroll in Course</CardTitle>
        <CardDescription>
          Complete your enrollment to start your security training journey
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Enter a secure password" 
                        {...field} 
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="courseType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Course</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose your course" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="level2">Level 2 Security Officer (Unarmed)</SelectItem>
                      <SelectItem value="level3">Level 3 Security Officer (Armed)</SelectItem>
                      <SelectItem value="level4">Level 4: Personal Protection Officer</SelectItem>
                      <SelectItem value="pepper-spray">Pepper Spray Training</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="identificationType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Identification Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ssn" id="ssn" />
                        <Label htmlFor="ssn">Social Security Number</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="driver_license" id="driver_license" />
                        <Label htmlFor="driver_license">Texas Driver License</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="texas_id" id="texas_id" />
                        <Label htmlFor="texas_id">Texas Identification Number</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastFourDigits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Last 4 Digits of {form.watch("identificationType") === "ssn" ? "SSN" : form.watch("identificationType") === "driver_license" ? "Texas Driver License" : "Texas ID"}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="1234" 
                      maxLength={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Enrolling..." : "Complete Enrollment"}
            </Button>
            <Button type="button" variant="link" className="w-full" onClick={handleResend}>
              Resend confirmation email
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EnrollmentForm;