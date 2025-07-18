import { StoryTemplate, StoryScene, StoryChoice } from '$shared/schemas';

/**
 * Story template definitions with branching narratives
 */

// Fantasy Adventure Story
const fantasyAdventureStory: StoryTemplate = {
	id: 'fantasy-adventure',
	title: 'The Enchanted Forest',
	description:
		'A magical adventure through an enchanted forest filled with mystical creatures and ancient secrets.',
	genre: 'fantasy',
	difficulty: 'easy',
	estimatedTime: 30,
	startingScene: 'forest-entrance',
	initialStats: { health: 100, coins: 10, magic: 5 },
	initialInventory: ['torch', 'map'],
	scenes: [
		{
			id: 'forest-entrance',
			title: 'The Forest Entrance',
			description:
				'You stand at the edge of an ancient forest. The trees tower above you, their branches creating a canopy that filters the sunlight into dancing patterns on the forest floor. A worn path leads deeper into the woods.',
			choices: [
				{
					id: 'take-path',
					text: 'Follow the worn path deeper into the forest',
					nextScene: 'forest-path',
					requirements: {},
					effects: {},
					addItems: [],
					removeItems: []
				},
				{
					id: 'explore-left',
					text: 'Venture off the path to explore the thick undergrowth',
					nextScene: 'hidden-grove',
					requirements: {},
					effects: { health: -5 },
					addItems: [],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'forest-path',
			title: 'The Forest Path',
			description:
				'The path winds through the forest, leading you past ancient oaks and mystical flowers that seem to glow with their own inner light. You hear the sound of running water nearby.',
			choices: [
				{
					id: 'investigate-stream',
					text: 'Follow the sound of water to find a stream',
					nextScene: 'magic-stream',
					requirements: {},
					effects: {},
					addItems: [],
					removeItems: []
				},
				{
					id: 'continue-path',
					text: 'Continue along the main path',
					nextScene: 'forest-clearing',
					requirements: {},
					effects: {},
					addItems: [],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'hidden-grove',
			title: 'The Hidden Grove',
			description:
				'You push through the undergrowth and discover a hidden grove where sunlight streams through the canopy. In the center stands an ancient stone altar covered in mysterious runes.',
			choices: [
				{
					id: 'examine-altar',
					text: 'Examine the ancient altar',
					nextScene: 'magic-altar',
					requirements: {},
					effects: {},
					addItems: [],
					removeItems: []
				},
				{
					id: 'return-path',
					text: 'Return to the main path',
					nextScene: 'forest-path',
					requirements: {},
					effects: {},
					addItems: [],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'magic-stream',
			title: 'The Magic Stream',
			description:
				'You discover a crystal-clear stream that seems to sparkle with magical energy. The water is cool and refreshing, and you notice strange symbols carved into the rocks nearby.',
			choices: [
				{
					id: 'drink-water',
					text: 'Drink from the magical stream',
					nextScene: 'enhanced-power',
					requirements: {},
					effects: { health: 20, magic: 10 },
					addItems: ['crystal-vial'],
					removeItems: []
				},
				{
					id: 'follow-stream',
					text: 'Follow the stream to its source',
					nextScene: 'ancient-spring',
					requirements: {},
					effects: {},
					addItems: [],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'forest-clearing',
			title: 'The Forest Clearing',
			description:
				'You emerge into a large clearing where the forest opens up to reveal a magnificent view of distant mountains. In the center of the clearing stands a wise old wizard.',
			choices: [
				{
					id: 'approach-wizard',
					text: 'Approach the wizard and speak with him',
					nextScene: 'wizard-encounter',
					requirements: {},
					effects: {},
					addItems: [],
					removeItems: []
				},
				{
					id: 'avoid-wizard',
					text: 'Quietly circle around the wizard',
					nextScene: 'mountain-path',
					requirements: {},
					effects: {},
					addItems: [],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'magic-altar',
			title: 'The Ancient Altar',
			description:
				'As you approach the altar, the runes begin to glow with a soft blue light. You feel a surge of magical energy and realize this is a place of great power.',
			choices: [
				{
					id: 'touch-altar',
					text: 'Place your hand on the altar',
					nextScene: 'magic-blessing',
					requirements: { magic: 5 },
					effects: { magic: 15 },
					addItems: ['magic-amulet'],
					removeItems: []
				},
				{
					id: 'leave-altar',
					text: 'Leave the altar undisturbed',
					nextScene: 'forest-clearing',
					requirements: {},
					effects: {},
					addItems: [],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'enhanced-power',
			title: 'Enhanced by Magic',
			description:
				'The magical water fills you with renewed strength and enhanced magical abilities. You feel ready to face whatever challenges await in the deeper forest.',
			choices: [
				{
					id: 'continue-adventure',
					text: 'Continue deeper into the forest',
					nextScene: 'dragon-encounter',
					requirements: {},
					effects: {},
					addItems: [],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'wizard-encounter',
			title: 'The Wise Wizard',
			description:
				'The wizard greets you with a warm smile. "I have been expecting you," he says. "The forest has told me of your arrival. I can offer you wisdom or power, but choose wisely."',
			choices: [
				{
					id: 'ask-wisdom',
					text: 'Ask the wizard for wisdom',
					nextScene: 'wisdom-ending',
					requirements: {},
					effects: {},
					addItems: ['scroll-of-wisdom'],
					removeItems: []
				},
				{
					id: 'ask-power',
					text: 'Ask the wizard for power',
					nextScene: 'power-ending',
					requirements: {},
					effects: { magic: 25 },
					addItems: ['staff-of-power'],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'dragon-encounter',
			title: 'The Ancient Dragon',
			description:
				'Deep in the forest, you encounter a magnificent ancient dragon. Its scales shimmer with otherworldly light, and its eyes hold the wisdom of ages.',
			choices: [
				{
					id: 'peaceful-approach',
					text: 'Approach the dragon peacefully',
					nextScene: 'dragon-alliance',
					requirements: { magic: 15 },
					effects: {},
					addItems: ['dragon-scale'],
					removeItems: []
				},
				{
					id: 'retreat-slowly',
					text: 'Retreat slowly and respectfully',
					nextScene: 'safe-escape',
					requirements: {},
					effects: {},
					addItems: [],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'wisdom-ending',
			title: 'The Path of Wisdom',
			description:
				'The wizard grants you the gift of wisdom. You return home with knowledge that will guide you for the rest of your life, understanding the secrets of the forest and the balance of nature.',
			choices: [],
			isEnding: true,
			requirements: {}
		},
		{
			id: 'power-ending',
			title: 'The Path of Power',
			description:
				'The wizard grants you magical power beyond your wildest dreams. You return home as a mighty sorcerer, capable of great feats of magic but forever changed by the experience.',
			choices: [],
			isEnding: true,
			requirements: {}
		},
		{
			id: 'dragon-alliance',
			title: 'Alliance with the Dragon',
			description:
				'The dragon recognizes your pure heart and magical potential. You form an eternal bond with the ancient creature, becoming a dragon rider and protector of the forest.',
			choices: [],
			isEnding: true,
			requirements: {}
		},
		{
			id: 'safe-escape',
			title: 'The Wise Retreat',
			description:
				'You safely retreat from the dragon encounter, having learned that sometimes wisdom lies in knowing when not to act. You return home with valuable experience and a new respect for the mysteries of the forest.',
			choices: [],
			isEnding: true,
			requirements: {}
		}
	]
};

// Sci-Fi Adventure Story
const sciFiStationStory: StoryTemplate = {
	id: 'sci-fi-station',
	title: 'Space Station Alpha',
	description:
		'A thrilling sci-fi adventure aboard a space station where things are not as they seem.',
	genre: 'sci-fi',
	difficulty: 'medium',
	estimatedTime: 45,
	startingScene: 'station-docking',
	initialStats: { health: 100, energy: 50, tech: 10 },
	initialInventory: ['scanner', 'key-card'],
	scenes: [
		{
			id: 'station-docking',
			title: 'Docking Bay Alpha',
			description:
				'Your shuttle docks with Space Station Alpha. The station appears to be running on emergency power, with red lights flashing throughout the corridors. The air feels heavy with tension.',
			choices: [
				{
					id: 'head-bridge',
					text: 'Head directly to the bridge',
					nextScene: 'empty-bridge',
					requirements: {},
					effects: {},
					addItems: [],
					removeItems: []
				},
				{
					id: 'check-systems',
					text: 'Check the station systems first',
					nextScene: 'system-diagnostics',
					requirements: { tech: 5 },
					effects: {},
					addItems: [],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'empty-bridge',
			title: 'The Empty Bridge',
			description:
				"The bridge is eerily quiet and empty. Consoles flicker with warning messages, and you notice signs of a struggle. The captain's chair is overturned.",
			choices: [
				{
					id: 'access-logs',
					text: "Access the captain's logs",
					nextScene: 'dark-revelation',
					requirements: { tech: 10 },
					effects: {},
					addItems: ['captain-logs'],
					removeItems: []
				},
				{
					id: 'investigate-crew',
					text: 'Search for the missing crew',
					nextScene: 'crew-quarters',
					requirements: {},
					effects: {},
					addItems: [],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'system-diagnostics',
			title: 'System Diagnostics',
			description:
				"Your technical skills reveal that the station's life support is failing and there are signs of an alien presence. The situation is more dire than initially thought.",
			choices: [
				{
					id: 'repair-systems',
					text: 'Attempt to repair the life support',
					nextScene: 'system-repair',
					requirements: { tech: 15 },
					effects: { energy: -20 },
					addItems: [],
					removeItems: []
				},
				{
					id: 'find-survivors',
					text: 'Look for survivors first',
					nextScene: 'survivor-encounter',
					requirements: {},
					effects: {},
					addItems: [],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'dark-revelation',
			title: 'The Dark Truth',
			description:
				"The captain's logs reveal that the station was conducting illegal experiments on alien life forms. One of the creatures has escaped and is hunting the crew.",
			choices: [
				{
					id: 'hunt-creature',
					text: 'Hunt down the alien creature',
					nextScene: 'alien-confrontation',
					requirements: { energy: 30 },
					effects: {},
					addItems: ['plasma-rifle'],
					removeItems: []
				},
				{
					id: 'evacuate-station',
					text: 'Evacuate the station immediately',
					nextScene: 'evacuation-ending',
					requirements: {},
					effects: {},
					addItems: [],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'alien-confrontation',
			title: 'Face to Face',
			description:
				"You confront the alien creature in the station's main laboratory. It's more intelligent than expected and seems to be trying to communicate.",
			choices: [
				{
					id: 'communicate',
					text: 'Try to communicate with the creature',
					nextScene: 'peaceful-resolution',
					requirements: { tech: 20 },
					effects: {},
					addItems: [],
					removeItems: []
				},
				{
					id: 'fight-creature',
					text: 'Fight the creature',
					nextScene: 'battle-ending',
					requirements: { energy: 40 },
					effects: { health: -30 },
					addItems: [],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'peaceful-resolution',
			title: 'Understanding',
			description:
				'You successfully communicate with the alien and learn it was only defending itself. Together, you work to expose the illegal experiments and ensure this never happens again.',
			choices: [],
			isEnding: true,
			requirements: {}
		},
		{
			id: 'battle-ending',
			title: 'The Final Battle',
			description:
				'After a fierce battle, you defeat the creature but at great cost. The station is severely damaged, and you barely escape with your life.',
			choices: [],
			isEnding: true,
			requirements: {}
		},
		{
			id: 'evacuation-ending',
			title: 'Strategic Retreat',
			description:
				'You wisely choose to evacuate the station and report the situation to the authorities. The station is later quarantined and the experiments are shut down.',
			choices: [],
			isEnding: true,
			requirements: {}
		}
	]
};

// Horror Mystery Story
const horrorMansionStory: StoryTemplate = {
	id: 'horror-mansion',
	title: 'The Haunted Mansion',
	description: 'A spine-chilling horror mystery in an abandoned mansion with dark secrets.',
	genre: 'horror',
	difficulty: 'hard',
	estimatedTime: 60,
	startingScene: 'mansion-entrance',
	initialStats: { health: 100, sanity: 80, courage: 15 },
	initialInventory: ['flashlight', 'old-key'],
	scenes: [
		{
			id: 'mansion-entrance',
			title: 'The Mansion Gates',
			description:
				'You stand before the imposing gates of Blackwood Manor. The Victorian mansion looms in the darkness, its windows like dead eyes staring down at you. Lightning flashes, illuminating the twisted iron gates.',
			choices: [
				{
					id: 'enter-front',
					text: 'Enter through the front door',
					nextScene: 'grand-foyer',
					requirements: {},
					effects: { sanity: -5 },
					addItems: [],
					removeItems: []
				},
				{
					id: 'find-side-entrance',
					text: 'Look for a side entrance',
					nextScene: 'servant-entrance',
					requirements: {},
					effects: {},
					addItems: [],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'servant-entrance',
			title: "The Servant's Entrance",
			description:
				"You find a small door hidden behind overgrown ivy. The servant's entrance creaks open, revealing a narrow hallway that leads into the mansion's depths. The air is stale and carries the scent of decay.",
			choices: [
				{
					id: 'enter-kitchen',
					text: 'Enter through the old kitchen',
					nextScene: 'grand-foyer',
					requirements: {},
					effects: { courage: 5 },
					addItems: [],
					removeItems: []
				},
				{
					id: 'explore-basement',
					text: 'Investigate the basement stairs',
					nextScene: 'basement-discovery',
					requirements: { courage: 10 },
					effects: { sanity: -5 },
					addItems: [],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'basement-discovery',
			title: 'The Hidden Basement',
			description:
				'The basement reveals old servant quarters and storage rooms. In the corner, you discover a hidden passage behind a bookshelf. Strange symbols are carved into the stone walls.',
			choices: [
				{
					id: 'enter-passage',
					text: 'Enter the hidden passage',
					nextScene: 'secret-chamber',
					requirements: { courage: 15 },
					effects: { sanity: -10 },
					addItems: ['mysterious-key'],
					removeItems: []
				},
				{
					id: 'return-upstairs',
					text: 'Return upstairs to the main house',
					nextScene: 'grand-foyer',
					requirements: {},
					effects: {},
					addItems: [],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'secret-chamber',
			title: 'The Secret Chamber',
			description:
				"You discover a hidden chamber filled with occult artifacts and ancient books. This appears to be where the mansion's dark rituals took place. A pentagram is carved into the floor.",
			choices: [
				{
					id: 'study-artifacts',
					text: 'Study the occult artifacts',
					nextScene: 'curse-breaking',
					requirements: { sanity: 40 },
					effects: { sanity: -15 },
					addItems: ['ritual-dagger'],
					removeItems: []
				},
				{
					id: 'flee-chamber',
					text: 'Flee from this evil place',
					nextScene: 'escape-attempt',
					requirements: {},
					effects: { courage: -10 },
					addItems: [],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'grand-foyer',
			title: 'The Grand Foyer',
			description:
				'The foyer is draped in dust and cobwebs. A grand staircase spirals upward into darkness. You hear the sound of footsteps above, though you know the mansion is supposed to be empty.',
			choices: [
				{
					id: 'investigate-upstairs',
					text: 'Investigate the footsteps upstairs',
					nextScene: 'upstairs-corridor',
					requirements: { courage: 10 },
					effects: { sanity: -10 },
					addItems: [],
					removeItems: []
				},
				{
					id: 'explore-ground-floor',
					text: 'Explore the ground floor first',
					nextScene: 'dining-room',
					requirements: {},
					effects: {},
					addItems: [],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'dining-room',
			title: 'The Dining Room',
			description:
				'The dining room table is set for a dinner that was never served. Candles have melted into twisted shapes, and the chandelier sways gently despite the absence of any breeze. A portrait above the fireplace seems to follow your movements.',
			choices: [
				{
					id: 'examine-portrait',
					text: 'Examine the portrait more closely',
					nextScene: 'hidden-passage',
					requirements: {},
					effects: { sanity: -5 },
					addItems: ['family-photo'],
					removeItems: []
				},
				{
					id: 'check-kitchen',
					text: 'Check the kitchen for clues',
					nextScene: 'kitchen-discovery',
					requirements: {},
					effects: {},
					addItems: [],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'kitchen-discovery',
			title: 'The Abandoned Kitchen',
			description:
				'The kitchen shows signs of a hasty departure. Pots still sit on the stove, and a meal appears half-prepared. You find a diary hidden in a drawer, revealing the dark history of the mansion.',
			choices: [
				{
					id: 'read-diary',
					text: 'Read the diary carefully',
					nextScene: 'upstairs-corridor',
					requirements: {},
					effects: { courage: 10 },
					addItems: ['servants-diary'],
					removeItems: []
				},
				{
					id: 'investigate-cellar',
					text: 'Investigate the cellar door',
					nextScene: 'basement-discovery',
					requirements: { courage: 5 },
					effects: {},
					addItems: [],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'hidden-passage',
			title: 'The Hidden Passage',
			description:
				"Behind the portrait, you discover a hidden passage that leads to the mansion's secret areas. The walls are lined with strange symbols and the air grows colder as you proceed.",
			choices: [
				{
					id: 'follow-passage',
					text: 'Follow the passage to its end',
					nextScene: 'secret-chamber',
					requirements: { courage: 15 },
					effects: { sanity: -10 },
					addItems: [],
					removeItems: []
				},
				{
					id: 'return-dining',
					text: 'Return to the dining room',
					nextScene: 'upstairs-corridor',
					requirements: {},
					effects: {},
					addItems: [],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'childrens-room',
			title: "The Children's Room",
			description:
				'The nursery is filled with old toys and a rocking horse that moves on its own. Childish laughter echoes from nowhere, and you see small handprints on the dusty windows. The innocence of childhood has been twisted into something unsettling.',
			choices: [
				{
					id: 'play-music-box',
					text: 'Wind up the old music box',
					nextScene: 'ghost-children',
					requirements: { sanity: 50 },
					effects: { sanity: -20 },
					addItems: [],
					removeItems: []
				},
				{
					id: 'leave-room',
					text: 'Leave the room immediately',
					nextScene: 'master-bedroom',
					requirements: {},
					effects: { courage: -5 },
					addItems: [],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'ghost-children',
			title: 'The Ghost Children',
			description:
				'The spirits of children who died in the mansion appear before you. They are not malevolent, but trapped and seeking help to find peace. They offer to guide you to break the curse that binds them.',
			choices: [
				{
					id: 'help-children',
					text: 'Agree to help the ghost children',
					nextScene: 'curse-breaking',
					requirements: { sanity: 30 },
					effects: { courage: 15 },
					addItems: ['blessed-toy'],
					removeItems: []
				},
				{
					id: 'ignore-children',
					text: 'Ignore the children and flee',
					nextScene: 'escape-attempt',
					requirements: {},
					effects: { sanity: -15 },
					addItems: [],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'escape-attempt',
			title: 'Desperate Escape',
			description:
				'You run through the mansion, trying to find a way out, but the doors have vanished and the windows are now bricked up. The mansion has trapped you, and you realize the only way out is to face the supernatural forces within.',
			choices: [
				{
					id: 'face-your-fears',
					text: 'Turn around and face the supernatural forces',
					nextScene: 'ghost-encounter',
					requirements: { courage: 25 },
					effects: { sanity: -10, courage: 10 },
					addItems: [],
					removeItems: []
				},
				{
					id: 'break-window',
					text: 'Try to break through a window',
					nextScene: 'trapped-ending',
					requirements: {},
					effects: { health: -20 },
					addItems: [],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'upstairs-corridor',
			title: 'The Upstairs Corridor',
			description:
				'The corridor stretches endlessly in both directions. Portraits on the walls seem to watch you with their painted eyes. You notice one door slightly ajar, revealing a dim light within.',
			choices: [
				{
					id: 'enter-lit-room',
					text: 'Enter the room with the light',
					nextScene: 'master-bedroom',
					requirements: {},
					effects: { sanity: -10 },
					addItems: [],
					removeItems: []
				},
				{
					id: 'check-other-rooms',
					text: 'Check the other rooms first',
					nextScene: 'childrens-room',
					requirements: { courage: 15 },
					effects: {},
					addItems: [],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'master-bedroom',
			title: 'The Master Bedroom',
			description:
				"The master bedroom is frozen in time. A figure sits in a chair by the window, but as you approach, you realize it's just old clothes arranged to look like a person. Or is it?",
			choices: [
				{
					id: 'examine-figure',
					text: 'Examine the figure more closely',
					nextScene: 'ghost-encounter',
					requirements: { courage: 20 },
					effects: { sanity: -15 },
					addItems: [],
					removeItems: []
				},
				{
					id: 'leave-quickly',
					text: 'Leave the room quickly',
					nextScene: 'escape-attempt',
					requirements: {},
					effects: {},
					addItems: [],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'ghost-encounter',
			title: 'The Restless Spirit',
			description:
				"As you touch the figure, it turns to face you. It's the ghost of the mansion's former owner, trapped here by a dark curse. The spirit speaks of a hidden treasure and a way to break the curse.",
			choices: [
				{
					id: 'help-spirit',
					text: 'Agree to help break the curse',
					nextScene: 'curse-breaking',
					requirements: { sanity: 30 },
					effects: {},
					addItems: ['ancient-tome'],
					removeItems: []
				},
				{
					id: 'refuse-help',
					text: 'Refuse and try to leave',
					nextScene: 'trapped-ending',
					requirements: {},
					effects: { sanity: -20 },
					addItems: [],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'curse-breaking',
			title: 'Breaking the Curse',
			description:
				"Following the ghost's instructions, you perform an ancient ritual using items found throughout the mansion. The curse begins to lift, and the spirits find peace.",
			choices: [],
			isEnding: true,
			requirements: {}
		},
		{
			id: 'trapped-ending',
			title: 'Forever Trapped',
			description:
				"By refusing to help, you have sealed your fate. The mansion's curse now binds you as well, and you join the restless spirits that haunt these halls for eternity.",
			choices: [],
			isEnding: true,
			requirements: {}
		}
	]
};

// Mystery Detective Story
const mysteryDetectiveStory: StoryTemplate = {
	id: 'mystery-detective',
	title: 'The Case of the Missing Artifact',
	description: 'A detective mystery where you must solve the case of a stolen ancient artifact.',
	genre: 'mystery',
	difficulty: 'medium',
	estimatedTime: 40,
	startingScene: 'crime-scene',
	initialStats: { health: 100, deduction: 20, evidence: 0 },
	initialInventory: ['magnifying-glass', 'notepad'],
	scenes: [
		{
			id: 'crime-scene',
			title: 'The Crime Scene',
			description:
				'You arrive at the Metropolitan Museum where the priceless Golden Scarab has been stolen. The security guard looks shaken, and you notice several clues scattered around the exhibit.',
			choices: [
				{
					id: 'examine-display',
					text: 'Examine the display case',
					nextScene: 'display-analysis',
					requirements: {},
					effects: { evidence: 1 },
					addItems: ['glass-fragment'],
					removeItems: []
				},
				{
					id: 'interview-guard',
					text: 'Interview the security guard',
					nextScene: 'guard-testimony',
					requirements: { deduction: 15 },
					effects: { evidence: 1 },
					addItems: [],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'display-analysis',
			title: 'Analyzing the Display',
			description:
				'The display case shows signs of professional tampering. You find traces of a sophisticated bypass device used to disable the alarm system.',
			choices: [
				{
					id: 'check-cameras',
					text: 'Check the security cameras',
					nextScene: 'camera-footage',
					requirements: { evidence: 2 },
					effects: { evidence: 1 },
					addItems: [],
					removeItems: []
				},
				{
					id: 'dust-fingerprints',
					text: 'Dust for fingerprints',
					nextScene: 'fingerprint-analysis',
					requirements: {},
					effects: { evidence: 2 },
					addItems: ['fingerprint-card'],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'solution-ending',
			title: 'Case Solved',
			description:
				"Using your deductive skills and the evidence you've gathered, you successfully identify the thief and recover the Golden Scarab. Justice is served!",
			choices: [],
			isEnding: true,
			requirements: {}
		}
	]
};

// Comedy Office Story
const comedyOfficeStory: StoryTemplate = {
	id: 'comedy-office',
	title: 'Office Shenanigans',
	description: 'A lighthearted comedy adventure in a quirky office environment.',
	genre: 'comedy',
	difficulty: 'easy',
	estimatedTime: 25,
	startingScene: 'office-entrance',
	initialStats: { health: 100, humor: 15, productivity: 10 },
	initialInventory: ['coffee-mug', 'sticky-notes'],
	scenes: [
		{
			id: 'office-entrance',
			title: 'Monday Morning',
			description:
				'It\'s Monday morning at Synergy Solutions Inc., and you\'re facing another day in the corporate jungle. The coffee machine is broken, your computer is updating, and your boss is in a "mood."',
			choices: [
				{
					id: 'fix-coffee',
					text: 'Try to fix the coffee machine',
					nextScene: 'coffee-hero',
					requirements: {},
					effects: { humor: 5 },
					addItems: ['hero-status'],
					removeItems: []
				},
				{
					id: 'prank-colleague',
					text: 'Set up a harmless prank',
					nextScene: 'prank-backfire',
					requirements: { humor: 10 },
					effects: { productivity: -5 },
					addItems: [],
					removeItems: []
				}
			],
			isEnding: false,
			requirements: {}
		},
		{
			id: 'coffee-hero',
			title: 'The Coffee Hero',
			description:
				'You successfully fix the coffee machine and become the office hero! Everyone loves you, productivity soars, and you get a promotion.',
			choices: [],
			isEnding: true,
			requirements: {}
		},
		{
			id: 'prank-backfire',
			title: 'Prank Gone Wrong',
			description:
				'Your prank backfires spectacularly, but everyone has a good laugh about it. Sometimes the best moments come from the unexpected failures.',
			choices: [],
			isEnding: true,
			requirements: {}
		}
	]
};

// Story registry
const STORY_TEMPLATES: Record<string, StoryTemplate> = {
	'fantasy-adventure': fantasyAdventureStory,
	'sci-fi-station': sciFiStationStory,
	'horror-mansion': horrorMansionStory,
	'mystery-detective': mysteryDetectiveStory,
	'comedy-office': comedyOfficeStory
};

/**
 * Get a story template by ID
 */
export function getStoryTemplate(storyId: string): StoryTemplate | null {
	return STORY_TEMPLATES[storyId] || null;
}

/**
 * Get all available story templates
 */
export function getAllStoryTemplates(): StoryTemplate[] {
	return Object.values(STORY_TEMPLATES);
}

/**
 * Get a specific scene from a story template
 */
export function getStoryScene(storyTemplate: StoryTemplate, sceneId: string): StoryScene | null {
	return storyTemplate.scenes.find((scene) => scene.id === sceneId) || null;
}

/**
 * Get all scenes from a story template
 */
export function getStoryScenes(storyTemplate: StoryTemplate): StoryScene[] {
	return storyTemplate.scenes;
}

/**
 * Find stories by genre
 */
export function getStoriesByGenre(genre: string): StoryTemplate[] {
	return Object.values(STORY_TEMPLATES).filter((story) => story.genre === genre);
}

/**
 * Find stories by difficulty
 */
export function getStoriesByDifficulty(difficulty: string): StoryTemplate[] {
	return Object.values(STORY_TEMPLATES).filter((story) => story.difficulty === difficulty);
}

/**
 * Get random story template
 */
export function getRandomStoryTemplate(): StoryTemplate {
	const templates = Object.values(STORY_TEMPLATES);
	const randomIndex = Math.floor(Math.random() * templates.length);
	return templates[randomIndex];
}
