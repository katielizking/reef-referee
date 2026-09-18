-- Expand the species catalogue with 67 common freshwater species.
--
-- Legality: every imported species below was checked by scientific name against the
-- DAFF permitted live freshwater ornamental fish list (effective 17 May 2024) on
-- 18 Sept 2026. daff_listing records the entry each fish matched.
--
-- Care data: tank size, adult size, group, temperament and water values are draft
-- hobby-standard figures, marked care_confidence = 'low' until checked against a
-- primary source.
--
-- Safe to re-run: a row is only inserted when no species with the same common and
-- scientific name exists.

WITH new_species (common_name, scientific_name, min_tank_litres, adult_size_cm, bioload_factor, swim_zone, temperament, is_schooling, min_group_size, fin_nipper, predatory, long_finned, active, native_ph_min, native_ph_max, native_temp_min_c, native_temp_max_c, biotope_region, native_habitat_type, conspecific_strategy, conspecific_notes, daff_listing) AS (
  VALUES
  ('Guppy', 'Poecilia reticulata', 40, 5, 0.9, 'top', 'peaceful', false, 1, false, false, true, true, 7.0, 8.5, 22, 28, 'south_american_river', 'vegetated_margin', 'harem', 'Keep more females than males, around 2 or 3 per male, or keep an all-male group.', 'Poecilia reticulata (2 cm SL minimum)'),
  ('Platy', 'Xiphophorus maculatus', 60, 6, 1.1, 'mid', 'peaceful', false, 1, false, false, false, true, 7.0, 8.2, 20, 26, 'central_american_river', 'vegetated_margin', 'harem', 'Keep more females than males to spread male attention.', 'Xiphophorus maculatus'),
  ('Variatus platy', 'Xiphophorus variatus', 60, 6, 1.1, 'mid', 'peaceful', false, 1, false, false, false, true, 7.0, 8.2, 18, 25, 'central_american_river', 'vegetated_margin', 'harem', 'Tolerates cooler water than the common platy.', 'Xiphophorus variatus'),
  ('Swordtail', 'Xiphophorus hellerii', 100, 12, 2.0, 'mid', 'peaceful', false, 1, false, false, false, true, 7.0, 8.3, 22, 27, 'central_american_river', 'flowing_stream', 'harem', 'Males can spar. One male with several females, or several males in a larger tank.', 'Xiphophorus hellerii'),
  ('Black molly', 'Poecilia sphenops', 80, 8, 1.8, 'mid', 'peaceful', false, 1, false, false, false, true, 7.5, 8.5, 24, 28, 'central_american_river', 'vegetated_margin', 'harem', 'Heavy waste producers for their size. Prefer hard, alkaline water.', 'Poecilia sphenops'),
  ('Sailfin molly', 'Poecilia latipinna', 150, 12, 2.6, 'mid', 'peaceful', false, 1, false, false, false, true, 7.5, 8.5, 24, 28, 'central_american_river', 'vegetated_margin', 'harem', 'Grows much bigger than shop-size fish suggest. Prefers hard, alkaline water.', 'Poecilia latipinna'),
  ('Panda corydoras', 'Corydoras panda', 60, 5, 1.0, 'bottom', 'peaceful', true, 6, false, false, false, true, 6.0, 7.5, 20, 25, 'south_american_river', 'flowing_stream', 'shoal', NULL, 'Corydoras spp'),
  ('Peppered corydoras', 'Corydoras paleatus', 80, 7, 1.4, 'bottom', 'peaceful', true, 6, false, false, false, true, 6.0, 7.8, 18, 24, 'south_american_river', 'flowing_stream', 'shoal', 'Prefers cooler water than most corydoras.', 'Corydoras spp'),
  ('Pygmy corydoras', 'Corydoras pygmaeus', 40, 2.5, 0.5, 'mid', 'peaceful', true, 8, false, false, false, true, 6.0, 7.5, 22, 26, 'south_american_river', 'vegetated_margin', 'shoal', 'Unlike most corydoras, often swims in open mid-water.', 'Corydoras spp'),
  ('Three-line corydoras', 'Corydoras trilineatus', 80, 6, 1.2, 'bottom', 'peaceful', true, 6, false, false, false, true, 6.0, 7.5, 22, 26, 'south_american_river', 'flowing_stream', 'shoal', 'Often sold as the julii corydoras.', 'Corydoras spp'),
  ('Upside-down catfish', 'Synodontis nigriventris', 100, 9, 1.8, 'mid', 'peaceful', true, 3, false, false, false, false, 6.2, 7.5, 22, 26, 'congo_basin', 'vegetated_margin', 'shoal', 'Nocturnal and gregarious. Needs overhangs and cover.', 'Synodontis nigriventris'),
  ('Ghost catfish', 'Kryptopterus vitreolus', 100, 6, 1.1, 'mid', 'peaceful', true, 6, false, false, false, true, 6.5, 7.5, 22, 26, 'se_asian_stream', 'flowing_stream', 'shoal', 'Stressed and hides when kept in small groups.', 'Kryptopterus vitreolus'),
  ('Pictus catfish', 'Pimelodus pictus', 200, 12, 2.8, 'bottom', 'peaceful', true, 3, false, true, false, true, 6.0, 7.5, 22, 26, 'south_american_river', 'flowing_stream', 'shoal', 'Very active at night. Will eat small tetras and similar fish.', 'Pimelodus pictus'),
  ('Black widow tetra', 'Gymnocorymbus ternetzi', 80, 6, 1.2, 'mid', 'peaceful', true, 6, true, false, false, true, 6.0, 7.5, 21, 27, 'south_american_river', 'vegetated_margin', 'shoal', 'Nips long fins, especially in small groups.', 'Gymnocorymbus ternetzi'),
  ('Serpae tetra', 'Hyphessobrycon eques', 80, 4.5, 0.9, 'mid', 'semi-aggressive', true, 8, true, false, false, true, 6.0, 7.5, 22, 27, 'south_american_river', 'vegetated_margin', 'shoal', 'Notorious fin nipper. A bigger group spreads the nipping within the shoal.', 'Hyphessobrycon spp'),
  ('Lemon tetra', 'Hyphessobrycon pulchripinnis', 80, 5, 1.0, 'mid', 'peaceful', true, 6, false, false, false, true, 6.0, 7.5, 22, 28, 'south_american_river', 'vegetated_margin', 'shoal', NULL, 'Hyphessobrycon spp'),
  ('Bleeding heart tetra', 'Hyphessobrycon erythrostigma', 100, 6, 1.2, 'mid', 'peaceful', true, 6, false, false, false, true, 5.5, 7.2, 23, 28, 'amazon_blackwater', 'still_blackwater', 'shoal', NULL, 'Hyphessobrycon spp'),
  ('Glowlight tetra', 'Hemigrammus erythrozonus', 60, 4, 0.8, 'mid', 'peaceful', true, 6, false, false, false, true, 5.5, 7.5, 23, 28, 'south_american_river', 'still_blackwater', 'shoal', NULL, 'Hemigrammus spp'),
  ('Head and tail light tetra', 'Hemigrammus ocellifer', 60, 4.5, 0.9, 'mid', 'peaceful', true, 6, false, false, false, true, 6.0, 7.5, 22, 28, 'south_american_river', 'vegetated_margin', 'shoal', NULL, 'Hemigrammus spp'),
  ('X-ray tetra', 'Pristella maxillaris', 60, 4.5, 0.9, 'mid', 'peaceful', true, 6, false, false, false, true, 6.0, 7.5, 22, 28, 'south_american_river', 'vegetated_margin', 'shoal', NULL, 'Pristella maxillaris'),
  ('Penguin tetra', 'Thayeria boehlkei', 80, 6, 1.2, 'mid', 'peaceful', true, 6, false, false, false, true, 6.0, 7.5, 22, 28, 'amazon_blackwater', 'still_blackwater', 'shoal', NULL, 'Thayeria spp'),
  ('Congo tetra', 'Phenacogrammus interruptus', 150, 8, 2.0, 'mid', 'peaceful', true, 6, false, false, true, true, 6.0, 7.5, 23, 27, 'congo_basin', 'still_blackwater', 'shoal', 'Males have long, flowing fins that attract nippers.', 'Phenacogrammus interruptus'),
  ('Diamond tetra', 'Moenkhausia pittieri', 100, 6, 1.2, 'mid', 'peaceful', true, 6, false, false, false, true, 6.0, 7.5, 24, 28, 'south_american_river', 'vegetated_margin', 'shoal', NULL, 'Moenkhausia spp'),
  ('Silver tip tetra', 'Hasemania nana', 60, 5, 1.0, 'mid', 'peaceful', true, 6, true, false, false, true, 6.0, 8.0, 22, 28, 'south_american_river', 'flowing_stream', 'shoal', 'Fast and nippy. Poor match for long-finned fish.', 'Hasemania nana'),
  ('Emperor tetra', 'Nematobrycon palmeri', 60, 5, 1.0, 'mid', 'peaceful', true, 6, false, false, false, true, 6.0, 7.5, 23, 27, 'south_american_river', 'vegetated_margin', 'shoal', 'Males squabble mildly. Give visual breaks.', 'Nematobrycon spp'),
  ('Golden pencilfish', 'Nannostomus beckfordi', 60, 5, 0.9, 'top', 'peaceful', true, 6, false, false, false, true, 5.5, 7.5, 24, 28, 'south_american_river', 'vegetated_margin', 'shoal', NULL, 'Nannostomus spp'),
  ('Bloodfin tetra', 'Aphyocharax anisitsi', 80, 5.5, 1.1, 'top', 'peaceful', true, 6, true, false, false, true, 6.0, 8.0, 18, 28, 'south_american_river', 'flowing_stream', 'shoal', 'Very active and can nip slow, long-finned fish.', 'Aphyocharax spp'),
  ('Silver dollar', 'Metynnis argenteus', 300, 15, 4.0, 'mid', 'peaceful', true, 5, false, false, false, true, 5.5, 7.5, 24, 28, 'south_american_river', 'flowing_stream', 'shoal', 'Eats most soft plants. Easily spooked in small groups.', 'Metynnis spp. (4 cm SL minimum)'),
  ('Glowlight rasbora', 'Trigonostigma hengeli', 40, 2.5, 0.5, 'mid', 'peaceful', true, 8, false, false, false, true, 5.0, 7.0, 23, 28, 'se_asian_stream', 'still_blackwater', 'shoal', NULL, 'Trigonostigma hengeli'),
  ('Scissortail rasbora', 'Rasbora trilineata', 120, 10, 2.2, 'top', 'peaceful', true, 6, false, false, false, true, 6.0, 7.5, 22, 26, 'se_asian_stream', 'flowing_stream', 'shoal', 'Fast swimmers that need open length.', 'Rasbora trilineata'),
  ('Pearl danio', 'Danio albolineatus', 80, 6, 1.2, 'top', 'peaceful', true, 6, false, false, false, true, 6.5, 7.5, 20, 26, 'se_asian_stream', 'flowing_stream', 'shoal', NULL, 'Danio albolineatus'),
  ('Giant danio', 'Devario malabaricus', 150, 10, 2.4, 'top', 'peaceful', true, 6, false, false, false, true, 6.0, 7.5, 22, 27, 'south_asian_river', 'flowing_stream', 'shoal', 'Needs strong flow and a long tank.', 'Devario malabaricus'),
  ('Rosy barb', 'Pethia conchonius', 120, 10, 2.2, 'mid', 'peaceful', true, 6, true, false, false, true, 6.5, 7.5, 18, 25, 'south_asian_river', 'flowing_stream', 'shoal', 'Can nip when kept in small groups.', 'Pethia conchonius'),
  ('Gold barb', 'Barbodes semifasciolatus', 80, 7, 1.4, 'mid', 'peaceful', true, 6, false, false, false, true, 6.0, 7.5, 18, 24, 'east_asian_stream', 'flowing_stream', 'shoal', NULL, 'Barbodes semifasciolatus (3 cm SL minimum)'),
  ('Black ruby barb', 'Pethia nigrofasciata', 80, 6, 1.2, 'mid', 'peaceful', true, 6, false, false, false, true, 6.0, 7.5, 22, 26, 'south_asian_river', 'flowing_stream', 'shoal', NULL, 'Pethia nigrofasciata'),
  ('White cloud mountain minnow', 'Tanichthys albonubes', 40, 4, 0.8, 'top', 'peaceful', true, 6, false, false, false, true, 6.5, 7.8, 16, 24, 'east_asian_stream', 'flowing_stream', 'shoal', 'A cool-water fish. Does not need a heater in most homes.', 'Tanichthys albonubes'),
  ('Clown loach', 'Chromobotia macracanthus', 450, 25, 6.0, 'bottom', 'peaceful', true, 5, false, false, false, true, 6.0, 7.5, 25, 30, 'se_asian_stream', 'flowing_stream', 'shoal', 'Sold at 5 cm but grows to 25 cm or more over years. Very social.', 'Chromobotia macracanthus'),
  ('Yoyo loach', 'Botia lohachata', 150, 10, 2.2, 'bottom', 'semi-aggressive', true, 5, false, false, false, true, 6.5, 7.5, 24, 28, 'south_asian_river', 'flowing_stream', 'shoal', 'Boisterous and squabbly. Small groups become bullies.', 'Botia lohachata (3 cm SL minimum)'),
  ('Redtail shark', 'Epalzeorhynchos bicolor', 200, 15, 3.2, 'bottom', 'aggressive', false, 1, false, false, false, true, 6.5, 7.5, 22, 26, 'se_asian_stream', 'flowing_stream', 'territorial', 'Keep one per tank. Hostile to similar-looking bottom fish.', 'Epalzeorhynchos bicolor'),
  ('Rainbow shark', 'Epalzeorhynchos frenatum', 200, 15, 3.2, 'bottom', 'aggressive', false, 1, false, false, false, true, 6.5, 7.5, 22, 27, 'se_asian_stream', 'flowing_stream', 'territorial', 'Keep one per tank. Hostile to similar-looking bottom fish.', 'Epalzeorhynchos frenatum'),
  ('Bala shark', 'Balantiocheilos melanopterus', 1000, 30, 8.0, 'mid', 'peaceful', true, 5, false, false, false, true, 6.5, 7.5, 22, 28, 'se_asian_stream', 'flowing_stream', 'shoal', 'Sold small but grows to about 30 cm and needs a group. Beyond almost every home tank.', 'Balantiocheilos melanopterus'),
  ('Chinese algae eater', 'Gyrinocheilus aymonieri', 250, 25, 5.0, 'bottom', 'semi-aggressive', false, 1, false, false, false, true, 6.5, 7.8, 22, 28, 'se_asian_stream', 'flowing_stream', 'territorial', 'Becomes territorial with age and may latch onto flat-sided fish.', 'Gyrinocheilus aymonieri'),
  ('Japanese rice fish', 'Oryzias latipes', 40, 4, 0.7, 'top', 'peaceful', true, 6, false, false, false, true, 7.0, 8.0, 18, 26, 'east_asian_stream', 'vegetated_margin', 'shoal', 'Cool-water tolerant.', 'Oryzias latipes'),
  ('Fancy goldfish', 'Carassius auratus auratus', 110, 18, 6.0, 'mid', 'peaceful', false, 1, false, false, true, false, 7.0, 8.0, 18, 23, 'east_asian_stream', 'vegetated_margin', 'shoal', 'Very heavy waste producer. Best kept only with other fancy goldfish, never with fast single-tail goldfish or tropical fish.', 'Carassius auratus auratus'),
  ('Comet goldfish', 'Carassius auratus auratus', 400, 30, 9.0, 'mid', 'peaceful', false, 1, false, false, false, true, 6.5, 8.0, 10, 24, 'east_asian_stream', 'vegetated_margin', 'shoal', 'A pond fish. Grows to 30 cm and lives for decades.', 'Carassius auratus auratus'),
  ('Three spot gourami', 'Trichopodus trichopterus', 150, 12, 2.8, 'top', 'semi-aggressive', false, 1, false, false, false, false, 6.0, 8.0, 22, 28, 'se_asian_stream', 'vegetated_margin', 'territorial', 'Males can bully each other and other gouramis.', 'Trichopodus trichopterus'),
  ('Banded gourami', 'Trichogaster fasciata', 100, 10, 2.2, 'top', 'peaceful', false, 1, false, false, false, false, 6.0, 7.5, 22, 28, 'south_asian_river', 'vegetated_margin', 'pair', NULL, 'Trichogaster fasciata'),
  ('Sparkling gourami', 'Trichopsis pumila', 30, 4, 0.6, 'top', 'peaceful', false, 1, false, false, false, false, 6.0, 7.5, 24, 28, 'se_asian_stream', 'vegetated_margin', 'pair', 'Tiny and timid. Best with other small, calm fish.', 'Trichopsis pumila'),
  ('Paradise fish', 'Macropodus opercularis', 80, 10, 2.0, 'top', 'aggressive', false, 1, false, false, true, false, 6.0, 8.0, 16, 26, 'east_asian_stream', 'vegetated_margin', 'territorial', 'Keep one male per tank. Cool-water tolerant.', 'Macropodus opercularis (3.5 cm SL minimum)'),
  ('Kissing gourami', 'Helostoma temminkii', 300, 25, 6.0, 'mid', 'semi-aggressive', false, 1, false, false, false, false, 6.0, 8.0, 22, 28, 'se_asian_stream', 'still_blackwater', 'territorial', 'The kissing is a territorial display. Grows much bigger than most buyers expect.', 'Helostoma temminkii'),
  ('Oscar', 'Astronotus ocellatus', 400, 35, 9.0, 'mid', 'semi-aggressive', false, 1, false, true, false, false, 6.0, 7.5, 23, 28, 'south_american_river', 'still_blackwater', 'solitary', 'Sold at 5 cm but reaches 30 cm or more within a couple of years. Eats any fish that fits in its mouth.', 'Astronotus ocellatus'),
  ('Blue acara', 'Andinoacara pulcher', 200, 15, 3.8, 'mid', 'semi-aggressive', false, 1, false, true, false, false, 6.5, 8.0, 22, 28, 'south_american_river', 'vegetated_margin', 'pair', 'Territorial when breeding. Eats small fish.', 'Andinoacara pulcher (3 cm SL minimum)'),
  ('Bolivian ram', 'Mikrogeophagus altispinosus', 100, 8, 1.8, 'bottom', 'peaceful', false, 1, false, false, false, true, 6.0, 7.8, 22, 26, 'south_american_river', 'vegetated_margin', 'pair', 'Hardier than the German blue ram.', 'Mikrogeophagus altispinosus'),
  ('Kribensis', 'Pelvicachromis pulcher', 100, 10, 2.2, 'bottom', 'semi-aggressive', false, 1, false, false, false, false, 6.0, 7.5, 24, 27, 'west_african_stream', 'vegetated_margin', 'pair', 'Peaceful most of the time, fierce when guarding fry. Keep as a pair.', 'Pelvicachromis pulcher'),
  ('Cockatoo dwarf cichlid', 'Apistogramma cacatuoides', 60, 8, 1.4, 'bottom', 'semi-aggressive', false, 1, false, false, false, false, 6.0, 7.5, 24, 28, 'south_american_river', 'still_blackwater', 'harem', 'One male with one or more females. Needs caves.', 'Apistogramma spp'),
  ('Keyhole cichlid', 'Cleithracara maronii', 120, 10, 2.2, 'mid', 'peaceful', false, 1, false, false, false, false, 6.0, 7.5, 22, 26, 'south_american_river', 'still_blackwater', 'pair', 'Shy and one of the most peaceful cichlids.', 'Cleithracara maronii'),
  ('Festivum', 'Mesonauta festivus', 200, 15, 3.5, 'mid', 'semi-aggressive', false, 1, false, true, false, false, 6.0, 7.5, 24, 28, 'south_american_river', 'still_blackwater', 'pair', 'Will eat small tetras.', 'Mesonauta festivus (non-albino form only)'),
  ('Princess of Burundi', 'Neolamprologus brichardi', 150, 10, 2.2, 'mid', 'aggressive', false, 1, false, false, false, false, 8.0, 9.0, 23, 27, 'lake_tanganyika', 'rocky_rift_lake', 'colony', 'Lives in family colonies that defend a large territory from other fish.', 'Neolamprologus brichardi'),
  ('Gold ocellatus', 'Lamprologus ocellatus', 40, 5, 0.9, 'bottom', 'semi-aggressive', false, 1, false, false, false, false, 7.8, 9.0, 23, 27, 'lake_tanganyika', 'rocky_rift_lake', 'colony', 'A shell dweller. Needs a sand bed and more empty shells than fish.', 'Lamprologus ocellatus (3 cm SL minimum)'),
  ('Marlier''s julie', 'Julidochromis marlieri', 150, 14, 3.0, 'bottom', 'semi-aggressive', false, 1, false, false, false, false, 8.0, 9.0, 23, 27, 'lake_tanganyika', 'rocky_rift_lake', 'pair', 'Rock-dwelling pair that defends its cave.', 'Julidochromis spp'),
  ('African butterfly fish', 'Pantodon buchholzi', 120, 12, 2.2, 'top', 'peaceful', false, 1, false, true, true, false, 6.0, 7.5, 24, 29, 'west_african_stream', 'still_blackwater', 'solitary', 'Surface predator that eats small fish near the top. Needs a tight lid.', 'Pantodon buchholzi'),
  ('Black ghost knifefish', 'Apteronotus albifrons', 500, 45, 10.0, 'bottom', 'semi-aggressive', false, 1, false, true, false, false, 6.0, 7.5, 23, 28, 'south_american_river', 'flowing_stream', 'solitary', 'Sold small but reaches 45 cm or more. Hunts small fish at night.', 'Apteronotus albifrons'),
  ('Indian glassy fish', 'Parambassis ranga', 80, 7, 1.4, 'mid', 'peaceful', true, 6, false, false, false, false, 7.0, 8.0, 22, 28, 'south_asian_river', 'vegetated_margin', 'shoal', 'Avoid artificially dyed fish.', 'Parambassis ranga'),
  ('Spotted blue-eye', 'Pseudomugil gertrudae', 30, 3, 0.5, 'top', 'peaceful', true, 8, false, false, false, true, 5.5, 7.5, 22, 30, 'australian_native', 'vegetated_margin', 'shoal', NULL, NULL),
  ('Agassiz''s glassfish', 'Ambassis agassizii', 60, 6, 1.1, 'mid', 'peaceful', true, 6, false, false, false, false, 7.0, 8.0, 15, 28, 'australian_native', 'vegetated_margin', 'shoal', NULL, NULL),
  ('Firetail gudgeon', 'Hypseleotris galii', 40, 5, 0.9, 'bottom', 'peaceful', false, 1, false, false, false, false, 6.5, 8.0, 15, 26, 'australian_native', 'vegetated_margin', 'territorial', 'Males hold small territories during breeding.', NULL),
  ('Eastern rainbowfish', 'Melanotaenia splendida splendida', 150, 12, 2.6, 'mid', 'peaceful', true, 6, false, false, false, true, 6.5, 8.0, 22, 28, 'australian_native', 'flowing_stream', 'shoal', NULL, NULL)
)
INSERT INTO public.species (common_name, scientific_name, min_tank_litres, adult_size_cm, bioload_factor, swim_zone, temperament, is_schooling, min_group_size, fin_nipper, predatory, long_finned, active, native_ph_min, native_ph_max, native_temp_min_c, native_temp_max_c, biotope_region, native_habitat_type, conspecific_strategy, conspecific_notes,
  legal_in_australia, legal_status, legal_note, legal_import_status, legal_possession_status,
  legal_source_label, legal_source_url, legal_reviewed_on, legal_confidence,
  care_source_label, care_confidence)
