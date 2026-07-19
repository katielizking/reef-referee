
-- ============ CATALOGUE TABLES ============
CREATE TABLE public.species (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  common_name TEXT NOT NULL,
  scientific_name TEXT NOT NULL,
  min_tank_litres NUMERIC NOT NULL,
  adult_size_cm NUMERIC NOT NULL,
  bioload_factor NUMERIC NOT NULL,
  swim_zone TEXT NOT NULL CHECK (swim_zone IN ('top','mid','bottom')),
  temperament TEXT NOT NULL CHECK (temperament IN ('peaceful','semi-aggressive','aggressive')),
  is_schooling BOOLEAN NOT NULL DEFAULT FALSE,
  min_group_size INT NOT NULL DEFAULT 1,
  fin_nipper BOOLEAN NOT NULL DEFAULT FALSE,
  predatory BOOLEAN NOT NULL DEFAULT FALSE,
  long_finned BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  native_ph_min NUMERIC NOT NULL,
  native_ph_max NUMERIC NOT NULL,
  native_temp_min_c NUMERIC NOT NULL,
  native_temp_max_c NUMERIC NOT NULL,
  biotope_region TEXT NOT NULL,
  native_habitat_type TEXT NOT NULL,
  legal_in_australia BOOLEAN NOT NULL DEFAULT TRUE
);
GRANT SELECT ON public.species TO anon, authenticated;
GRANT ALL ON public.species TO service_role;
ALTER TABLE public.species ENABLE ROW LEVEL SECURITY;
CREATE POLICY "species readable by everyone" ON public.species FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  common_name TEXT NOT NULL,
  scientific_name TEXT NOT NULL,
  biotope_region TEXT NOT NULL,
  light_need TEXT NOT NULL CHECK (light_need IN ('low','med','high'))
);
GRANT SELECT ON public.plants TO anon, authenticated;
GRANT ALL ON public.plants TO service_role;
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plants readable by everyone" ON public.plants FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.hardscape (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rock','wood','substrate','leaf_litter')),
  biotope_region TEXT NOT NULL
);
GRANT SELECT ON public.hardscape TO anon, authenticated;
GRANT ALL ON public.hardscape TO service_role;
ALTER TABLE public.hardscape ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hardscape readable by everyone" ON public.hardscape FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rated_litres NUMERIC NOT NULL,
  turnover_lph NUMERIC NOT NULL
);
GRANT SELECT ON public.filters TO anon, authenticated;
GRANT ALL ON public.filters TO service_role;
ALTER TABLE public.filters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "filters readable by everyone" ON public.filters FOR SELECT TO anon, authenticated USING (true);

