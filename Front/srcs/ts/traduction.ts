	export const translations = {
		en: {
			register: "Register",
			login: "Login",
			logout: "Logout",
			profile: "Profile",
			match_history: "Match History",
			language: "Language",

			how_many_players: "How many player(s):",
			play: "PLAY",
			ready: "READY",

			username: "Username",
			password: "Password",
			new_Password: "New password",
			email: "Email",
			confirm_password: "Confirm password",
			submit: "Submit",

			error_404_title: "Page not found",
			error_404_text: "The page you are looking for does not exist.",

			edit_profile: "Edit profile",
			stats: "Statistics",
			victories: "Victories",
			defeats: "Defeats",

			two_factor_authentication: "Two-Factor Authentication",
			enable_2fa: "Enable 2FA",
			disable_2fa: "Disable 2FA",
			enter_2fa: "Enter your authentication code",
			verify: "Verify",

			friends: "Friends",
			add_friend: "Add friend",
			your_friends: "Your friends",
			pending_friends: "Pending friends",
			remove_friend: "Remove friend",

			save_changes: "Save changes",

			english: "English",
			french: "French",
			spanish: "Spanish",

			tournament: "Tournament",
			quick_match: "Quick Match",

			enter_player_name: "Enter player name",
		},

		fr: {
			register: "S'inscrire",
			login: "Connexion",
			logout: "Déconnexion",
			profile: "Profil",
			match_history: "Historique",
			language: "Langue",

			how_many_players: "Combien de joueur(s) :",
			play: "JOUER",
			ready: "PRÊT",

			username: "Nom d'utilisateur",
			password: "Mot de passe",
			new_Password: "Nouveau mot de passe",
			email: "Email",
			confirm_password: "Confirmer le mot de passe",
			submit: "Valider",

			error_404_title: "Page introuvable",
			error_404_text: "La page que vous recherchez n'existe pas.",

			edit_profile: "Modifier le profil",
			stats: "Statistiques",
			victories: "Victoires",
			defeats: "Défaites",

			two_factor_authentication: "Authentification à deux facteurs",
			enable_2fa: "Activer la 2FA",
			disable_2fa: "Désactiver la 2FA",
			enter_2fa: "Entrez votre code d'authentification",
			verify: "Vérifier",

			friends: "Amis",
			add_friend: "Ajouter un ami",
			your_friends: "Vos amis",
			pending_friends: "Amis en attente",
			remove_friend: "Retirer un ami",

			save_changes: "Enregistrer les modifications",

			english: "Anglais",
			french: "Français",
			spanish: "Espagnol",

			tournament: "Tournoi",
			quick_match: "Partie rapide",

			enter_player_name: "Entrez le nom du joueur",
		},

		es: {
			register: "Registrar",
			login: "Iniciar sesión",
			logout: "Cerrar sesión",
			profile: "Perfil",
			match_history: "Historial",
			language: "Idioma",

			how_many_players: "¿Cuántos jugadores?",
			play: "JUGAR",
			ready: "LISTO",

			username: "Usuario",
			password: "Contraseña",
			new_Password: "Nueva contraseña",
			email: "Correo",
			confirm_password: "Confirmar contraseña",
			submit: "Enviar",

			error_404_title: "Página no encontrada",
			error_404_text: "La página que buscas no existe.",

			edit_profile: "Editar perfil",
			stats: "Estadísticas",
			victories: "Victorias",
			defeats: "Derrotas",

			two_factor_authentication: "Autenticación de dos factores",
			enable_2fa: "Activar 2FA",
			disable_2fa: "Desactivar 2FA",
			enter_2fa: "Introduce tu código",
			verify: "Verificar",

			friends: "Amigos",
			add_friend: "Añadir amigo",
			your_friends: "Tus amigos",
			pending_friends: "Amigos pendientes",
			remove_friend: "Eliminar amigo",

			save_changes: "Guardar cambios",
			
			english: "Inglés",
			french: "Francés",
			spanish: "Español",

			tournament: "Torneo",
			quick_match: "Partida rápida",

			enter_player_name: "Ingrese el nombre del jugador",

		}
	} as const;

	export type Language = keyof typeof translations;
	export type TranslationKey = keyof typeof translations["en"];