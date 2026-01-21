// OUI CA FAIT UNE ERREUR ET C RELOU MAIS CA MARCHE QUAND ON BUILD LAISSEZZZZZZZZZ
import type { Config } from 'tailwindcss'
// -----------------------------------------------------------------------------
export default {
	content: [
		"./index.html",
		"./ts/**/*.ts",
		"./js/**/*.js",
	],
	safelist: [
		'bg-blue-500', 'hover:bg-blue-600',
		'bg-red-500', 'hover:bg-red-600',
	],
	corePlugins: {
		preflight: false,
	},
	theme: {
		extend: {
			animation: {
				flicker: 'flicker 5s infinite',
			},
			keyframes: {
				flicker: {
					'0%, 70%, 100%': { opacity: '1' },
					'72%': { opacity: '0.4' },
					'74%': { opacity: '1' },
					'76%': { opacity: '0.2' },
					'78%': { opacity: '1' },
				},
			},
		},
	},
	plugins: [],
} satisfies Config
