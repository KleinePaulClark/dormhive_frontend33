import { createModal, openModal } from '../components/modal.js';
import { api } from '../services/api.js';

function choiceButton(title, description, className) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `first-login-welcome__choice ${className}`;
  button.setAttribute('aria-pressed', 'false');
  const label = document.createElement('span');
  label.className = 'first-login-welcome__choice-title';
  label.textContent = title;
  const detail = document.createElement('span');
  detail.className = 'first-login-welcome__choice-description';
  detail.textContent = description;
  button.append(label, detail);
  return button;
}

export async function showFirstLoginWelcome(user, onboardingToken) {
  const content = document.createElement('div');
  content.className = 'first-login-welcome';
  const greeting = document.createElement('p');
  greeting.className = 'first-login-welcome__greeting';
  const firstName = String(user.first_name ?? user.firstName ?? user.name ?? '').trim().split(/\s+/)[0] || 'there';
  greeting.textContent = `Hi, ${firstName}!`;
  const question = document.createElement('p');
  question.className = 'first-login-welcome__question';
  question.textContent = 'Choose one option to continue.';
  const choices = document.createElement('div');
  choices.className = 'first-login-welcome__choices';
  choices.setAttribute('role', 'group');
  choices.setAttribute('aria-label', 'Choose your account role');
  const ownerButton = choiceButton('List your property', 'Reach people looking for a place to stay.', 'first-login-welcome__choice--owner');
  const tenantButton = choiceButton('Find a place to stay', 'Explore available rental listings.', 'first-login-welcome__choice--tenant');
  const errorMessage = document.createElement('p');
  errorMessage.className = 'first-login-welcome__error';
  errorMessage.setAttribute('role', 'alert');
  errorMessage.hidden = true;
  choices.append(ownerButton, tenantButton);
  content.append(greeting, question, choices, errorMessage);

  const okayButton = document.createElement('button');
  okayButton.type = 'button';
  okayButton.textContent = 'Okay';
  okayButton.disabled = true;
  const modal = createModal({
    title: 'Welcome to DormHive',
    content,
    closeLabel: null,
    footerMarkup: okayButton.outerHTML,
    closeOnBackdrop: false,
    showCloseButton: false,
    closeOnHashChange: false
  });
  modal.classList.add('ui-first-login-welcome');

  const confirmationButton = modal.querySelector('.ui-modal__footer button');
  let selectedRole = '';
  modal.addEventListener('cancel', (event) => event.preventDefault());
  const closed = new Promise((resolve) => {
    modal.addEventListener('close', () => resolve('/login'), { once: true });
  });
  const saveRole = async (role) => {
    ownerButton.disabled = true;
    tenantButton.disabled = true;
    confirmationButton.disabled = true;
    errorMessage.hidden = true;
    try {
      if (onboardingToken) {
        await api.auth.setRegistrationRole(onboardingToken, role);
      } else if (role === 'owner') {
        await api.auth.becomeOwner();
      }
      modal.close();
    } catch (error) {
      errorMessage.textContent = error.message;
      errorMessage.hidden = false;
      ownerButton.disabled = false;
      tenantButton.disabled = false;
      confirmationButton.disabled = false;
    }
  };
  const selectRole = (role) => {
    selectedRole = role;
    ownerButton.setAttribute('aria-pressed', String(role === 'owner'));
    tenantButton.setAttribute('aria-pressed', String(role === 'tenant'));
    confirmationButton.disabled = false;
    errorMessage.hidden = true;
  };
  tenantButton.addEventListener('click', () => selectRole('tenant'));
  ownerButton.addEventListener('click', () => selectRole('owner'));
  confirmationButton.addEventListener('click', () => {
    if (selectedRole) saveRole(selectedRole);
  });

  await openModal(modal);
  tenantButton.focus();
  return closed;
}
