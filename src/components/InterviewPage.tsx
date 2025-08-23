import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Camera, Mic, MicOff, VideoOff, Play, Pause, SkipForward, Clock, Eye, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CandidateData {
  name: string;
  email: string;
  jobRole: string;
}

interface Question {
  id: number;
  text: string;
  timeLimit: number; // in seconds
}

const InterviewPage = () => {
  const [candidateData, setCandidateData] = useState<CandidateData | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cheatingFlags, setCheatingFlags] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Sample questions based on job role
  const questions: Question[] = [
    {
      id: 1,
      text: "Tell me about yourself and why you're interested in this position.",
      timeLimit: 120
    },
    {
      id: 2,
      text: "Describe a challenging project you've worked on and how you overcame the obstacles.",
      timeLimit: 90
    },
    {
      id: 3,
      text: "How do you stay updated with the latest technologies in your field?",
      timeLimit: 60
    },
    {
      id: 4,
      text: "Where do you see yourself in 5 years?",
      timeLimit: 60
    }
  ];

  useEffect(() => {
    const stored = sessionStorage.getItem('candidate');
    if (!stored) {
      navigate('/');
      return;
    }
    setCandidateData(JSON.parse(stored));
    initializeCamera();
    
    // Initialize timer for first question
    setTimeLeft(questions[0].timeLimit);
  }, [navigate]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, timeLeft]);

  // Detect tab/window focus changes for cheating detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRecording) {
        setCheatingFlags(prev => [...prev, `Tab switched at question ${currentQuestion + 1}`]);
        toast({
          title: "Warning",
          description: "Tab switching detected during interview",
          variant: "destructive"
        });
      }
    };

    const handleBlur = () => {
      if (isRecording) {
        setCheatingFlags(prev => [...prev, `Window lost focus at question ${currentQuestion + 1}`]);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isRecording, currentQuestion, toast]);

  const initializeCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast({
        title: "Camera Access Required",
        description: "Please enable camera and microphone to continue",
        variant: "destructive"
      });
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setTimeLeft(questions[currentQuestion].timeLimit);
    toast({
      title: "Recording Started",
      description: `Question ${currentQuestion + 1} of ${questions.length}`,
    });
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // Simulate saving answer
    setAnswers(prev => [...prev, `Answer to question ${currentQuestion + 1}`]);
  };

  const handleNextQuestion = () => {
    handleStopRecording();
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setTimeLeft(questions[currentQuestion + 1].timeLimit);
    } else {
      handleEndInterview();
    }
  };

  const handleTimeUp = () => {
    toast({
      title: "Time's Up!",
      description: "Moving to next question",
      variant: "destructive"
    });
    handleNextQuestion();
  };

  const handleEndInterview = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    // Store interview results
    const results = {
      candidateData,
      answers,
      cheatingFlags,
      completedQuestions: currentQuestion + 1,
      totalQuestions: questions.length
    };
    sessionStorage.setItem('interviewResults', JSON.stringify(results));
    
    navigate('/results');
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoEnabled(videoTrack.enabled);
    }
  };

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!candidateData) return null;

  const progress = ((currentQuestion + (isRecording ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-navy">
      {/* Header */}
      <header className="border-b border-border/20 bg-background/5 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-xs font-bold text-navy">AI</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Interview in Progress</h1>
                <p className="text-xs text-muted-foreground">{candidateData.name} - {candidateData.jobRole}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant={cheatingFlags.length === 0 ? "default" : "destructive"} className="text-xs">
                <Eye className="w-3 h-3 mr-1" />
                {cheatingFlags.length === 0 ? "Monitoring: Clean" : `Flags: ${cheatingFlags.length}`}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Question {currentQuestion + 1}/{questions.length}
              </Badge>
            </div>
          </div>
          
          <div className="mt-3">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Preview */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-foreground flex items-center space-x-2">
                  <Camera className="w-4 h-4" />
                  <span>Video Preview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative bg-navy rounded-lg overflow-hidden aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {!isVideoEnabled && (
                    <div className="absolute inset-0 bg-navy flex items-center justify-center">
                      <VideoOff className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  {isRecording && (
                    <div className="absolute top-2 left-2">
                      <div className="flex items-center space-x-1 bg-destructive/90 px-2 py-1 rounded text-xs text-white">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span>REC</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-center space-x-3">
                  <Button
                    size="sm"
                    variant={isVideoEnabled ? "default" : "destructive"}
                    onClick={toggleVideo}
                  >
                    {isVideoEnabled ? <Camera className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant={isAudioEnabled ? "default" : "destructive"}
                    onClick={toggleAudio}
                  >
                    {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </Button>
                </div>

                {cheatingFlags.length > 0 && (
                  <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-center space-x-2 text-destructive mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">Monitoring Alerts</span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {cheatingFlags.slice(-3).map((flag, index) => (
                        <div key={index}>• {flag}</div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Question and Controls */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-card border-border/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-foreground">
                    Question {currentQuestion + 1}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-electric-blue" />
                    <span className={`text-lg font-mono ${timeLeft <= 10 ? 'text-destructive' : 'text-electric-blue'}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="p-6 bg-secondary/20 rounded-lg border border-border/30">
                  <p className="text-lg text-foreground leading-relaxed">
                    {questions[currentQuestion].text}
                  </p>
                </div>

                <Separator className="bg-border/50" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {!isRecording ? (
                      <Button 
                        onClick={handleStartRecording}
                        className="bg-gradient-primary hover:shadow-glow text-navy font-semibold transition-all duration-300"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Answer
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleStopRecording}
                        variant="destructive"
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Stop Recording
                      </Button>
                    )}

                    {!isRecording && answers.length > currentQuestion && (
                      <Button 
                        onClick={handleNextQuestion}
                        variant="outline"
                        className="border-electric-blue text-electric-blue hover:bg-electric-blue hover:text-navy"
                      >
                        <SkipForward className="w-4 h-4 mr-2" />
                        {currentQuestion < questions.length - 1 ? 'Next Question' : 'Finish Interview'}
                      </Button>
                    )}
                  </div>

                  <Button 
                    onClick={handleEndInterview}
                    variant="outline"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    End Interview
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Speak clearly and look at the camera</p>
                  <p>• You have {formatTime(questions[currentQuestion].timeLimit)} to answer this question</p>
                  <p>• Avoid switching tabs or leaving the window</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;