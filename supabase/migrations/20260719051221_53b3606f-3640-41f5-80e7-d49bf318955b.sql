
ALTER TABLE public.species
  ADD COLUMN legal_status text NOT NULL DEFAULT 'permitted'
    CHECK (legal_status IN ('permitted', 'native', 'prohibited')),
  ADD COLUMN legal_note text;

-- Permitted (imported)
UPDATE public.species SET legal_status='permitted', legal_note='On DAFF permitted import list (Paracheirodon). Tetras explicitly unaffected by GIV testing rules.', legal_in_australia=true WHERE scientific_name='Paracheirodon axelrodi';
UPDATE public.species SET legal_status='permitted', legal_note='On DAFF permitted import list (Paracheirodon).', legal_in_australia=true WHERE scientific_name='Paracheirodon innesi';
UPDATE public.species SET legal_status='permitted', legal_note='On DAFF permitted import list (Hemigrammus spp.).', legal_in_australia=true WHERE scientific_name='Hemigrammus rhodostomus';
UPDATE public.species SET legal_status='permitted', legal_note='On DAFF permitted import list (Hyphessobrycon spp.).', legal_in_australia=true WHERE scientific_name='Hyphessobrycon herbertaxelrodi';
UPDATE public.species SET legal_status='permitted', legal_note='On DAFF permitted import list (Hyphessobrycon spp.).', legal_in_australia=true WHERE scientific_name='Hyphessobrycon amandae';
UPDATE public.species SET legal_status='permitted', legal_note='On DAFF permitted import list (Corydoras spp.).', legal_in_australia=true WHERE scientific_name='Corydoras sterbai';
UPDATE public.species SET legal_status='permitted', legal_note='On DAFF permitted import list (Corydoras spp.).', legal_in_australia=true WHERE scientific_name='Corydoras aeneus';
UPDATE public.species SET legal_status='permitted', legal_note='On DAFF permitted import list; cichlid subject to GIV testing on the import side but legal to keep.', legal_in_australia=true WHERE scientific_name='Pterophyllum scalare';
UPDATE public.species SET legal_status='permitted', legal_note='On DAFF permitted import list; cichlid subject to GIV testing on the import side but legal to keep.', legal_in_australia=true WHERE scientific_name='Symphysodon aequifasciatus';
UPDATE public.species SET legal_status='permitted', legal_note='Explicitly on DAFF permitted list (Mikrogeophagus ramirezi). Note: native to the Orinoco/llanos not the Amazon - biotope tag is approximate.', legal_in_australia=true WHERE scientific_name='Mikrogeophagus ramirezi';
UPDATE public.species SET legal_status='permitted', legal_note='On DAFF permitted import list (Carnegiella spp.).', legal_in_australia=true WHERE scientific_name='Carnegiella strigata';
UPDATE public.species SET legal_status='permitted', legal_note='On DAFF permitted import list (Otocinclus spp.).', legal_in_australia=true WHERE scientific_name='Otocinclus vittatus';
UPDATE public.species SET legal_status='permitted', legal_note='On DAFF permitted import list; Lake Malawi mbuna. Some mbuna carry a 5cm minimum-length import condition.', legal_in_australia=true WHERE scientific_name='Labidochromis caeruleus';
UPDATE public.species SET legal_status='permitted', legal_note='Lake Malawi mbuna on DAFF permitted list. Genus recently split from Pseudotropheus/Maylandia - listing may appear under an older genus name.', legal_in_australia=true WHERE scientific_name='Chindongo demasoni';
UPDATE public.species SET legal_status='permitted', legal_note='Lake Malawi mbuna on DAFF permitted list.', legal_in_australia=true WHERE scientific_name='Iodotropheus sprengerae';
UPDATE public.species SET legal_status='permitted', legal_note='On DAFF permitted import list (Aulonocara spp.).', legal_in_australia=true WHERE scientific_name='Aulonocara stuartgranti';
UPDATE public.species SET legal_status='permitted', legal_note='On DAFF permitted import list (Melanochromis spp.).', legal_in_australia=true WHERE scientific_name='Melanochromis auratus';
UPDATE public.species SET legal_status='permitted', legal_note='On DAFF permitted import list (Maylandia spp.).', legal_in_australia=true WHERE scientific_name='Maylandia estherae';
UPDATE public.species SET legal_status='permitted', legal_note='On DAFF permitted import list (Maylandia spp.).', legal_in_australia=true WHERE scientific_name='Maylandia lombardoi';
UPDATE public.species SET legal_status='permitted', legal_note='Lake Malawi mbuna on DAFF permitted list.', legal_in_australia=true WHERE scientific_name='Cynotilapia afra';
UPDATE public.species SET legal_status='permitted', legal_note='On DAFF permitted import list. Native to Sri Lanka - within the broad Asian bucket.', legal_in_australia=true WHERE scientific_name='Puntius titteya';
UPDATE public.species SET legal_status='permitted', legal_note='On DAFF permitted import list.', legal_in_australia=true WHERE scientific_name='Trigonostigma heteromorpha';
UPDATE public.species SET legal_status='permitted', legal_note='On DAFF permitted import list (Boraras spp.).', legal_in_australia=true WHERE scientific_name='Boraras brigittae';
UPDATE public.species SET legal_status='permitted', legal_note='Permitted import; subject to GIV/megalocytivirus testing on the import side but legal to keep and widely sold.', legal_in_australia=true WHERE scientific_name='Betta splendens';
UPDATE public.species SET legal_status='permitted', legal_note='On DAFF permitted import list (Pangio spp.).', legal_in_australia=true WHERE scientific_name='Pangio kuhlii';
UPDATE public.species SET legal_status='permitted', legal_note='Explicitly on DAFF permitted list (Trichogaster chuna). Gouramis subject to GIV testing on import side.', legal_in_australia=true WHERE scientific_name='Trichogaster chuna';
UPDATE public.species SET legal_status='permitted', legal_note='On DAFF permitted import list (Trichopodus spp.).', legal_in_australia=true WHERE scientific_name='Trichopodus leerii';
UPDATE public.species SET legal_status='permitted', legal_note='Explicitly on DAFF permitted list (Trichogaster lalius). Gouramis subject to GIV testing on import side.', legal_in_australia=true WHERE scientific_name='Trichogaster lalius';
UPDATE public.species SET legal_status='permitted', legal_note='On DAFF permitted import list (Danio spp.). Native to South Asia/India.', legal_in_australia=true WHERE scientific_name='Danio rerio';
UPDATE public.species SET legal_status='permitted', legal_note='On DAFF permitted import list (Danio spp.). Native to Myanmar.', legal_in_australia=true WHERE scientific_name='Danio margaritatus';
UPDATE public.species SET legal_status='permitted', legal_note='On DAFF permitted import list (historically listed as Capoeta/Puntius tetrazona). Widely sold in Australia.', legal_in_australia=true WHERE scientific_name='Puntigrus tetrazona';
UPDATE public.species SET legal_status='permitted', legal_note='Permitted and widely sold in Australia. Confirm exact species on the current list (genus has several similar species).', legal_in_australia=true WHERE scientific_name='Crossocheilus siamensis';

