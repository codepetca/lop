export interface Question {
	title: string;
	options: string[];
}

export const QUESTION_BANK: Question[] = [
	{
		title: "What's your favorite programming language?",
		options: ['JavaScript', 'Python', 'Rust', 'Go', 'TypeScript', 'Other']
	},
	{
		title: 'Best pizza topping?',
		options: ['Pepperoni', 'Mushrooms', 'Pineapple', 'Olives', 'Extra Cheese', 'Veggie']
	},
	{
		title: 'Preferred development environment?',
		options: ['VS Code', 'Vim/Neovim', 'IntelliJ', 'Sublime Text', 'Emacs', 'Other']
	},
	{
		title: 'Coffee or tea?',
		options: ['Coffee', 'Tea', 'Both', 'Neither', 'Energy drinks']
	},
	{
		title: 'Tabs or spaces?',
		options: ['Tabs', 'Spaces', "Mixed (I'm a monster)", 'Whatever the linter says']
	},
	{
		title: 'Light mode or dark mode?',
		options: ['Dark mode', 'Light mode', 'Auto (follows system)', 'Depends on time of day']
	},
	{
		title: 'Favorite season?',
		options: ['Spring', 'Summer', 'Fall/Autumn', 'Winter']
	},
	{
		title: 'Best superpower?',
		options: [
			'Flying',
			'Invisibility',
			'Time travel',
			'Mind reading',
			'Super strength',
			'Teleportation'
		]
	},
	{
		title: 'Mac, Windows, or Linux?',
		options: ['macOS', 'Windows', 'Linux', 'I use all of them', 'ChromeOS', 'Other']
	},
	{
		title: 'Favorite type of music while coding?',
		options: ['Lo-fi/Chill', 'Classical', 'Electronic/EDM', 'Rock/Metal', 'No music', 'Podcasts']
	},
	{
		title: 'Early bird or night owl?',
		options: [
			'Early bird',
			'Night owl',
			"Neither (I'm tired all the time)",
			'Depends on the project'
		]
	},
	{
		title: 'Preferred version control?',
		options: ['Git', 'SVN', 'Mercurial', 'Perforce', "What's version control?"]
	},
	{
		title: 'Beach or mountains?',
		options: ['Beach', 'Mountains', 'Both', 'City', 'Desert', 'Forest']
	},
	{
		title: 'Favorite sci-fi franchise?',
		options: ['Star Wars', 'Star Trek', 'Doctor Who', 'The Matrix', 'Blade Runner', 'Other']
	},
	{
		title: 'How do you learn best?',
		options: [
			'Reading docs',
			'Video tutorials',
			'Building projects',
			'Pair programming',
			'Courses',
			'Stack Overflow'
		]
	}
];

/**
 * Get a random question from the question bank
 */
export function getRandomQuestion(): Question {
	const randomIndex = Math.floor(Math.random() * QUESTION_BANK.length);
	return QUESTION_BANK[randomIndex];
}
