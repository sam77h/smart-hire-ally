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
  jobRole: string;
  adminCode: string;
}

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    name: '',
    role: 'candidate',
    jobRole: '',
    adminCode: ''
  });

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

    // Get user profile to determine role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
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

    // Redirect based on role
    if (profile.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/home');
    }

    toast({
      title: "Login Successful",
      description: `Welcome back!`
    });
  };

  const handleSignup = async () => {
    // Validate admin code if role is admin
    if (formData.role === 'admin' && formData.adminCode !== 'ADMIN2024') {
      toast({
        title: "Invalid Admin Code",
        description: "Please enter a valid admin code",
        variant: "destructive"
      });
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          name: formData.name,
          role: formData.role,
          job_role: formData.role === 'candidate' ? formData.jobRole : null
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
      title: "Registration Successful",
      description: "Please check your email to confirm your account"
    });

    // Switch to login mode
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

                {formData.role === 'candidate' && (
                  <Select value={formData.jobRole} onValueChange={(value) => handleInputChange('jobRole', value)}>
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
                )}

                {formData.role === 'admin' && (
                  <Input
                    type="password"
                    placeholder="Admin Code"
                    value={formData.adminCode}
                    onChange={(e) => handleInputChange('adminCode', e.target.value)}
                    required
                    className="bg-background/50 border-primary/30"
                  />
                )}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;