"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import React from "react";
import { TablerBrandGoogleFilled } from "@/components/Icons/TablerIcons";
import NavBar from "@/components/NavBar/NavBar";
import { motion } from "motion/react";
import { authService } from "@/lib/auth";
import { redirect } from "next/navigation";

interface LoginProps {
  email: string;
  password: string;
}

function page() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [credentials, setCredentials] = React.useState<LoginProps>({
    email: "",
    password: "",
  });
  const [message, setMessage] = React.useState<{
    type: "error" | "warning" | "success";
    content: string;
  }>({
    type: "error",
    content: "",
  });
  const [formLoading, setFormLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formLoading) return;

    setFormLoading(true);
    const { success, data, error } = await authService.signInWithEmailAndPassword(credentials.email, credentials.password);

    if (success && data) {
      redirect("/");
    }

    if (error) {
      setMessage({
        type: "error",
        content: error.message,
      });
      setFormLoading(false);
    }

  };

  const handleGoogleLogin = async () => {
    if (googleLoading) return;

    setGoogleLoading(true);
    const { success, data, error } = await authService.signInWithGoogle();

    if (success && data) {
      redirect("/");
    }

    if (error) {
      setMessage({
        type: "error",
        content: error.message,
      });
    }

    setGoogleLoading(false);
  };

  return (
    <div className="h-screen">
      <NavBar profile={null}/>
      <div className="flex h-full items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center w-full"
        >
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>Sign in to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {/* Inputs */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    type="email"
                    name="email"
                    value={credentials.email}
                    placeholder="Enter your email (ex. m@mail.com)"
                    onChange={(e) =>
                      setCredentials({ ...credentials, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={credentials.password}
                      placeholder="Enter your password"
                      onChange={(e) =>
                        setCredentials({
                          ...credentials,
                          password: e.target.value,
                        })
                      }
                      required
                    />
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowPassword(!showPassword);
                      }}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </Button>
                  </div>
                </div>
                {/* Message */}
                <p
                  className={`text-sm ${
                    message.type === "error"
                      ? "text-red-500"
                      : message.type === "warning"
                      ? "text-yellow-500"
                      : "text-green-500"
                  }`}
                >
                  {message.content}
                </p>
                {/* Submit Button */}
                <Button type="submit" disabled={formLoading || googleLoading}>
                  {formLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Login"
                  )}
                </Button>
                {/* Google Button */}
                <Button
                  type="button"
                  variant="outline"
                  disabled={formLoading || googleLoading}
                  onClick={handleGoogleLogin}
                >
                  {googleLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      Continue with Google
                      <TablerBrandGoogleFilled />
                    </>
                  )}
                </Button>
                {/* Sign Up */}
                <p className="text-sm text-center">
                  Don't have an account?{" "}
                  <Link
                    href="/auth/register"
                    className="text-primary hover:underline"
                  >
                    Sign up
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default page;
