import { validateTextInput, validatePassword, sanitizeInput, validateEmail } from "./utils/inputValidFront.js";

const page = document.getElementById("page")!;
const register_form = document.getElementById("register-form")! as HTMLFormElement | null;
const login_form = document.getElementById("login-form")! as HTMLFormElement | null;
const register_button = document.getElementById("register-button")!;
const login_button = document.getElementById("login-button")!;

register_button.addEventListener("click", () => {
	if (login_form && !login_form.classList.contains("hidden")) {
		login_form.classList.add("hidden");
	}
	if (register_form && register_form.classList.contains("hidden")) {
		register_form.classList.remove("hidden");
	}
	else if (register_form) {
		register_form.classList.add("hidden");
	}
});

login_button.addEventListener("click", () => {
	if (register_form && !register_form.classList.contains("hidden")) {
		register_form.classList.add("hidden");
	}
	if (login_form && login_form.classList.contains("hidden")) {
		login_form.classList.remove("hidden");
	}
	else if (login_form) {
		login_form.classList.add("hidden");
	}
});


/*- On regarde si on arrive a recuperer le formulaire
- On ecoute si le formulaire est submit, si oui on preventDefault pour pas qu'il ne reload la page.
- On recupere les inputs de l'utilisateur qu'il a rentre dans le formulaire.
- On verifie si les inputs ne sont pas vides
- On verifie si les inputs sont valides (email avec '@' '.', mdp avec 8 char, une maj, un chiffre, username non vide et pas trop long)
- On sanitize les inputs (pour eviter les attaques XSS)
- On cree un objet avec les inputs a envoyer au backend
- On envoie l'objet au backend via fetch a la route /register en POST
- On gere les erreurs ou le succes en mettant un message et on reset le formulaire

  Bisous, Mathis
*/
if (!register_form) {
	console.warn("Register form not found");
}
else {
	register_form.addEventListener("submit", async (e) => {
		e.preventDefault();

		const inUsername = document.getElementById("username") as HTMLInputElement | null;
		const inEmail = document.getElementById("email") as HTMLInputElement | null;
		const inPassword = document.getElementById("password") as HTMLInputElement | null;

		if (!inUsername || !inEmail || !inPassword) {
			console.error("Missing elements in the form");
			return;
		}

		const username = inUsername.value;
		const email = inEmail.value;
		const password = inPassword.value;

		const errors: string[] = [];
		if (!validateEmail(email))
			errors.push("Invalid email");
		if (!validatePassword(password))
			errors.push("Password must have 8 characters, one uppercase letter and one number");
		if (!validateTextInput(username, 20))
			errors.push("Invalid username");

		if (errors.length > 0) {
			alert("Errors:\n" + errors.join("\n"));
			return;
		}

		const safeUsername = sanitizeInput(username);
		const safeEmail = sanitizeInput(email);

		const sendBack = {
			username: safeUsername,
			email: safeEmail,
			password: password
		};

		const submit = register_form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
		if (submit) {
			submit.disabled = true;
			const originalTxt = submit.textContent;
			submit.textContent = "Registering...";
			try {
				// ------------------------------------- A CHANGER ICI LE PATH TO REGISTER SI BESOIN------------------------------------------------------
				const res = await fetch("http://localhost:3000/register", {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify(sendBack),
				});
				if (res.ok) {
					alert("Registration successful! You can now log in.");
					register_form.reset();
				}
				else {
					const err = await res.json().catch(() => null);
					alert("Server error: " + (err?.message || res.statusText));
				}
			}
			catch (err) {
				console.error("Fetch error:", err);
				alert("Network error. Try again later.");
			}
			finally {
				if (submit) {
					submit.disabled = false;
					submit.textContent = originalTxt ?? "Register";
				}
			}
		}
	});

	/* Vraiment pareil que le cote register
	On ecoute le submit du formulaire de login, on valide les inputs, on sanitize le tout, on envoie au backend sur la bonne route
	et on gere les erreurs ou le succes
	 - Toujours bisous, Mathis
	*/
	if (!login_form)
		console.warn("Login form not found");
	else {
		login_form.addEventListener("submit", async (e) => {
			e.preventDefault();
			const inLogin = document.getElementById("login-id") as HTMLInputElement | null;
			const inPassword = document.getElementById("login-password") as HTMLInputElement | null;

			if (!inLogin || !inPassword) {
				console.error("Missing elements to login");
				return;
			}

			const loginId = inLogin.value;
			const loginPass = inPassword.value;

			const err: string[] = [];
			if (!(validateEmail(loginId) || validateTextInput(loginId, 50)))
				err.push("Invalid username or email");
			if (!validatePassword(loginPass))
				err.push("Invalid password");

			if (err.length > 0) {
				alert("Errors:\n" + err.join("\n"));
				return;
			}

			const safeLoginId = sanitizeInput(loginId);

			const sendBack = {
				identifier: safeLoginId,
				password: loginPass
			};
			const submit = login_form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
			if (submit) {
				submit.disabled = true;
				const originalTxt = submit.textContent;
				submit.textContent = "Logging in...";
				try {
					const res = await fetch("http://localhost:3000/login", {
						method: "POST",
						headers: {
							"Content-Type": "application/json"
						},
						body: JSON.stringify(sendBack),
					});
					if (res.ok) {
						alert("Login successful, have fun!");
						login_form.reset();
					}
					else {
						const err = await res.json().catch(() => null);
						alert("Server error: " + (err?.message || res.statusText));
					}
				}
				catch (err) {
					console.error("Fetch error:", err);
					alert("Network error. Try again later.");
				}
				finally {
					if (submit) {
						submit.disabled = false;
						submit.textContent = originalTxt ?? "Login";
					}
				}
			}
		});
	}
}
