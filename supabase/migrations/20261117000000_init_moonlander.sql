-- ==============================================================================
-- MoonLander: Space Mission Simulator - Database Schema & Security
-- Initial Schema Version: 20261117000000
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  callsign TEXT NOT NULL UNIQUE CHECK (char_length(callsign) >= 3 AND char_length(callsign) <= 20),
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  rank_id TEXT NOT NULL DEFAULT 'trainee',
  unlocked_achievement_ids TEXT[] NOT NULL DEFAULT '{}',
  campaign_completed_ids TEXT[] NOT NULL DEFAULT '{}',
  personal_bests JSONB NOT NULL DEFAULT '{}'::jsonb,
  reputation JSONB NOT NULL DEFAULT '{"science": 50, "public": 50, "treasury": 50}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_callsign ON public.profiles(callsign);
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON public.profiles(xp DESC);

-- ------------------------------------------------------------------------------
-- 2. MISSIONS TABLE (Saved active/staged designs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.missions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  is_sandbox BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_missions_user_id ON public.missions(user_id);
CREATE INDEX IF NOT EXISTS idx_missions_scenario ON public.missions(scenario_id);

-- ------------------------------------------------------------------------------
-- 3. HISTORY TABLE (Completed flight records & telemetry debriefs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.history (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id TEXT NOT NULL,
  scenario_id TEXT NOT NULL,
  mission_name TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  success BOOLEAN NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0),
  metrics JSONB NOT NULL,
  debrief JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_history_user_id ON public.history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_scenario ON public.history(scenario_id);
CREATE INDEX IF NOT EXISTS idx_history_score ON public.history(score DESC);

-- ------------------------------------------------------------------------------
-- 4. REPLAYS TABLE (Physics flight recordings e.g. lunar descent telemetry)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.replays (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id TEXT NOT NULL,
  flight_type TEXT NOT NULL,
  initial_state JSONB NOT NULL,
  frames JSONB NOT NULL,
  touchdown_outcome JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_replays_user_id ON public.replays(user_id);
CREATE INDEX IF NOT EXISTS idx_replays_scenario ON public.replays(scenario_id);

-- ------------------------------------------------------------------------------
-- 5. LEADERBOARD ENTRIES TABLE (Public verifiable high scores)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  callsign TEXT NOT NULL,
  scenario_id TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0),
  metrics JSONB NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_scenario_score ON public.leaderboard_entries(scenario_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user ON public.leaderboard_entries(user_id);

-- ------------------------------------------------------------------------------
-- 6. CREW ROOMS TABLE (Multiplayer and collaborative flight rooms)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crew_rooms (
  id TEXT PRIMARY KEY,
  host_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'lobby',
  crew_manifest JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_crew_rooms_host ON public.crew_rooms(host_user_id);
CREATE INDEX IF NOT EXISTS idx_crew_rooms_status ON public.crew_rooms(status);

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_rooms ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, owner update/insert
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- Missions: Private to owner
CREATE POLICY "Users can view their own missions" ON public.missions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own missions" ON public.missions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own missions" ON public.missions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own missions" ON public.missions
  FOR DELETE USING (auth.uid() = user_id);

-- History: Private to owner
CREATE POLICY "Users can view their own history" ON public.history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own history" ON public.history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own history" ON public.history
  FOR DELETE USING (auth.uid() = user_id);

-- Replays: Public view, owner manage
CREATE POLICY "Replays are viewable by everyone" ON public.replays
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own replays" ON public.replays
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own replays" ON public.replays
  FOR DELETE USING (auth.uid() = user_id);

-- Leaderboard: Public view, owner insert
CREATE POLICY "Leaderboard entries are viewable by everyone" ON public.leaderboard_entries
  FOR SELECT USING (true);

CREATE POLICY "Users can insert leaderboard entries" ON public.leaderboard_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Crew Rooms: Public view, host manage
CREATE POLICY "Crew rooms are viewable by everyone" ON public.crew_rooms
  FOR SELECT USING (true);

CREATE POLICY "Hosts can manage their crew rooms" ON public.crew_rooms
  FOR ALL USING (auth.uid() = host_user_id);

-- ------------------------------------------------------------------------------
-- TRIGGERS & AUTOMATION
-- ------------------------------------------------------------------------------

-- Trigger: Automatically create a profile when a new user registers via Email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, callsign, xp, rank_id)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'callsign',
      'Cadet-' || substring(new.id::text from 1 for 6)
    ),
    0,
    'trainee'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Automatic updated_at timestamp updates
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_modtime ON public.profiles;
CREATE TRIGGER update_profiles_modtime
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_missions_modtime ON public.missions;
CREATE TRIGGER update_missions_modtime
  BEFORE UPDATE ON public.missions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_crew_rooms_modtime ON public.crew_rooms;
CREATE TRIGGER update_crew_rooms_modtime
  BEFORE UPDATE ON public.crew_rooms
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