SELECT n.common_name, n.scientific_name, n.min_tank_litres, n.adult_size_cm, n.bioload_factor, n.swim_zone, n.temperament, n.is_schooling, n.min_group_size, n.fin_nipper, n.predatory, n.long_finned, n.active, n.native_ph_min, n.native_ph_max, n.native_temp_min_c, n.native_temp_max_c, n.biotope_region, n.native_habitat_type, n.conspecific_strategy, n.conspecific_notes,
  true,
  CASE WHEN n.daff_listing IS NULL THEN 'native' ELSE 'permitted' END,
  CASE WHEN n.daff_listing IS NULL
    THEN 'Australian native. Collection and keeping rules vary by state and territory.'
    ELSE 'Listed on the DAFF permitted freshwater ornamental fish list as ' || n.daff_listing || '.' END,
  CASE WHEN n.daff_listing IS NULL THEN 'not_applicable_native' ELSE 'permitted_with_conditions' END,
  CASE WHEN n.daff_listing IS NULL THEN 'check_state_permits' ELSE 'generally_permitted_check_state' END,
  CASE WHEN n.daff_listing IS NULL
    THEN 'Check the relevant state or territory fisheries authority'
    ELSE 'Australian Government (DAFF) permitted live freshwater ornamental fish list, effective 17 May 2024' END,
  CASE WHEN n.daff_listing IS NULL THEN NULL
    ELSE 'https://www.agriculture.gov.au/sites/default/files/documents/list-permitted-live-freshwater-ornamental-fish-suitable-for-import.pdf' END,
  DATE '2026-09-18',
  CASE WHEN n.daff_listing IS NULL THEN 'incomplete' ELSE 'medium' END,
  'Draft values from general hobby references. Not yet checked against a primary source.',
  'low'
FROM new_species n
WHERE NOT EXISTS (
  SELECT 1 FROM public.species s
  WHERE lower(s.scientific_name) = lower(n.scientific_name)
    AND lower(s.common_name) = lower(n.common_name)
);