-- ============ TANK TABLES ============
CREATE TABLE public.tanks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  share_slug TEXT NOT NULL UNIQUE DEFAULT substr(md5(random()::text || clock_timestamp()::text), 1, 10),
  name TEXT NOT NULL,
  length_cm NUMERIC NOT NULL,
  width_cm NUMERIC NOT NULL,
  height_cm NUMERIC NOT NULL,
  filter_id UUID REFERENCES public.filters(id),
  maintenance_frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (maintenance_frequency IN ('weekly','fortnightly','monthly')),
  target_ph NUMERIC NOT NULL DEFAULT 7.0,
  target_temp_c NUMERIC NOT NULL DEFAULT 25,
  plant_density TEXT NOT NULL DEFAULT 'light' CHECK (plant_density IN ('none','light','medium','heavy')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX tanks_session_idx ON public.tanks(session_id);
CREATE INDEX tanks_slug_idx ON public.tanks(share_slug);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tanks TO anon, authenticated;
GRANT ALL ON public.tanks TO service_role;
ALTER TABLE public.tanks ENABLE ROW LEVEL SECURITY;
-- v1: no auth, session_id is client-supplied. Anyone can read (share via slug) and write.
CREATE POLICY "tanks readable by everyone" ON public.tanks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "tanks writable by everyone" ON public.tanks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "tanks updatable by everyone" ON public.tanks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tanks deletable by everyone" ON public.tanks FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE public.tank_species (
  tank_id UUID NOT NULL REFERENCES public.tanks(id) ON DELETE CASCADE,
  species_id UUID NOT NULL REFERENCES public.species(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (tank_id, species_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tank_species TO anon, authenticated;
GRANT ALL ON public.tank_species TO service_role;
ALTER TABLE public.tank_species ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tank_species read all" ON public.tank_species FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "tank_species write all" ON public.tank_species FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "tank_species update all" ON public.tank_species FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tank_species delete all" ON public.tank_species FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE public.tank_plants (
  tank_id UUID NOT NULL REFERENCES public.tanks(id) ON DELETE CASCADE,
  plant_id UUID NOT NULL REFERENCES public.plants(id),
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  PRIMARY KEY (tank_id, plant_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tank_plants TO anon, authenticated;
GRANT ALL ON public.tank_plants TO service_role;
ALTER TABLE public.tank_plants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tank_plants read all" ON public.tank_plants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "tank_plants write all" ON public.tank_plants FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "tank_plants update all" ON public.tank_plants FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tank_plants delete all" ON public.tank_plants FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE public.tank_hardscape (
  tank_id UUID NOT NULL REFERENCES public.tanks(id) ON DELETE CASCADE,
  hardscape_id UUID NOT NULL REFERENCES public.hardscape(id),
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  PRIMARY KEY (tank_id, hardscape_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tank_hardscape TO anon, authenticated;
GRANT ALL ON public.tank_hardscape TO service_role;
ALTER TABLE public.tank_hardscape ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tank_hardscape read all" ON public.tank_hardscape FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "tank_hardscape write all" ON public.tank_hardscape FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "tank_hardscape update all" ON public.tank_hardscape FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tank_hardscape delete all" ON public.tank_hardscape FOR DELETE TO anon, authenticated USING (true);

-- ============ SEED: FILTERS ============
INSERT INTO public.filters (name, rated_litres, turnover_lph) VALUES
('Aqua One 105F internal', 40, 200),
('AquaClear 20 HOB', 75, 380),
('AquaClear 50 HOB', 190, 760),
('AquaClear 110 HOB', 400, 1890),
('Eheim Classic 250 canister', 250, 440),
('Fluval 307 canister', 330, 1150),
('Fluval FX4 canister', 700, 1700),
('Dual sponge filter (air-driven)', 100, 300);

-- ============ SEED: SPECIES (44) ============
INSERT INTO public.species (common_name, scientific_name, min_tank_litres, adult_size_cm, bioload_factor, swim_zone, temperament, is_schooling, min_group_size, fin_nipper, predatory, long_finned, active, native_ph_min, native_ph_max, native_temp_min_c, native_temp_max_c, biotope_region, native_habitat_type, legal_in_australia) VALUES
-- Amazon blackwater
('Cardinal tetra','Paracheirodon axelrodi',60,5,1.0,'mid','peaceful',true,6,false,false,false,true,4.5,6.5,23,28,'amazon_blackwater','still_blackwater',true),
('Neon tetra','Paracheirodon innesi',60,4,0.9,'mid','peaceful',true,6,false,false,false,true,5.0,7.0,20,26,'amazon_blackwater','still_blackwater',true),
('Rummy-nose tetra','Hemigrammus rhodostomus',80,5,1.1,'mid','peaceful',true,6,false,false,false,true,5.5,7.0,22,28,'amazon_blackwater','still_blackwater',true),
('Black neon tetra','Hyphessobrycon herbertaxelrodi',60,4,0.9,'mid','peaceful',true,6,false,false,false,true,5.5,7.5,23,27,'amazon_blackwater','still_blackwater',true),
('Ember tetra','Hyphessobrycon amandae',40,2,0.5,'mid','peaceful',true,6,false,false,false,true,5.5,7.0,23,29,'amazon_blackwater','still_blackwater',true),
('Sterba''s corydoras','Corydoras sterbai',80,7,1.4,'bottom','peaceful',true,5,false,false,false,true,6.0,7.5,24,28,'amazon_blackwater','still_blackwater',true),
('Bronze corydoras','Corydoras aeneus',80,7,1.4,'bottom','peaceful',true,5,false,false,false,true,6.0,7.8,22,28,'amazon_blackwater','still_blackwater',true),
('Angelfish','Pterophyllum scalare',200,15,4.5,'mid','semi-aggressive',false,1,false,true,true,false,5.8,7.0,24,29,'amazon_blackwater','still_blackwater',true),
('Discus','Symphysodon aequifasciatus',300,20,5.5,'mid','peaceful',true,4,false,false,false,false,4.5,6.5,27,30,'amazon_blackwater','still_blackwater',true),
('German blue ram','Mikrogeophagus ramirezi',80,7,1.6,'bottom','peaceful',false,1,false,false,false,false,5.5,7.0,26,30,'amazon_blackwater','still_blackwater',true),
('Marbled hatchetfish','Carnegiella strigata',80,4,0.9,'top','peaceful',true,6,false,false,false,true,5.5,7.0,24,28,'amazon_blackwater','still_blackwater',true),
('Otocinclus','Otocinclus vittatus',60,4,0.7,'mid','peaceful',true,6,false,false,false,true,6.0,7.5,22,26,'amazon_blackwater','flowing_stream',true),
-- Lake Malawi rift
('Yellow lab cichlid','Labidochromis caeruleus',200,10,3.0,'mid','semi-aggressive',false,1,false,false,false,true,7.6,8.6,24,28,'lake_malawi','rocky_rift_lake',true),
('Demasoni cichlid','Chindongo demasoni',200,8,2.5,'mid','aggressive',false,1,true,false,false,true,7.6,8.6,24,28,'lake_malawi','rocky_rift_lake',true),
('Rusty cichlid','Iodotropheus sprengerae',200,10,3.0,'mid','semi-aggressive',false,1,false,false,false,true,7.6,8.6,24,28,'lake_malawi','rocky_rift_lake',true),
('Peacock cichlid','Aulonocara stuartgranti',250,13,3.5,'mid','semi-aggressive',false,1,false,false,false,true,7.6,8.6,24,28,'lake_malawi','rocky_rift_lake',true),
('Auratus cichlid','Melanochromis auratus',250,11,3.2,'mid','aggressive',false,1,true,false,false,true,7.6,8.6,24,28,'lake_malawi','rocky_rift_lake',true),
('Red zebra cichlid','Maylandia estherae',200,12,3.2,'mid','aggressive',false,1,true,false,false,true,7.6,8.6,24,28,'lake_malawi','rocky_rift_lake',true),
('Kenyi cichlid','Maylandia lombardoi',250,12,3.4,'mid','aggressive',false,1,true,false,false,true,7.6,8.6,24,28,'lake_malawi','rocky_rift_lake',true),
('Afra cichlid','Cynotilapia afra',200,10,3.0,'mid','semi-aggressive',false,1,false,false,false,true,7.6,8.6,24,28,'lake_malawi','rocky_rift_lake',true),
-- SE Asian stream
('Cherry barb','Puntius titteya',60,5,1.0,'mid','peaceful',true,6,false,false,false,true,6.0,7.5,23,27,'se_asian_stream','flowing_stream',true),
('Harlequin rasbora','Trigonostigma heteromorpha',60,5,1.0,'mid','peaceful',true,6,false,false,false,true,5.5,7.5,22,28,'se_asian_stream','flowing_stream',true),
('Chili rasbora','Boraras brigittae',30,2,0.4,'mid','peaceful',true,8,false,false,false,true,4.0,7.0,24,28,'se_asian_stream','still_blackwater',true),
('Betta','Betta splendens',20,6,1.2,'top','aggressive',false,1,true,false,true,false,6.0,7.5,24,28,'se_asian_stream','still_blackwater',true),
('Kuhli loach','Pangio kuhlii',80,10,1.5,'bottom','peaceful',true,4,false,false,false,false,5.5,7.0,24,28,'se_asian_stream','flowing_stream',true),
('Honey gourami','Trichogaster chuna',60,5,1.1,'top','peaceful',false,1,false,false,false,false,6.0,7.5,22,28,'se_asian_stream','still_blackwater',true),
('Pearl gourami','Trichopodus leerii',150,12,3.0,'top','peaceful',false,1,false,false,true,false,6.0,7.5,24,28,'se_asian_stream','still_blackwater',true),
('Dwarf gourami','Trichogaster lalius',80,7,1.5,'top','peaceful',false,1,false,false,true,false,6.0,7.5,22,28,'se_asian_stream','still_blackwater',true),
('Zebra danio','Danio rerio',60,5,1.0,'top','peaceful',true,6,true,false,false,true,6.0,8.0,18,25,'se_asian_stream','flowing_stream',true),
('Celestial pearl danio','Danio margaritatus',30,2,0.4,'mid','peaceful',true,6,false,false,false,true,6.5,7.5,20,26,'se_asian_stream','flowing_stream',true),
('Tiger barb','Puntigrus tetrazona',100,7,1.6,'mid','semi-aggressive',true,6,true,false,false,true,6.0,7.5,22,28,'se_asian_stream','flowing_stream',true),
('Siamese algae eater','Crossocheilus siamensis',100,15,2.5,'bottom','peaceful',true,4,false,false,false,true,6.0,7.5,22,28,'se_asian_stream','flowing_stream',true),
-- Australian native
('Pacific blue-eye','Pseudomugil signifer',60,4,0.8,'top','peaceful',true,6,false,false,false,true,7.0,8.0,20,28,'australian_native','flowing_stream',true),
('Empire gudgeon','Hypseleotris compressa',80,8,1.6,'bottom','peaceful',false,1,false,false,false,false,6.5,8.0,20,28,'australian_native','flowing_stream',true),
('Murray river rainbowfish','Melanotaenia fluviatilis',150,10,2.5,'mid','peaceful',true,6,false,false,false,true,7.0,8.0,18,28,'australian_native','flowing_stream',true),
('Desert goby','Chlamydogobius eremius',60,6,1.2,'bottom','peaceful',false,1,false,false,false,false,7.0,8.5,15,32,'australian_native','still_blackwater',true),
('Purple-spotted gudgeon','Mogurnda adspersa',100,12,2.5,'bottom','semi-aggressive',false,1,false,true,false,false,6.5,8.0,20,30,'australian_native','still_blackwater',true),
('Crimson-spotted rainbowfish','Melanotaenia duboulayi',150,10,2.5,'mid','peaceful',true,6,false,false,false,true,6.5,8.0,20,28,'australian_native','flowing_stream',true),
('Threadfin rainbowfish','Iriatherina werneri',60,5,0.9,'mid','peaceful',true,6,false,false,true,true,5.5,7.5,22,30,'australian_native','still_blackwater',true),
('Fly-specked hardyhead','Craterocephalus stercusmuscarum',80,6,1.2,'mid','peaceful',true,6,false,false,false,true,6.5,8.0,18,30,'australian_native','flowing_stream',true),
-- Illegal in Australia
('Red-bellied piranha','Pygocentrus nattereri',400,30,7.0,'mid','aggressive',true,4,false,true,false,true,5.5,7.5,24,28,'amazon_blackwater','still_blackwater',false),
('Giant snakehead','Channa micropeltes',1000,100,15.0,'mid','aggressive',false,1,false,true,false,true,6.0,7.5,24,28,'se_asian_stream','still_blackwater',false),
('Alligator gar','Atractosteus spatula',4000,200,25.0,'mid','aggressive',false,1,false,true,false,false,6.5,8.0,22,28,'amazon_blackwater','still_blackwater',false),
('Walking catfish','Clarias batrachus',300,50,8.0,'bottom','aggressive',false,1,false,true,false,true,6.0,8.0,22,28,'se_asian_stream','still_blackwater',false);

-- ============ SEED: PLANTS (15) ============
INSERT INTO public.plants (common_name, scientific_name, biotope_region, light_need) VALUES
('Amazon sword','Echinodorus grisebachii','amazon_blackwater','med'),
('Cabomba','Cabomba caroliniana','amazon_blackwater','high'),
('Amazon frogbit','Limnobium laevigatum','amazon_blackwater','med'),
('Ludwigia repens','Ludwigia repens','amazon_blackwater','high'),
('Java fern','Microsorum pteropus','se_asian_stream','low'),
('Cryptocoryne wendtii','Cryptocoryne wendtii','se_asian_stream','low'),
('Bucephalandra','Bucephalandra sp.','se_asian_stream','low'),
('Rotala rotundifolia','Rotala rotundifolia','se_asian_stream','high'),
('Anubias nana','Anubias barteri var. nana','se_asian_stream','low'),
('Java moss','Taxiphyllum barbieri','se_asian_stream','low'),
('Vallisneria (jungle val)','Vallisneria australis','australian_native','med'),
('Ottelia','Ottelia ovalifolia','australian_native','high'),
('Native water lily','Nymphaea violacea','australian_native','high'),
('Ribbonweed','Vallisneria spiralis','lake_malawi','med'),
('Hornwort','Ceratophyllum demersum','amazon_blackwater','med');

-- ============ SEED: HARDSCAPE (15) ============
INSERT INTO public.hardscape (name, type, biotope_region) VALUES
('Amazonian driftwood','wood','amazon_blackwater'),
('Spider wood','wood','se_asian_stream'),
('Mopani wood','wood','amazon_blackwater'),
('Malaysian driftwood','wood','se_asian_stream'),
('River red gum branch','wood','australian_native'),
('Seiryu stone','rock','se_asian_stream'),
('Dragon stone (ohko)','rock','se_asian_stream'),
('Malawi holey rock','rock','lake_malawi'),
('Texas holey rock','rock','lake_malawi'),
('Lava rock','rock','lake_malawi'),
('River pebbles','rock','australian_native'),
('Aquasoil','substrate','amazon_blackwater'),
('Fine white sand','substrate','lake_malawi'),
('Black diamond sand','substrate','amazon_blackwater'),
('Indian almond leaves','leaf_litter','se_asian_stream');
