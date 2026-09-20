-- Species and filters found in independent shop listings, 20 September 2026.
-- Already applied to the live database. Every species row carries its published
-- care source. Rows whose published data was incomplete were left out rather
-- than filled with guesses.

insert into public.species (common_name,scientific_name,min_tank_litres,adult_size_cm,bioload_factor,swim_zone,temperament,is_schooling,min_group_size,fin_nipper,predatory,long_finned,native_ph_min,native_ph_max,native_temp_min_c,native_temp_max_c,biotope_region,native_habitat_type,care_source_label,care_source_url,care_reviewed_on,care_confidence)
values
('Knife livebearer','Alfaro cultratus',80,8.0,1.8,'top','peaceful',true,6,false,false,false,6.0,8.0,24,28,'central-american','rivers, streams and backwaters','Seriously Fish','https://www.seriouslyfish.com/species/alfaro-cultratus','2026-09-20','high'),
('Dawn tetra','Aphyocharax nattereri',54,3.1,0.7,'mid','peaceful',true,6,false,false,false,5.5,7.5,22,27,'south-american','shaded streams and tributaries','Seriously Fish','https://www.seriouslyfish.com/species/aphyocharax-paraguayensis','2026-09-20','high'),
('Cochu''s blue tetra','Boehlkea fredcochui',100,5.5,1.2,'mid','peaceful',true,6,false,false,false,6.0,7.5,22,27,'south-american','Amazon basin streams and rivers','FishBase','https://en.wikipedia.org/wiki/Boehlkea_fredcochui','2026-09-20','medium'),
('Least rasbora','Boraras urophthalmoides',54,1.6,0.4,'top','peaceful',true,8,false,false,false,6.0,7.0,20,28,'south-east-asian','freshwater swamps and slow streams','Seriously Fish','https://www.seriouslyfish.com/species/boraras-urophthalmoides','2026-09-20','high'),
('Gold ring danio','Brachydanio tinwini',54,3.0,0.7,'mid','peaceful',true,8,false,false,false,6.5,7.5,18,26,'south-east-asian','tributary streams, Ayeyarwaddy drainage','Seriously Fish','https://www.seriouslyfish.com/species/brachydanio-tinwini','2026-09-20','high'),
('Bucktooth tetra','Exodon paradoxus',125,15.0,3.3,'mid','aggressive',true,10,true,true,false,5.5,7.5,23,28,'south-american','sandy savannah rivers','Seriously Fish','https://www.seriouslyfish.com/species/exodon-paradoxus','2026-09-20','high'),
('Head and taillight tetra','Hemigrammus ocellifer',70,4.5,1.0,'mid','peaceful',true,6,false,false,false,5.5,7.5,24,28,'south-american','slow rivers and floodplain lakes','Seriously Fish','https://www.seriouslyfish.com/species/hemigrammus-ocellifer','2026-09-20','high'),
('Bleeding heart tetra','Hyphessobrycon erythrostigma',81,6.0,1.3,'mid','peaceful',true,6,false,false,false,4.0,7.5,21,28,'south-american','sluggish tributaries and forest lakes','Seriously Fish','https://www.seriouslyfish.com/species/hyphessobrycon-erythrostigma','2026-09-20','high'),
('Spotted blue-eye','Pseudomugil gertrudae',54,3.8,0.8,'top','peaceful',true,6,false,false,false,4.5,7.5,21,28,'unmapped','small slow creeks and paperbark swamps','Seriously Fish','https://www.seriouslyfish.com/species/pseudomugil-gertrudae','2026-09-20','high'),
('Panduro''s dwarf cichlid','Apistogramma panduro',54,7.5,1.7,'bottom','semi-aggressive',false,1,false,false,false,4.0,6.5,22,29,'south-american','leaf litter backwaters and creeks','Seriously Fish','https://www.seriouslyfish.com/species/apistogramma-panduro','2026-09-20','high'),
('Oscar','Astronotus ocellatus',900,35.0,7.7,'mid','semi-aggressive',false,1,false,true,false,6.0,7.5,20,28,'south-american','shallow still forested waters','Seriously Fish','https://www.seriouslyfish.com/species/astronotus-ocellatus','2026-09-20','high'),
('Dwarf puffer','Carinotetraodon travancoricus',38,2.5,0.6,'bottom','semi-aggressive',false,1,false,true,false,6.8,8.0,22,28,'unmapped','sluggish heavily vegetated inland waters','Seriously Fish','https://www.seriouslyfish.com/species/carinotetraodon-travancoricus','2026-09-20','high'),
('Sulphur-headed hap','Otopharynx lithobates',160,16.0,3.5,'mid','semi-aggressive',false,1,false,true,false,7.6,8.8,24,28,'african','rocky caves and crevices, Lake Malawi','Seriously Fish','https://www.seriouslyfish.com/species/otopharynx-lithobates','2026-09-20','high'),
('Fahaka puffer','Tetraodon lineatus',450,43.0,9.5,'mid','aggressive',false,1,false,true,false,6.5,7.5,24,26,'african','lakes and rivers, open and vegetated water','Seriously Fish','https://www.seriouslyfish.com/species/tetraodon-lineatus','2026-09-20','medium')
on conflict do nothing;

insert into public.filters (name, rated_litres, turnover_lph) values
('Oase FiltoSmart 60',60,300),('Oase FiltoSmart 100',100,600),('Oase FiltoSmart 200',200,800),('Oase FiltoSmart 300',300,1000),
('Oase BioMaster 250',250,900),('Fluval AquaClear 20',76,379),('Fluval AquaClear 30',114,568),('Fluval AquaClear 50',190,757),
('Fluval FX4',1000,2650),('Fluval FX6',1500,3500),('Eheim Classic 250 (2213)',250,440),('Eheim Classic 350 (2215)',350,620),
('Marineland Penguin 200 Pro',189,200),('JBL CristalProfi e702',200,700),('Seachem Tidal 35',130,130),('Seachem Tidal 55',200,250)
on conflict do nothing;
