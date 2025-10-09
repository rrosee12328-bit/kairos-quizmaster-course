import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CreditCard, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Level3Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zipCode: "",
    couponCode: "",
  });

  const coursePrice = 79.99;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to complete your purchase.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Here you would integrate with a payment processor
      // For now, we'll simulate a successful payment
      
      toast({
        title: "Payment Successful!",
        description: "Redirecting to your course...",
      });

      // Redirect to the course after a short delay
      setTimeout(() => {
        navigate("/course/level3");
      }, 2000);

    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/courses")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Course Information */}
          <Card className="h-fit">
            <CardHeader>
              <div className="aspect-video w-full mb-4 rounded-lg overflow-hidden">
                <img
                  src="/src/assets/security-training-hero.jpg"
                  alt="Level 3 Security Officer Training"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardTitle className="text-2xl">
                Level 3 Commissioned Security Officer Certification - Part 1 (Online)
              </CardTitle>
              <CardDescription>
                Complete the online portion to qualify for in-person training
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-2">
                <DollarSign className="h-8 w-8 text-primary" />
                <span className="text-4xl font-bold">{coursePrice}</span>
                <span className="text-muted-foreground">USD</span>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <h3 className="font-semibold text-lg">What's Included:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Comprehensive video training modules</li>
                  <li>✓ Interactive course materials</li>
                  <li>✓ Final examination</li>
                  <li>✓ Approval for Part 2 in-person training upon passing</li>
                  <li>✓ Lifetime access to course content</li>
                </ul>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold text-lg mb-2">Requirements:</h3>
                <p className="text-sm text-muted-foreground">
                  Must achieve 75% or higher on the final exam to proceed to Part 2 - the in-person training portion.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Checkout Form */}
          <Card>
            <CardHeader>
              <CardTitle>Complete Your Purchase</CardTitle>
              <CardDescription>
                Enter your information to enroll in the course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Coupon Code */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="couponCode">Coupon Code</Label>
                    <Input
                      id="couponCode"
                      name="couponCode"
                      placeholder="Enter coupon code"
                      value={formData.couponCode}
                      onChange={handleInputChange}
                    />
                  </div>
                  <Button type="button" variant="outline" className="mt-auto">
                    Apply
                  </Button>
                </div>

                {/* Contact Information */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold">Contact Information</h3>
                  
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      required
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      placeholder="(555) 123-4567"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Billing Address */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold">Billing Address</h3>
                  
                  <div>
                    <Label htmlFor="address1">Address Line 1 *</Label>
                    <Input
                      id="address1"
                      name="address1"
                      required
                      placeholder="123 Main St"
                      value={formData.address1}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="address2">Address Line 2</Label>
                    <Input
                      id="address2"
                      name="address2"
                      placeholder="Apt, Suite, Etc"
                      value={formData.address2}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        required
                        placeholder="City"
                        value={formData.city}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        name="state"
                        required
                        placeholder="TX"
                        value={formData.state}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="zipCode">Zip Code *</Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      required
                      placeholder="12345"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold">Payment Method</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 p-3 border rounded-lg bg-accent/50">
                      <CreditCard className="h-5 w-5" />
                      <span className="text-sm font-medium">Credit Card</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Payment processing will be integrated in the next step
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : `Pay $${coursePrice}`}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By completing this purchase, you agree to our terms of service
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Level3Checkout;
