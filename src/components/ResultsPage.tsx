import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertTriangle, Clock, Award, TrendingUp, Eye, Download, Home } from 'lucide-react';

interface CandidateData {
  name: string;
  email: string;
  jobRole: string;
}

interface InterviewResults {
  candidateData: CandidateData;
  answers: string[];
  cheatingFlags: string[];
  completedQuestions: number;
  totalQuestions: number;
}

const ResultsPage = () => {
  const [results, setResults] = useState<InterviewResults | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = sessionStorage.getItem('interviewResults');
    if (!stored) {
      navigate('/');
      return;
    }
    setResults(JSON.parse(stored));
  }, [navigate]);

  if (!results) return null;

  // Calculate scores (simulated AI scoring)
  const completionRate = (results.completedQuestions / results.totalQuestions) * 100;
  const communicationScore = Math.max(75 - (results.cheatingFlags.length * 10), 20);
  const technicalScore = Math.floor(Math.random() * 20) + 75; // Simulated
  const overallScore = Math.round((completionRate + communicationScore + technicalScore) / 3);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const handleStartNewInterview = () => {
    sessionStorage.removeItem('interviewResults');
    navigate('/home');
  };

  const handleGoHome = () => {
    sessionStorage.clear();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-navy">
      {/* Header */}
      <header className="border-b border-border/20 bg-background/5 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-navy" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Interview Results</h1>
                <p className="text-sm text-muted-foreground">AI-Powered Assessment Complete</p>
              </div>
            </div>
            <Badge variant="outline" className="text-electric-blue border-electric-blue">
              {results.candidateData.jobRole}
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Overall Score */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gradient-card border-border/50 animate-slide-up">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl text-foreground">
                  Interview Assessment for {results.candidateData.name}
                </CardTitle>
                <div className="mx-auto w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mt-4 animate-pulse-glow">
                  <span className="text-3xl font-bold text-navy">{overallScore}</span>
                </div>
                <Badge variant={getScoreVariant(overallScore)} className="mt-2">
                  {overallScore >= 80 ? 'Excellent' : overallScore >= 60 ? 'Good' : 'Needs Improvement'}
                </Badge>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-secondary/20 rounded-lg">
                    <CheckCircle className={`w-8 h-8 mx-auto mb-2 ${getScoreColor(completionRate)}`} />
                    <h3 className="font-semibold text-foreground">Completion</h3>
                    <p className={`text-2xl font-bold ${getScoreColor(completionRate)}`}>
                      {Math.round(completionRate)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {results.completedQuestions}/{results.totalQuestions} questions
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-secondary/20 rounded-lg">
                    <TrendingUp className={`w-8 h-8 mx-auto mb-2 ${getScoreColor(communicationScore)}`} />
                    <h3 className="font-semibold text-foreground">Communication</h3>
                    <p className={`text-2xl font-bold ${getScoreColor(communicationScore)}`}>
                      {communicationScore}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Clarity & engagement
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-secondary/20 rounded-lg">
                    <Award className={`w-8 h-8 mx-auto mb-2 ${getScoreColor(technicalScore)}`} />
                    <h3 className="font-semibold text-foreground">Technical</h3>
                    <p className={`text-2xl font-bold ${getScoreColor(technicalScore)}`}>
                      {technicalScore}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Knowledge & skills
                    </p>
                  </div>
                </div>

                <Separator className="bg-border/50" />

                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">Detailed Breakdown</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Question Completion Rate</span>
                      <span className="text-sm font-medium text-foreground">{Math.round(completionRate)}%</span>
                    </div>
                    <Progress value={completionRate} className="h-2" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Communication Score</span>
                      <span className="text-sm font-medium text-foreground">{communicationScore}%</span>
                    </div>
                    <Progress value={communicationScore} className="h-2" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Technical Assessment</span>
                      <span className="text-sm font-medium text-foreground">{technicalScore}%</span>
                    </div>
                    <Progress value={technicalScore} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Feedback */}
            <Card className="bg-gradient-card border-border/50 animate-slide-up [animation-delay:200ms]">
              <CardHeader>
                <CardTitle className="text-lg text-foreground flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-electric-blue" />
                  <span>AI-Generated Feedback</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-secondary/20 rounded-lg border border-border/30">
                  <h5 className="font-semibold text-foreground mb-2">Strengths</h5>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Clear communication and professional demeanor</li>
                    <li>• Good understanding of technical concepts</li>
                    <li>• Completed most questions within time limits</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-secondary/20 rounded-lg border border-border/30">
                  <h5 className="font-semibold text-foreground mb-2">Areas for Improvement</h5>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Consider providing more specific examples</li>
                    <li>• Work on maintaining focus throughout the interview</li>
                    <li>• Practice answering questions more concisely</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monitoring Results & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Monitoring Results */}
            <Card className="bg-gradient-card border-border/50 animate-slide-up [animation-delay:400ms]">
              <CardHeader>
                <CardTitle className="text-lg text-foreground flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-electric-blue" />
                  <span>Interview Monitoring</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {results.cheatingFlags.length === 0 ? (
                  <div className="text-center p-4 bg-success/10 border border-success/20 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
                    <h4 className="font-semibold text-foreground">Clean Session</h4>
                    <p className="text-sm text-muted-foreground">
                      No suspicious activity detected
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-center space-x-2 text-destructive mb-3">
                      <AlertTriangle className="w-5 h-5" />
                      <h4 className="font-semibold">Monitoring Alerts</h4>
                    </div>
                    <div className="space-y-2">
                      {results.cheatingFlags.map((flag, index) => (
                        <div key={index} className="text-sm text-muted-foreground flex items-start space-x-2">
                          <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                          <span>{flag}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 bg-secondary/20 rounded-lg">
                    <Clock className="w-6 h-6 text-electric-blue mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-sm font-semibold text-foreground">15 min</p>
                  </div>
                  <div className="p-3 bg-secondary/20 rounded-lg">
                    <Eye className="w-6 h-6 text-electric-blue mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Flags</p>
                    <p className="text-sm font-semibold text-foreground">{results.cheatingFlags.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="bg-gradient-card border-border/50 animate-slide-up [animation-delay:600ms]">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleStartNewInterview}
                  className="w-full bg-gradient-primary hover:shadow-glow text-navy font-semibold transition-all duration-300"
                >
                  <Award className="w-4 h-4 mr-2" />
                  Retake Interview
                </Button>

                <Button 
                  variant="outline"
                  className="w-full border-electric-blue text-electric-blue hover:bg-electric-blue hover:text-navy"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>

                <Separator className="bg-border/50" />

                <Button 
                  onClick={handleGoHome}
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Start New Session
                </Button>

                <div className="text-xs text-center text-muted-foreground pt-2">
                  <p>Results will be reviewed by our recruitment team</p>
                  <p>You'll hear back within 3-5 business days</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;