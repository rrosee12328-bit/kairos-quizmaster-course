import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Auth = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Kairos Security Academy</h1>
          </Link>
          <p className="text-muted-foreground">
            Sign in to continue your security training
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Access your courses and track your progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Authentication form will be implemented here
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;