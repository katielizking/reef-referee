update public.species set is_schooling=true,min_group_size=6,min_tank_litres=60,
  conspecific_strategy='shoal',
  conspecific_notes='Social but territorial. FishTankr follows a group-care approach: plan 6 or more with dense planting, broken sightlines and adequate footprint. Groups do not eliminate aggression. Sources differ on solitary care; seek experienced help before introducing fish to an established solitary puffer.',
  conspecific_sex_ratio_note='Where sexable, aim for at least two females per male. Monitor every fish for feeding and persistent bullying.',
  care_source_label='Pufferfish Enthusiasts Worldwide (group-care approach; compare Aquarium Co-Op)',
  care_source_url='https://www.pufferfishenthusiastsworldwide.com/post/c-travancoricus',
  care_reviewed_on='2026-09-20',care_confidence='medium'
where scientific_name='Carinotetraodon travancoricus';
