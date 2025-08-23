import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface CandidateData {
  id: string;
  name: string;
  email: string;
  job_role: string;
  created_at: string;
  interviews: {
    id: string;
    final_score: number;
    cheating_flag: boolean;
    status: string;
    created_at: string;
  }[];
}

const AdminDashboard = () => {
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [jobRoleFilter, setJobRoleFilter] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [cheatingFilter, setCheatingFilter] = useState('all');
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
    fetchCandidates();
  }, []);

  useEffect(() => {
    filterCandidates();
  }, [candidates, searchTerm, jobRoleFilter, scoreFilter, cheatingFilter]);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (error || profile?.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges",
        variant: "destructive"
      });
      navigate('/');
      return;
    }
  };

  const fetchCandidates = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        user_id,
        job_role,
        created_at,
        interviews (
          id,
          final_score,
          cheating_flag,
          status,
          created_at
        )
      `)
      .eq('role', 'candidate');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch candidates",
        variant: "destructive"
      });
      return;
    }

    // Get user emails from auth
    const candidatesWithEmails = await Promise.all(
      data.map(async (candidate) => {
        const { data: user } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('id', candidate.id)
          .single();
        
        // Note: In a real app, you'd need to fetch email from auth.users
        // For demo purposes, we'll use a placeholder
        return {
          ...candidate,
          email: `user-${candidate.id.slice(0, 8)}@example.com`
        };
      })
    );

    setCandidates(candidatesWithEmails);
    setLoading(false);
  };

  const filterCandidates = () => {
    let filtered = candidates.filter(candidate => {
      const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           candidate.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesJobRole = jobRoleFilter === 'all' || candidate.job_role === jobRoleFilter;
      
      const latestInterview = candidate.interviews[0];
      const matchesScore = scoreFilter === 'all' || 
                          (latestInterview && 
                           ((scoreFilter === 'high' && latestInterview.final_score >= 80) ||
                            (scoreFilter === 'medium' && latestInterview.final_score >= 60 && latestInterview.final_score < 80) ||
                            (scoreFilter === 'low' && latestInterview.final_score < 60)));
      
      const matchesCheating = cheatingFilter === 'all' ||
                             (latestInterview && 
                              ((cheatingFilter === 'detected' && latestInterview.cheating_flag) ||
                               (cheatingFilter === 'clean' && !latestInterview.cheating_flag)));

      return matchesSearch && matchesJobRole && matchesScore && matchesCheating;
    });

    setFilteredCandidates(filtered);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const viewCandidateDetails = (candidateId: string) => {
    navigate(`/admin/candidate/${candidateId}`);
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage candidates and view interview results</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-primary">{candidates.length}</div>
              <p className="text-muted-foreground">Total Candidates</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-primary">
                {candidates.filter(c => c.interviews.length > 0).length}
              </div>
              <p className="text-muted-foreground">Completed Interviews</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-destructive">
                {candidates.filter(c => c.interviews.some(i => i.cheating_flag)).length}
              </div>
              <p className="text-muted-foreground">Cheating Detected</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-primary">
                {candidates.filter(c => c.interviews.some(i => i.final_score >= 80)).length}
              </div>
              <p className="text-muted-foreground">High Scorers (80+)</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select value={jobRoleFilter} onValueChange={setJobRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Job Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Job Roles</SelectItem>
                  <SelectItem value="Frontend Developer">Frontend Developer</SelectItem>
                  <SelectItem value="Backend Developer">Backend Developer</SelectItem>
                  <SelectItem value="Full Stack Developer">Full Stack Developer</SelectItem>
                  <SelectItem value="DevOps Engineer">DevOps Engineer</SelectItem>
                  <SelectItem value="Data Scientist">Data Scientist</SelectItem>
                  <SelectItem value="UI/UX Designer">UI/UX Designer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={scoreFilter} onValueChange={setScoreFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scores</SelectItem>
                  <SelectItem value="high">High (80+)</SelectItem>
                  <SelectItem value="medium">Medium (60-79)</SelectItem>
                  <SelectItem value="low">Low (&lt;60)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={cheatingFilter} onValueChange={setCheatingFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Cheating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Candidates</SelectItem>
                  <SelectItem value="detected">Cheating Detected</SelectItem>
                  <SelectItem value="clean">Clean Record</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Candidates Table */}
        <Card>
          <CardHeader>
            <CardTitle>Candidates ({filteredCandidates.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Job Role</TableHead>
                  <TableHead>Latest Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cheating</TableHead>
                  <TableHead>Interview Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.map((candidate) => {
                  const latestInterview = candidate.interviews[0];
                  return (
                    <TableRow key={candidate.id}>
                      <TableCell className="font-medium">{candidate.name}</TableCell>
                      <TableCell>{candidate.email}</TableCell>
                      <TableCell>{candidate.job_role || 'Not specified'}</TableCell>
                      <TableCell>
                        {latestInterview ? (
                          <Badge variant={getScoreBadgeVariant(latestInterview.final_score)}>
                            {latestInterview.final_score}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">No interview</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {latestInterview ? (
                          <Badge variant="outline">
                            {latestInterview.status}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {latestInterview ? (
                          latestInterview.cheating_flag ? (
                            <Badge variant="destructive">Detected</Badge>
                          ) : (
                            <Badge variant="default">Clean</Badge>
                          )
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {latestInterview ? (
                          new Date(latestInterview.created_at).toLocaleDateString()
                        ) : (
                          <span className="text-muted-foreground">No interview</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewCandidateDetails(candidate.id)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;