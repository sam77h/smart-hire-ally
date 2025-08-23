import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Clock, Users, Award, ArrowRight, Video, Mic, Shield, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ProfileData {
  name: string;
  job_role: string;
}

const HomePage = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('name, job_role')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    setProfileData(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleStartInterview = () => {
    navigate('/interview');
  };

  if (!profileData) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-navy">
      {/* Header */}
      <header className="border-b border-border/20 bg-background/5 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-navy">AI</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">TechCorp Solutions</h1>
                <p className="text-sm text-muted-foreground">AI-Powered Recruitment</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-foreground">Welcome, {profileData.name}</p>
                <Badge variant="outline" className="text-xs border-electric-blue text-electric-blue">
                  {profileData.job_role}
                </Badge>
              </div>
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                size="sm"
                className="hover:bg-destructive hover:text-destructive-foreground"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Company Introduction */}
            <Card className="bg-gradient-card border-border/50 animate-slide-up">
              <CardHeader>
                <CardTitle className="text-2xl text-foreground flex items-center space-x-2">
                  <Award className="w-6 h-6 text-electric-blue" />
                  <span>About TechCorp Solutions</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Leading the future of technology with AI-driven solutions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-foreground leading-relaxed">
                  TechCorp Solutions is a pioneering technology company specializing in artificial intelligence, 
                  machine learning, and innovative software solutions. We're committed to transforming industries 
                  through cutting-edge technology and exceptional talent.
                </p>
                
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-4 bg-secondary/20 rounded-lg">
                    <Users className="w-8 h-8 text-electric-blue mx-auto mb-2" />
                    <h3 className="font-semibold text-foreground">500+ Employees</h3>
                    <p className="text-sm text-muted-foreground">Global workforce</p>
                  </div>
                  <div className="text-center p-4 bg-secondary/20 rounded-lg">
                    <Award className="w-8 h-8 text-electric-blue mx-auto mb-2" />
                    <h3 className="font-semibold text-foreground">Industry Leader</h3>
                    <p className="text-sm text-muted-foreground">AI & ML Solutions</p>
                  </div>
                  <div className="text-center p-4 bg-secondary/20 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-electric-blue mx-auto mb-2" />
                    <h3 className="font-semibold text-foreground">Fortune 500</h3>
                    <p className="text-sm text-muted-foreground">Trusted clients</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Services Overview */}
            <Card className="bg-gradient-card border-border/50 animate-slide-up [animation-delay:200ms]">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">Our Core Services</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Innovative solutions that drive business transformation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground">AI & Machine Learning</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>Predictive Analytics</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>Natural Language Processing</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>Computer Vision</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground">Cloud Solutions</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>Cloud Migration</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>DevOps Automation</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>Scalable Infrastructure</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interview Start Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card className="bg-gradient-card border-border/50 animate-slide-up [animation-delay:400ms]">
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4 animate-pulse-glow">
                    <Video className="w-8 h-8 text-navy" />
                  </div>
                  <CardTitle className="text-xl text-foreground">Ready to Begin?</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Start your AI-powered interview for the {profileData.job_role} position
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-foreground">Interview Process:</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-electric-blue rounded-full flex items-center justify-center text-xs font-bold text-navy">1</div>
                        <span className="text-muted-foreground">Camera & microphone setup</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-electric-blue rounded-full flex items-center justify-center text-xs font-bold text-navy">2</div>
                        <span className="text-muted-foreground">AI-generated questions</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-electric-blue rounded-full flex items-center justify-center text-xs font-bold text-navy">3</div>
                        <span className="text-muted-foreground">Real-time evaluation</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-electric-blue rounded-full flex items-center justify-center text-xs font-bold text-navy">4</div>
                        <span className="text-muted-foreground">Instant results</span>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-border/50" />

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Estimated time: 15-20 minutes</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Mic className="w-4 h-4" />
                      <span>Microphone required</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Video className="w-4 h-4" />
                      <span>Camera required</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Shield className="w-4 h-4" />
                      <span>AI monitoring enabled</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleStartInterview}
                    className="w-full bg-gradient-primary hover:shadow-glow text-navy font-semibold py-3 transition-all duration-300 transform hover:scale-[1.02] group"
                  >
                    <span>Start Interview</span>
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Make sure you're in a quiet environment with good lighting
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;