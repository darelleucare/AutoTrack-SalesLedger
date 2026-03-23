import { useState } from 'react';
import { Eye, EyeOff, Lock, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const MASTER_KEY = 'pass_master_0';
const PASSWORD_KEY = 'vst_password';

function getStoredPassword(): string {
  return localStorage.getItem(PASSWORD_KEY) || 'admin';
}

function setStoredPassword(pw: string) {
  localStorage.setItem(PASSWORD_KEY, pw);
}

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [forgotMode, setForgotMode] = useState(false);
  const [masterKey, setMasterKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [masterVerified, setMasterVerified] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === getStoredPassword()) {
      onLogin();
    } else {
      setError('Incorrect password');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleVerifyMaster = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterKey === MASTER_KEY) {
      setMasterVerified(true);
      setError('');
    } else {
      setError('Invalid master key');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setTimeout(() => setError(''), 3000);
      return;
    }
    setStoredPassword(newPassword);
    setResetSuccess(true);
    setTimeout(() => {
      setForgotMode(false);
      setMasterVerified(false);
      setResetSuccess(false);
      setMasterKey('');
      setNewPassword('');
      setConfirmPassword('');
    }, 2000);
  };

  const backToLogin = () => {
    setForgotMode(false);
    setMasterVerified(false);
    setMasterKey('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="text-center space-y-2 pb-2">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">
            Welcome, Document Control!
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {forgotMode ? 'Reset your password' : 'Enter your password to continue'}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {!forgotMode ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  className="pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <p className="text-sm text-destructive text-center font-medium">{error}</p>
              )}

              <Button type="submit" className="w-full">
                Log In
              </Button>

              <button
                type="button"
                onClick={() => setForgotMode(true)}
                className="w-full text-sm text-muted-foreground hover:text-primary transition-colors text-center"
              >
                Forgot Password?
              </button>
            </form>
          ) : !masterVerified ? (
            <form onSubmit={handleVerifyMaster} className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-md bg-muted text-sm text-muted-foreground">
                <KeyRound className="w-4 h-4 shrink-0" />
                Enter the master key to reset your password
              </div>
              <Input
                type="password"
                placeholder="Master key"
                value={masterKey}
                onChange={e => { setMasterKey(e.target.value); setError(''); }}
                autoFocus
              />

              {error && (
                <p className="text-sm text-destructive text-center font-medium">{error}</p>
              )}

              <Button type="submit" className="w-full">
                Verify Master Key
              </Button>
              <button
                type="button"
                onClick={backToLogin}
                className="w-full text-sm text-muted-foreground hover:text-primary transition-colors text-center"
              >
                Back to Login
              </button>
            </form>
          ) : resetSuccess ? (
            <div className="text-center space-y-2 py-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Lock className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm font-medium text-green-700">Password reset successfully!</p>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <Input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setError(''); }}
                autoFocus
              />
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
              />

              {error && (
                <p className="text-sm text-destructive text-center font-medium">{error}</p>
              )}

              <Button type="submit" className="w-full">
                Reset Password
              </Button>
              <button
                type="button"
                onClick={backToLogin}
                className="w-full text-sm text-muted-foreground hover:text-primary transition-colors text-center"
              >
                Back to Login
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
