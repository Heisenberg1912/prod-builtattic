import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Construction } from "lucide-react";
import Footer from "../components/Footer";

const ResetPassword = () => {
  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
              <Construction className="h-8 w-8 text-slate-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Reset Password - Under Construction</CardTitle>
            <CardDescription className="text-base">
              The password reset feature is being reworked as part of our authentication redesign.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-sm text-slate-600 text-center">
                Password reset functionality will be available soon with our new authentication system.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" asChild className="w-full">
                <Link to="/login">Back to Sign In</Link>
              </Button>
              <Button variant="ghost" asChild className="w-full">
                <Link to="/">Return to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  );
};

export default ResetPassword;
