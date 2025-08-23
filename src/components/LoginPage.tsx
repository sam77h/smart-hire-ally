import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    jobRole: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const jobRoles = [
    'Software Engineer',
    'Frontend Developer', 
    'Backend Developer',
    'Full Stack Developer',
    'Data Scientist',
    'Product Manager',
    'UI/UX Designer',
    'DevOps Engineer',
    'Quality Assurance Engineer',
    'Business Analyst'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.jobRole) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Store candidate data in sessionStorage
    sessionStorage.setItem('candidate', JSON.stringify(formData));
    
    toast({
      title: "Welcome!",
      description: `Hello ${formData.name}, you're now logged in.`,
    });

    setIsLoading(false);
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gradient-navy flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        <Card className="bg-gradient-card border-border/50 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4 animate-pulse-glow">
              <span className="text-2xl font-bold text-navy">AI</span>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Intelligent HR Assistant
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your details to begin the AI-powered interview process
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground font-medium">
                  Full Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:ring-electric-blue"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:ring-electric-blue"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobRole" className="text-foreground font-medium">
                  Job Role Applied For *
                </Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, jobRole: value }))}>
                  <SelectTrigger className="bg-secondary/50 border-border/50 text-foreground focus:ring-electric-blue">
                    <SelectValue placeholder="Select your job role" />
                  </SelectTrigger>
                  <SelectContent className="bg-secondary border-border/50">
                    {jobRoles.map(role => (
                      <SelectItem 
                        key={role} 
                        value={role}
                        className="text-foreground hover:bg-accent/50"
                      >
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:shadow-glow text-navy font-semibold py-3 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  'Begin Interview Process'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                By proceeding, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;