import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type SignInFormData = z.infer<typeof signInSchema>;

interface SignInFormProps {
  onSuccess?: () => void;
}

const SignInForm = ({ onSuccess }: SignInFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        // Check if it's an email confirmation issue
        if (error.message.includes('Email not confirmed')) {
          toast.error("Please check your email and click the confirmation link before signing in.");
        } else if (error.message.includes('Invalid login credentials')) {
          toast.error("Invalid email or password. If you just signed up, please check your email for a confirmation link first.");
        } else {
          toast.error(`Sign in failed: ${error.message}`);
        }
        return;
      }

      toast.success("Welcome back!");
      onSuccess?.();
    } catch (error) {
      console.error('Sign in error:', error);
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
        options: {
          emailRedirectTo: `${window.location.origin}/auth`
        }
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

  const handleMagicLink = async () => {
    const email = form.getValues('email')?.trim();
    if (!email) {
      toast.error('Please enter your email above first.');
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/profile` },
      });
      if (error) {
        toast.error(`Could not send login link: ${error.message}`);
        return;
      }
      toast.success('Login link sent. Please check your inbox or spam folder.');
    } catch (e) {
      console.error('Magic link error:', e);
      toast.error('Failed to send login link.');
    }
  };
  const handleForgotPassword = async () => {
    const email = form.getValues('email')?.trim();
    if (!email) {
      toast.error('Please enter your email above first.');
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) {
        toast.error(`Could not send reset email: ${error.message}`);
        return;
      }
      toast.success('Password reset email sent. Please check your inbox.');
    } catch (e) {
      console.error('Password reset error:', e);
      toast.error('Failed to send password reset email.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Access your courses and track your progress
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        placeholder="Enter your password" 
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

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing In..." : "Sign In"}
            </Button>
            <div className="flex gap-2 w-full">
              <Button type="button" variant="link" className="flex-1" onClick={handleForgotPassword}>
                Forgot password?
              </Button>
              <Button type="button" variant="link" className="flex-1" onClick={handleResend}>
                Resend confirmation
              </Button>
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={handleMagicLink}>
              Email me a one-time login link
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SignInForm;