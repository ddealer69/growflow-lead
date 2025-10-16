import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { API_CONFIG } from "@/config/api";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const sendOtp = async () => {
    if (!email) {
      toast.error("Please enter your email first");
      return;
    }

    setOtpLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setGeneratedOtp(data.otp.toString());
        setOtpSent(true);
        toast.success("OTP sent to your email successfully!");
      } else {
        toast.error(data.message || "Failed to send OTP. Please try again.");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      if (error instanceof Error && error.message.includes('404')) {
        toast.error("OTP service is not available. Please contact support.");
      } else if (error instanceof Error && error.message.includes('Failed to fetch')) {
        toast.error("Network error. Please check your connection and try again.");
      } else {
        toast.error("Failed to send OTP. Please try again.");
      }
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtp = () => {
    if (!enteredOtp) {
      toast.error("Please enter the OTP");
      return;
    }

    if (enteredOtp === generatedOtp) {
      setOtpVerified(true);
      toast.success("Email verified successfully!");
    } else {
      toast.error("Invalid OTP. Please check your email and try again.", {
        action: {
          label: "Resend OTP",
          onClick: sendOtp,
        },
      });
    }
  };

  const resetOtpState = () => {
    setOtpSent(false);
    setOtpVerified(false);
    setEnteredOtp("");
    setGeneratedOtp("");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast.error(error.message || "Failed to sign in");
    } else {
      toast.success("Signed in successfully");
      navigate("/");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName || !accountName) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!otpVerified) {
      toast.error("Please verify your email first");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, fullName, accountName);
    setLoading(false);

    if (error) {
      toast.error(error.message || "Failed to sign up");
    } else {
      toast.success("Account created successfully! Please sign in with your credentials.");
      // Clear signup form and switch to signin tab
      setEmail("");
      setPassword("");
      setFullName("");
      setAccountName("");
      resetOtpState();
      // Switch to signin tab programmatically
      const signinTab = document.querySelector('[value="signin"]') as HTMLElement;
      if (signinTab) {
        signinTab.click();
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">LeadFlow</CardTitle>
          <CardDescription>Multi-tenant Lead Management System</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-account">Account Name</Label>
                  <Input
                    id="signup-account"
                    type="text"
                    placeholder="Your Company Name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="flex gap-2">
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        // Reset OTP state when email changes
                        if (otpSent || otpVerified) {
                          resetOtpState();
                        }
                      }}
                      required
                      className={otpVerified ? "border-green-500" : ""}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={sendOtp}
                      disabled={!email || otpLoading || otpVerified}
                      className="whitespace-nowrap"
                    >
                      {otpLoading ? "Sending..." : otpVerified ? "Verified" : "Verify Email"}
                    </Button>
                  </div>
                  {otpVerified && (
                    <p className="text-xs text-green-600">✓ Email verified successfully</p>
                  )}
                </div>
                
                {/* OTP Input - only show after OTP is sent */}
                {otpSent && !otpVerified && (
                  <div className="space-y-2">
                    <Label htmlFor="otp-input">Enter OTP</Label>
                    <div className="flex gap-2">
                      <Input
                        id="otp-input"
                        type="text"
                        placeholder="6-digit OTP"
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={verifyOtp}
                        disabled={enteredOtp.length !== 6}
                      >
                        Verify
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Check your email for the 6-digit verification code
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading || !otpVerified}>
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
                {!otpVerified && (
                  <p className="text-xs text-muted-foreground text-center">
                    Please verify your email before creating an account
                  </p>
                )}
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
