(() => {
	const sessionKey = 'atu-attendance-demo-session';
	const attendanceKey = 'atu-attendance-demo-present-students';
	const interactionStatus = document.querySelector('#interaction-status');

	let session;
	try {
		session = JSON.parse(sessionStorage.getItem(sessionKey));
	} catch {
		session = null;
	}

	if (!session?.email) {
		window.location.replace('login.html');
		return;
	}

	const firstName = session.name?.trim().split(/\s+/)[0] || 'there';
	document.querySelector('#welcome-title').textContent = `Welcome back, ${firstName}`;
	document.querySelector('#user-name').textContent = session.name || session.email;
	document.querySelector('#today-date').textContent = new Intl.DateTimeFormat(undefined, {
		weekday: 'long',
		month: 'long',
		day: 'numeric'
	}).format(new Date());

	document.querySelector('#sign-out').addEventListener('click', () => {
		sessionStorage.removeItem(sessionKey);
		window.location.replace('login.html');
	});

	const navToggle = document.querySelector('#nav-toggle');
	const dashboardLinks = document.querySelector('#dashboard-links');
	navToggle.addEventListener('click', () => {
		const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
		navToggle.setAttribute('aria-expanded', String(!isExpanded));
		navToggle.setAttribute('aria-label', isExpanded ? 'Open navigation' : 'Close navigation');
		dashboardLinks.classList.toggle('is-open', !isExpanded);
	});

	const presentCountElement = document.querySelector('#present-count');
	const attendanceRateElement = document.querySelector('#attendance-rate');
	const totalStudents = Number(presentCountElement.dataset.total);
	let presentCount = Number(presentCountElement.textContent);
	let updatedStudents = [];

	try {
		updatedStudents = JSON.parse(sessionStorage.getItem(attendanceKey) || '[]');
	} catch {
		updatedStudents = [];
	}

	function markStudentPresent(row) {
		const statusLabel = row.querySelector('td:nth-child(3) .status');
		const actionButton = row.querySelector('[data-mark-present]');
		statusLabel.className = 'status status-recorded';
		statusLabel.textContent = 'Present';
		if (actionButton) {
			actionButton.textContent = 'Marked present';
			actionButton.disabled = true;
		}
		row.dataset.attendanceUpdated = 'true';
	}

	function updateSummary() {
		presentCountElement.textContent = String(presentCount);
		attendanceRateElement.textContent = `${Math.round((presentCount / totalStudents) * 100)}%`;
	}

	const studentRows = [...document.querySelectorAll('#student-rows tr')];
	for (const row of studentRows) {
		if (updatedStudents.includes(row.dataset.student)) {
			markStudentPresent(row);
			presentCount += 1;
		}

		row.querySelector('[data-mark-present]').addEventListener('click', () => {
			if (row.dataset.attendanceUpdated === 'true') return;

			markStudentPresent(row);
			updatedStudents.push(row.dataset.student);
			sessionStorage.setItem(attendanceKey, JSON.stringify(updatedStudents));
			presentCount += 1;
			updateSummary();
			interactionStatus.textContent = `${row.dataset.student} marked present. Demo data updated.`;
			window.setTimeout(() => {
				interactionStatus.textContent = '';
			}, 2800);
		});
	}

	updateSummary();
})();
