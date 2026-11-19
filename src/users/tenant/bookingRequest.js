import { api } from '../../services/api.js';
import { successDialog } from '../../components/modal.js';

export function bookingRequestMarkup() {
	return `<form class="dashboard-request-form">
		<div class="dashboard-request-heading"><h3>Rental Request Details</h3></div>
		<input type="hidden" name="moveInDate" />
		<input type="hidden" name="moveOutDate" />
		<div class="dashboard-request-layout">
			<div class="dashboard-request-date-column">
				<section class="dashboard-date-picker" aria-label="Choose move-in and move-out dates">
					<div class="dashboard-date-picker__header">
						<div>
							<h4>Stay dates</h4>
							<p class="dashboard-date-picker__hint" aria-live="polite">Choose a move-in date</p>
						</div>
						<div class="dashboard-date-picker__navigation">
							<button type="button" class="dashboard-calendar-previous" aria-label="Previous month">&#8249;</button>
							<strong class="dashboard-calendar-month" aria-live="polite"></strong>
							<button type="button" class="dashboard-calendar-next" aria-label="Next month">&#8250;</button>
						</div>
					</div>
					<div class="dashboard-calendar-weekdays" aria-hidden="true">
						<span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
					</div>
					<div class="dashboard-calendar-days" role="group" aria-label="Calendar dates"></div>
					<div class="dashboard-date-picker__summary" aria-live="polite">
						<span>Move-in <strong data-move-in-label>Not selected</strong></span>
						<span>Move-out <strong data-move-out-label>Not selected</strong></span>
					</div>
				</section>
				<label class="dashboard-indefinite-move-out">
					<input type="checkbox" name="isIndefiniteMoveOut" />
					<span><strong>Indefinite / No planned move-out date</strong></span>
				</label>
			</div>
			<section class="dashboard-guest-picker" aria-labelledby="dashboard-guest-heading">
				<div class="dashboard-guest-picker__heading">
					<h4 id="dashboard-guest-heading">Guests</h4>
					<p>Choose everyone who will stay</p>
				</div>
				<input type="hidden" name="occupants" value="1" />
				<div class="dashboard-guest-list">
					<div class="dashboard-guest-row" data-guest-row="adults">
						<span class="dashboard-guest-label"><strong>Adults</strong><small>Age 13+</small></span>
						<div class="dashboard-guest-controls">
							<button type="button" data-guest-action="decrease" aria-label="Remove an adult" disabled>−</button>
							<output data-guest-count="adults" aria-live="polite">1</output>
							<button type="button" data-guest-action="increase" aria-label="Add an adult">+</button>
						</div>
					</div>
					<div class="dashboard-guest-row" data-guest-row="children">
						<span class="dashboard-guest-label"><strong>Children</strong><small>Ages 2–12</small></span>
						<div class="dashboard-guest-controls">
							<button type="button" data-guest-action="decrease" aria-label="Remove a child" disabled>−</button>
							<output data-guest-count="children" aria-live="polite">0</output>
							<button type="button" data-guest-action="increase" aria-label="Add a child">+</button>
						</div>
					</div>
					<div class="dashboard-guest-row" data-guest-row="infants">
						<span class="dashboard-guest-label"><strong>Infants</strong><small>Under 2</small></span>
						<div class="dashboard-guest-controls">
							<button type="button" data-guest-action="decrease" aria-label="Remove an infant" disabled>−</button>
							<output data-guest-count="infants" aria-live="polite">0</output>
							<button type="button" data-guest-action="increase" aria-label="Add an infant">+</button>
						</div>
					</div>
					<div class="dashboard-guest-row" data-guest-row="pets">
						<span class="dashboard-guest-label"><strong>Pets</strong><small>Number of pets</small></span>
						<div class="dashboard-guest-controls">
							<button type="button" data-guest-action="decrease" aria-label="Remove a pet" disabled>−</button>
							<output data-guest-count="pets" aria-live="polite">0</output>
							<button type="button" data-guest-action="increase" aria-label="Add a pet">+</button>
						</div>
					</div>
				</div>
			</section>
		</div>
		<section class="dashboard-request-review" aria-labelledby="dashboard-review-heading" aria-live="polite" hidden>
			<h4 id="dashboard-review-heading">Review your request</h4>
			<p>Check your dates and guest details before sending this request.</p>
			<dl>
				<div><dt>Property</dt><dd data-review-property></dd></div>
				<div><dt>Move-in</dt><dd data-review-move-in></dd></div>
				<div><dt>Move-out</dt><dd data-review-move-out></dd></div>
				<div><dt>Adults</dt><dd data-review-adults></dd></div>
				<div><dt>Children</dt><dd data-review-children></dd></div>
				<div><dt>Infants</dt><dd data-review-infants></dd></div>
				<div><dt>Pets</dt><dd data-review-pets></dd></div>
			</dl>
			<button type="button" class="dashboard-edit-request">Edit request</button>
		</section>
		<div class="dashboard-request-actions">
			<button type="button" class="dashboard-chat-owner">Chat Owner</button>
			<button type="submit" class="dashboard-send-request">Send Request</button>
		</div>
		<p class="dashboard-request-status" role="status"></p>
	</form>`;
}