-- Native
UPDATE public.species SET legal_status='native', legal_note='Australian native - not an imported species. Legal to keep captive-bred stock; wild collection and keeping may need a state permit. Check your state''s native-fish rules.', legal_in_australia=true WHERE scientific_name='Pseudomugil signifer';
UPDATE public.species SET legal_status='native', legal_note='Australian native - not imported. Legal to keep captive-bred stock; check your state''s native-fish permit rules.', legal_in_australia=true WHERE scientific_name='Hypseleotris compressa';
UPDATE public.species SET legal_status='native', legal_note='Australian native - not imported. Legal to keep captive-bred stock; check your state''s native-fish permit rules.', legal_in_australia=true WHERE scientific_name='Melanotaenia fluviatilis';
UPDATE public.species SET legal_status='native', legal_note='Australian native (arid-zone endemic) - not imported. Legal to keep captive-bred stock; check your state''s rules.', legal_in_australia=true WHERE scientific_name='Chlamydogobius eremius';
UPDATE public.species SET legal_status='native', legal_note='Australian native - not imported. Southern populations are conservation-sensitive; keep captive-bred stock and check your state''s rules.', legal_in_australia=true WHERE scientific_name='Mogurnda adspersa';
UPDATE public.species SET legal_status='native', legal_note='Australian native - not imported. Legal to keep captive-bred stock; check your state''s rules.', legal_in_australia=true WHERE scientific_name='Melanotaenia duboulayi';
UPDATE public.species SET legal_status='native', legal_note='Australian native (also New Guinea) - not imported. Legal to keep; check your state''s rules.', legal_in_australia=true WHERE scientific_name='Iriatherina werneri';
UPDATE public.species SET legal_status='native', legal_note='Australian native - not imported. Legal to keep captive-bred stock; check your state''s rules.', legal_in_australia=true WHERE scientific_name='Craterocephalus stercusmuscarum';

-- Prohibited
UPDATE public.species SET legal_status='prohibited', legal_note='Prohibited. Piranhas are a national noxious species - illegal to import or keep anywhere in Australia.', legal_in_australia=false WHERE scientific_name='Pygocentrus nattereri';
UPDATE public.species SET legal_status='prohibited', legal_note='Prohibited. All Channa (snakeheads) are a national noxious species - illegal to import or keep.', legal_in_australia=false WHERE scientific_name='Channa micropeltes';
UPDATE public.species SET legal_status='prohibited', legal_note='Prohibited. Gars are a national noxious species - illegal to import or keep. (Also mis-tagged: gar is North American not Amazonian.)', legal_in_australia=false WHERE scientific_name='Atractosteus spatula';
UPDATE public.species SET legal_status='prohibited', legal_note='Prohibited. Clarias (walking catfish) is a national noxious species - illegal to import or keep.', legal_in_australia=false WHERE scientific_name='Clarias batrachus';
