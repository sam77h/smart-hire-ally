import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface AuthFormData {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'candidate';
}

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    name: '',
    role: 'candidate'
  });

  const [showCandidateSetup, setShowCandidateSetup] = useState(false);
  const [selectedJobRole, setSelectedJobRole] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<'Junior' | 'Mid-level' | 'Senior' | ''>('');
  const [isSavingSetup, setIsSavingSetup] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  const jobRoles = [
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'DevOps Engineer',
    'Data Scientist',
    'UI/UX Designer',
    'Product Manager',
    'QA Engineer'
  ];

  const handleInputChange = (field: keyof AuthFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password
    });

    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    // Get user profile to determine role and setup status
    setLoggedInUserId(data.user.id);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, job_role, level')
      .eq('user_id', data.user.id)
      .single();

    if (profileError) {
      toast({
        title: "Error",
        description: "Failed to get user profile",
        variant: "destructive"
      });
      return;
    }

    if (profile.role === 'admin') {
      navigate('/admin');
      toast({ title: "Login Successful", description: `Welcome back!` });
      return;
    }

    // Candidate: require Job Role + Level selection
    if (!profile.job_role || !profile.level) {
      setShowCandidateSetup(true);
      toast({ title: "Complete your profile", description: "Select your Job Role and Level" });
      return;
    }

    navigate('/home');
    toast({ title: "Login Successful", description: `Welcome back!` });
  };

  const handleSignup = async () => {
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          name: formData.name,
          role: formData.role
        },
        emailRedirectTo: `${window.location.origin}/`
      }
    });

    if (error) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Account created",
      description: "You can log in now without email confirmation."
    });

    setIsLogin(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        await handleLogin();
      } else {
        await handleSignup();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/90 backdrop-blur-sm border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-primary-foreground">
            {isLogin ? 'Login' : 'Register'}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {showCandidateSetup ? (
            <div className="space-y-4">
              <Select value={selectedJobRole} onValueChange={setSelectedJobRole}>
                <SelectTrigger className="bg-background/50 border-primary/30">
                  <SelectValue placeholder="Select Job Role" />
                </SelectTrigger>
                <SelectContent>
                  {jobRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLevel} onValueChange={(value) => setSelectedLevel(value as any)}>
                <SelectTrigger className="bg-background/50 border-primary/30">
                  <SelectValue placeholder="Select Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Junior">Junior</SelectItem>
                  <SelectItem value="Mid-level">Mid-level</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isSavingSetup || !selectedJobRole || !selectedLevel}
                onClick={async () => {
                  if (!loggedInUserId) return;
                  setIsSavingSetup(true);
                  const { error } = await supabase
                    .from('profiles')
                    .update({ job_role: selectedJobRole, level: selectedLevel })
                    .eq('user_id', loggedInUserId);
                  setIsSavingSetup(false);
                  if (error) {
                    toast({
                      title: 'Error',
                      description: 'Failed to save your selection',
                      variant: 'destructive'
                    });
                    return;
                  }
                  toast({ title: 'Profile updated', description: 'You can now start your interview.' });
                  navigate('/home');
                }}
              >
                {isSavingSetup ? 'Saving...' : 'Continue'}
              </Button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className="bg-background/50 border-primary/30"
                />
                
                <Input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  className="bg-background/50 border-primary/30"
                />

                {!isLogin && (
                  <>
                    <Input
                      type="text"
                      placeholder="Full Name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      className="bg-background/50 border-primary/30"
                    />

                    <Select value={formData.role} onValueChange={(value: 'admin' | 'candidate') => handleInputChange('role', value)}>
                      <SelectTrigger className="bg-background/50 border-primary/30">
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="candidate">Candidate</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <Button
                  variant="link"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:text-primary/80"
                >
                  {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;