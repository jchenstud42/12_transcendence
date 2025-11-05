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
				// ------------------------------------- A CHANGER ICI LE PATH TO REGISTER ------------------------------------------------------
				const res = await fetch("??/register", {
					// ------------------------------------------------------------------------------------------------------------------------------
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


	})
}