export function attachBookingRequestForm(modal, property) {
	const form = modal.querySelector('.dashboard-request-form');
	const status = modal.querySelector('.dashboard-request-status');
	const moveIn = form.querySelector('[name="moveInDate"]');
	const moveOut = form.querySelector('[name="moveOutDate"]');
	const indefiniteMoveOut = form.querySelector('[name="isIndefiniteMoveOut"]');
	const calendarDays = form.querySelector('.dashboard-calendar-days');
	const calendarMonth = form.querySelector('.dashboard-calendar-month');
	const calendarHint = form.querySelector('.dashboard-date-picker__hint');
	const moveInLabel = form.querySelector('[data-move-in-label]');
	const moveOutLabel = form.querySelector('[data-move-out-label]');
	const previousMonthButton = form.querySelector('.dashboard-calendar-previous');
	const nextMonthButton = form.querySelector('.dashboard-calendar-next');
	const occupantsInput = form.querySelector('[name="occupants"]');
	const reviewPanel = form.querySelector('.dashboard-request-review');
	const submitButton = form.querySelector('.dashboard-send-request');
	const guestCounts = { adults: 1, children: 0, infants: 0, pets: 0 };
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
	const todayKey = dateKey(today);
	let displayedMonth = new Date(today.getFullYear(), today.getMonth(), 1);
	const formatCalendarDate = (dateValue) => new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(`${dateValue}T00:00:00`));
	const reviewDate = (dateValue) => dateValue ? formatCalendarDate(dateValue) : 'Not selected';
	const updateReview = () => {
		reviewPanel.querySelector('[data-review-property]').textContent = property.title || property.property_title || 'Property';
		reviewPanel.querySelector('[data-review-move-in]').textContent = reviewDate(moveIn.value);
		reviewPanel.querySelector('[data-review-move-out]').textContent = indefiniteMoveOut.checked ? 'Indefinite / No planned move-out date' : reviewDate(moveOut.value);
		for (const [guestType, count] of Object.entries(guestCounts)) {
			reviewPanel.querySelector(`[data-review-${guestType}]`).textContent = String(count);
		}
	};
	let isReviewingRequest = false;
	const renderCalendar = () => {
		calendarMonth.textContent = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(displayedMonth);
		previousMonthButton.disabled = displayedMonth.getFullYear() === today.getFullYear() && displayedMonth.getMonth() === today.getMonth();
		const monthStart = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), 1);
		const daysInMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 0).getDate();
		const cells = [];
		for (let blank = 0; blank < monthStart.getDay(); blank += 1) cells.push('<span class="dashboard-calendar-empty" aria-hidden="true"></span>');
		for (let day = 1; day <= daysInMonth; day += 1) {
			const date = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), day);
			const value = dateKey(date);
			const isSelected = value === moveIn.value || value === moveOut.value;
			const isInRange = moveIn.value && moveOut.value && value > moveIn.value && value < moveOut.value;
			const classes = ['dashboard-calendar-day', isSelected ? 'is-selected' : '', isInRange ? 'is-in-range' : ''].filter(Boolean).join(' ');
			const disabled = value < todayKey;
			const dateLabel = formatCalendarDate(value);
			cells.push(`<button type="button" class="${classes}" data-calendar-date="${value}" aria-label="${dateLabel}" aria-pressed="${isSelected}"${disabled ? ' disabled' : ''}>${day}</button>`);
		}
		calendarDays.innerHTML = cells.join('');
		moveInLabel.textContent = moveIn.value ? formatCalendarDate(moveIn.value) : 'Not selected';
		moveOutLabel.textContent = indefiniteMoveOut.checked ? 'Indefinite' : (moveOut.value ? formatCalendarDate(moveOut.value) : 'Not selected');
		calendarHint.textContent = indefiniteMoveOut.checked
			? 'Choose or update a move-in date'
			: moveIn.value && moveOut.value
				? 'Select another date to start a new stay'
				: moveIn.value
					? 'Now choose a move-out date, or select another date to change move-in'
					: 'Choose a move-in date';
	};
	calendarDays.addEventListener('click', (event) => {
		const dayButton = event.target.closest('[data-calendar-date]');
		if (!dayButton || dayButton.disabled) return;
		const selectedDate = dayButton.dataset.calendarDate;
		indefiniteMoveOut.checked = false;
		if (!moveIn.value || moveOut.value || selectedDate <= moveIn.value) {
			moveIn.value = selectedDate;
			moveOut.value = '';
		} else {
			moveOut.value = selectedDate;
		}
		status.textContent = '';
		renderCalendar();
		if (isReviewingRequest) updateReview();
	});
	previousMonthButton.addEventListener('click', () => {
		displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() - 1, 1);
		renderCalendar();
	});
	nextMonthButton.addEventListener('click', () => {
		displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 1);
		renderCalendar();
	});
	renderCalendar();
	form.querySelector('.dashboard-guest-list').addEventListener('click', (event) => {
		const actionButton = event.target.closest('[data-guest-action]');
		if (!actionButton) return;
		const guestRow = actionButton.closest('[data-guest-row]');
		const guestType = guestRow.dataset.guestRow;
		const minimum = guestType === 'adults' ? 1 : 0;
		guestCounts[guestType] = Math.max(minimum, guestCounts[guestType] + (actionButton.dataset.guestAction === 'increase' ? 1 : -1));
		guestRow.querySelector('[data-guest-count]').textContent = String(guestCounts[guestType]);
		guestRow.querySelector('[data-guest-action="decrease"]').disabled = guestCounts[guestType] === minimum;
		occupantsInput.value = String(guestCounts.adults + guestCounts.children + guestCounts.infants);
		status.textContent = '';
		if (isReviewingRequest) updateReview();
	});
	indefiniteMoveOut.addEventListener('change', () => {
		if (indefiniteMoveOut.checked) moveOut.value = '';
		renderCalendar();
		if (isReviewingRequest) updateReview();
	});
	form.querySelector('.dashboard-edit-request').addEventListener('click', () => {
		isReviewingRequest = false;
		reviewPanel.hidden = true;
		submitButton.textContent = 'Send Request';
		status.textContent = '';
	});
	modal.querySelector('.dashboard-chat-owner').addEventListener('click', () => {
		const chatUrl = new URL(window.location.href);
		chatUrl.hash = `/tenant/message?propertyId=${encodeURIComponent(property.id)}`;
		const chatWindow = window.open(chatUrl.href, '_blank', 'noopener,noreferrer');
		if (chatWindow) chatWindow.opener = null;
	});
	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		if (!form.reportValidity()) return;
		if (!moveIn.value) {
			status.textContent = 'Choose a move-in date.';
			return;
		}
		if (!indefiniteMoveOut.checked && moveOut.value && moveIn.value && moveOut.value <= moveIn.value) {
			status.textContent = 'Move-out date must be after the move-in date.';
			return;
		}
		if (!isReviewingRequest) {
			updateReview();
			reviewPanel.hidden = false;
			reviewPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			isReviewingRequest = true;
			submitButton.textContent = 'Confirm & Send Request';
			status.textContent = 'Review your request details, then confirm to send.';
			return;
		}
		submitButton.disabled = true;
		try {
			await api.bookings.create({
				propertyId: Number(property.id),
				moveInDate: moveIn.value,
				moveOutDate: indefiniteMoveOut.checked ? null : moveOut.value || null,
				isIndefiniteMoveOut: indefiniteMoveOut.checked,
				occupants: Number(occupantsInput.value || 1),
				message: `Adults: ${guestCounts.adults}; Children: ${guestCounts.children}; Infants: ${guestCounts.infants}; Pets: ${guestCounts.pets}.`
			});
			modal.close();
			await successDialog(
				"Your request has been submitted and is pending the property owner's review.",
				'Request submitted'
			);
		} catch (error) {
			status.textContent = error.message || 'Unable to submit booking request.';
			submitButton.disabled = false;
		}
	});
}
