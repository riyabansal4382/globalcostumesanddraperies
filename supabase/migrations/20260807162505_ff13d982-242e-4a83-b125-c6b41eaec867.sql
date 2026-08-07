CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.costumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  source_path text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Other',
  colors text[] NOT NULL DEFAULT '{}',
  sizes text[] NOT NULL DEFAULT '{}',
  tags text[] NOT NULL DEFAULT '{}',
  is_available boolean NOT NULL DEFAULT true,
  rental_price numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.costumes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.costumes TO authenticated;
GRANT ALL ON public.costumes TO service_role;
ALTER TABLE public.costumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can browse costumes" ON public.costumes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can add costumes" ON public.costumes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can edit costumes" ON public.costumes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete costumes" ON public.costumes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER costumes_set_updated_at BEFORE UPDATE ON public.costumes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX costumes_name_idx ON public.costumes USING gin (to_tsvector('english', name || ' ' || description));

INSERT INTO public.costumes (name, description, image_url, category, colors, sizes, tags, rental_price) VALUES
('Victorian Ballgown', 'Full-length emerald ballgown with lace trim and hoop skirt.', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80', 'Historical', ARRAY['Green','Gold'], ARRAY['S','M','L'], ARRAY['ballgown','victorian','period'], 85.00),
('Caped Crusader', 'Black armoured superhero suit with flowing cape and cowl.', 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=800&q=80', 'Superhero', ARRAY['Black','Grey'], ARRAY['M','L','XL'], ARRAY['superhero','cape','hero'], 65.00),
('Court Jester', 'Belled harlequin jester outfit in red and yellow diamonds.', 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=800&q=80', 'Fantasy', ARRAY['Red','Yellow'], ARRAY['S','M','L'], ARRAY['jester','carnival','medieval'], 45.00),
('Snow Fox', 'Plush white animal suit with tail, ears and paw mitts.', 'https://images.unsplash.com/photo-1516214104703-d870798883c5?w=800&q=80', 'Animal', ARRAY['White','Silver'], ARRAY['XS','S','M'], ARRAY['animal','fox','winter'], 55.00),
('Space Voyager', 'Retro-futuristic silver astronaut suit with helmet.', 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=800&q=80', 'Sci-Fi', ARRAY['Silver','Blue'], ARRAY['M','L'], ARRAY['space','astronaut','scifi'], 70.00),
('Midnight Vampire', 'Crimson-lined black cape with velvet waistcoat and fangs.', 'https://images.unsplash.com/photo-1509557965043-6a3d2f1a0f9e?w=800&q=80', 'Halloween', ARRAY['Black','Red'], ARRAY['S','M','L','XL'], ARRAY['vampire','halloween','gothic'], 50.00),
('Flamenco Dancer', 'Ruffled scarlet flamenco dress with layered skirt.', 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=800&q=80', 'Cultural', ARRAY['Red','Black'], ARRAY['XS','S','M'], ARRAY['dance','flamenco','spanish'], 60.00),
('Golden Pharaoh', 'Egyptian pharaoh robe with collar, headdress and staff.', 'https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=800&q=80', 'Historical', ARRAY['Gold','White'], ARRAY['M','L','XL'], ARRAY['egypt','pharaoh','ancient'], 75.00),
('Woodland Fairy', 'Pastel green fairy dress with wings and floral crown.', 'https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?w=800&q=80', 'Fantasy', ARRAY['Green','Pink'], ARRAY['XS','S','M'], ARRAY['fairy','fantasy','wings'], 48.00),
('Steampunk Aviator', 'Brown leather flight coat, goggles and brass accents.', 'https://images.unsplash.com/photo-1520975916090-3105956dac38?w=800&q=80', 'Steampunk', ARRAY['Brown','Bronze'], ARRAY['M','L','XL'], ARRAY['steampunk','aviator','vintage'], 68.00),
('Circus Ringmaster', 'Bold red tailcoat with gold braiding and top hat.', 'https://images.unsplash.com/photo-1533158326339-7f3cf2404354?w=800&q=80', 'Carnival', ARRAY['Red','Gold','Black'], ARRAY['S','M','L','XL'], ARRAY['circus','ringmaster','party'], 62.00),
('Ice Queen', 'Shimmering pale blue gown with crystal cape and crown.', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80', 'Fantasy', ARRAY['Blue','White'], ARRAY['S','M','L'], ARRAY['queen','winter','frozen'], 80.00);