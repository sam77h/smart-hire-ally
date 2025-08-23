-- Create custom types
CREATE TYPE public.user_role AS ENUM ('admin', 'candidate');
CREATE TYPE public.interview_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE public.cheating_type AS ENUM ('gaze_away', 'multiple_faces', 'tab_switch', 'app_switch', 'timeout');

-- Create profiles table for additional user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'candidate',
  job_role TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create interviews table
CREATE TABLE public.interviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  final_score DECIMAL(5,2) DEFAULT 0,
  cheating_flag BOOLEAN DEFAULT false,
  status interview_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_role TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  question_text TEXT NOT NULL,
  reference_answer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create answers table
CREATE TABLE public.answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  score DECIMAL(5,2) DEFAULT 0,
  feedback TEXT,
  time_taken INTEGER, -- seconds
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cheating_logs table
CREATE TABLE public.cheating_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  type cheating_type NOT NULL,
  details JSONB,
  severity INTEGER DEFAULT 1 -- 1-5 scale
);

-- Create qa_dataset table for reference answers
CREATE TABLE public.qa_dataset (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_role TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  question TEXT NOT NULL,
  reference_answer TEXT NOT NULL,
  keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cheating_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_dataset ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for interviews
CREATE POLICY "Candidates can view their own interviews" ON public.interviews
  FOR SELECT USING (
    candidate_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all interviews" ON public.interviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Candidates can insert their own interviews" ON public.interviews
  FOR INSERT WITH CHECK (
    candidate_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Candidates can update their own interviews" ON public.interviews
  FOR UPDATE USING (
    candidate_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for questions (readable by all authenticated users)
CREATE POLICY "Authenticated users can view questions" ON public.questions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage questions" ON public.questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for answers
CREATE POLICY "Users can view answers for their interviews" ON public.answers
  FOR SELECT USING (
    interview_id IN (
      SELECT i.id FROM public.interviews i
      JOIN public.profiles p ON i.candidate_id = p.id
      WHERE p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert answers for their interviews" ON public.answers
  FOR INSERT WITH CHECK (
    interview_id IN (
      SELECT i.id FROM public.interviews i
      JOIN public.profiles p ON i.candidate_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- RLS Policies for cheating_logs
CREATE POLICY "Users can view cheating logs for their interviews" ON public.cheating_logs
  FOR SELECT USING (
    interview_id IN (
      SELECT i.id FROM public.interviews i
      JOIN public.profiles p ON i.candidate_id = p.id
      WHERE p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert cheating logs" ON public.cheating_logs
  FOR INSERT WITH CHECK (true);

-- RLS Policies for qa_dataset
CREATE POLICY "Authenticated users can view qa_dataset" ON public.qa_dataset
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage qa_dataset" ON public.qa_dataset
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at
  BEFORE UPDATE ON public.interviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, role, job_role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Unknown'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'candidate'),
    NEW.raw_user_meta_data->>'job_role'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample Q&A dataset
INSERT INTO public.qa_dataset (job_role, difficulty, question, reference_answer, keywords) VALUES
('Frontend Developer', 'easy', 'What is the difference between let, const, and var in JavaScript?', 'let and const are block-scoped while var is function-scoped. const cannot be reassigned while let and var can be. let and const are hoisted but not initialized, while var is hoisted and initialized with undefined.', ARRAY['javascript', 'variables', 'scope', 'hoisting']),
('Frontend Developer', 'medium', 'Explain the Virtual DOM and how React uses it for performance optimization.', 'Virtual DOM is a lightweight copy of the real DOM kept in memory. React uses it to compare changes (diffing) and update only the parts that changed (reconciliation), making updates more efficient than manipulating the real DOM directly.', ARRAY['react', 'virtual dom', 'performance', 'reconciliation']),
('Backend Developer', 'easy', 'What is REST API and what are HTTP methods?', 'REST is an architectural style for web services. Common HTTP methods are GET (retrieve data), POST (create data), PUT (update/replace data), PATCH (partial update), and DELETE (remove data).', ARRAY['rest', 'api', 'http', 'methods']),
('Backend Developer', 'medium', 'Explain database indexing and its benefits.', 'Database indexing creates a data structure that improves query performance by providing faster access paths to data. Benefits include faster SELECT queries, improved WHERE clause performance, but trade-offs include slower INSERT/UPDATE operations and additional storage space.', ARRAY['database', 'indexing', 'performance', 'sql']),
('Full Stack Developer', 'medium', 'How would you handle authentication in a web application?', 'Use secure methods like JWT tokens, implement proper session management, hash passwords with bcrypt, use HTTPS, implement rate limiting, and consider OAuth for third-party authentication. Store sensitive data securely and implement proper logout mechanisms.', ARRAY['authentication', 'jwt', 'security', 'oauth']);