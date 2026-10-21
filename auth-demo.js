(() => {
	const accountsKey = 'atu-attendance-demo-accounts';
	const sessionKey = 'atu-attendance-demo-session';
	const status = document.querySelector('#form-status');

	if (!status) return;

	status.textContent = 'Demo mode: accounts are saved only in this browser.';

	function readAccounts() {
		const savedAccounts = localStorage.getItem(accountsKey);
		return savedAccounts ? JSON.parse(savedAccounts) : [];
	}

	function toHex(buffer) {
		return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');
	}

	async function hashPassword(password, salt) {
		if (!window.isSecureContext || !window.crypto?.subtle) {
			throw new Error('Use localhost or HTTPS to enable demo authentication.');
		}

		const key = await window.crypto.subtle.importKey(
			'raw',
			new TextEncoder().encode(password),
			'PBKDF2',
			false,
			['deriveBits']
		);
		const result = await window.crypto.subtle.deriveBits(
			{ name: 'PBKDF2', salt, iterations: 210000, hash: 'SHA-256' },
			key,
			256
		);

		return toHex(result);
	}

	const signupForm = document.querySelector('#signup-form');

	if (signupForm) {
		const password = signupForm.elements.password;
		const confirmPassword = signupForm.elements.confirmPassword;
		const submitButton = signupForm.querySelector('[type="submit"]');

		function validatePasswordMatch() {
			const mismatch = confirmPassword.value && password.value !== confirmPassword.value;
			confirmPassword.setCustomValidity(mismatch ? 'Passwords do not match.' : '');
		}

		password.addEventListener('input', validatePasswordMatch);
		confirmPassword.addEventListener('input', validatePasswordMatch);

		signupForm.addEventListener('submit', async (event) => {
			event.preventDefault();
			validatePasswordMatch();
			if (!signupForm.reportValidity()) return;

			submitButton.disabled = true;
			status.textContent = 'Creating your local demo account...';

			try {
				const accounts = readAccounts();
				const email = signupForm.elements.email.value.trim().toLowerCase();
				if (accounts.some((account) => account.email === email)) {
					status.textContent = 'An account with that email already exists in this browser. Try signing in.';
					return;
				}

				const salt = window.crypto.getRandomValues(new Uint8Array(16));
				const account = {
					name: signupForm.elements.fullName.value.trim(),
					email,
					salt: Array.from(salt),
					passwordHash: await hashPassword(password.value, salt)
				};

				accounts.push(account);
				localStorage.setItem(accountsKey, JSON.stringify(accounts));
				signupForm.reset();
				status.textContent = 'Account created in this browser. You can now sign in. Demo mode only.';
			} catch (error) {
				status.textContent = error.message || 'Could not save the local demo account in this browser.';
			} finally {
				submitButton.disabled = false;
			}
		});
	}

	const loginForm = document.querySelector('#login-form');

	if (loginForm) {
		const submitButton = loginForm.querySelector('[type="submit"]');

		loginForm.addEventListener('submit', async (event) => {
			event.preventDefault();
			if (!loginForm.reportValidity()) return;

			submitButton.disabled = true;
			status.textContent = 'Checking your local demo account...';

			try {
				const email = loginForm.elements.email.value.trim().toLowerCase();
				const account = readAccounts().find((savedAccount) => savedAccount.email === email);
				if (!account) {
					status.textContent = 'No local demo account found for that email. Create an account first.';
					return;
				}

				const submittedHash = await hashPassword(loginForm.elements.password.value, new Uint8Array(account.salt));
				if (submittedHash !== account.passwordHash) {
					status.textContent = 'Email or password is incorrect.';
					return;
				}

				sessionStorage.setItem(sessionKey, JSON.stringify({ email: account.email, name: account.name }));
				status.textContent = `Signed in locally as ${account.name}. Demo mode only.`;
			} catch (error) {
				status.textContent = error.message || 'Could not check the local demo account.';
			} finally {
				submitButton.disabled = false;
			}
		});
	}
})();
