
-- Roles enum & table
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Donors table
CREATE TABLE public.donors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  message TEXT,
  donated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.donors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donors TO authenticated;
GRANT ALL ON public.donors TO service_role;

ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donors are viewable by everyone" ON public.donors
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert donors" ON public.donors
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update donors" ON public.donors
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete donors" ON public.donors
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER donors_set_updated_at BEFORE UPDATE ON public.donors
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Campaign settings (single row)
CREATE TABLE public.campaign_settings (
  id INT PRIMARY KEY DEFAULT 1,
  target_amount NUMERIC(14,2) NOT NULL DEFAULT 50000000,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

GRANT SELECT ON public.campaign_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.campaign_settings TO authenticated;
GRANT ALL ON public.campaign_settings TO service_role;

ALTER TABLE public.campaign_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign settings viewable by everyone" ON public.campaign_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update campaign settings" ON public.campaign_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert campaign settings" ON public.campaign_settings
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.campaign_settings (id, target_amount) VALUES (1, 50000000);

-- Seed some initial donor rows so page isn't empty
INSERT INTO public.donors (name, amount, message, donated_at) VALUES
  ('Hamba Allah', 500000, 'Semoga bermanfaat, aamiin.', now() - interval '2 days'),
  ('Ahmad Rifai', 250000, 'Tetap sabar, saudara-saudaraku.', now() - interval '1 day'),
  ('Siti Nurhaliza', 1000000, 'Semoga Allah mengganti dengan yang lebih baik.', now() - interval '18 hours'),
  ('Keluarga Bapak Endang', 300000, NULL, now() - interval '10 hours'),
  ('Hamba Allah', 150000, 'Turut berduka.', now() - interval '4 hours');
