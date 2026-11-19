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
  question.textContent = 'How would you like to get started?';
  const choices = document.createElement('div');
  choices.className = 'first-login-welcome__choices';
  const ownerButton = choiceButton('List your property', 'Reach people looking for a place to stay.', 'first-login-welcome__choice--owner');
  const tenantButton = choiceButton('Find a place to stay', 'Explore available rental listings.', 'first-login-welcome__choice--tenant');
  const errorMessage = document.createElement('p');
  errorMessage.className = 'first-login-welcome__error';
  errorMessage.setAttribute('role', 'alert');
  errorMessage.hidden = true;
  choices.append(ownerButton, tenantButton);
  content.append(greeting, question, choices, errorMessage);

  const modal = createModal({
    title: 'Welcome to DormHive',
    content,
    closeLabel: 'Not now',
    closeOnBackdrop: false
  });
  modal.classList.add('ui-first-login-welcome');

  const choicesByRole = { owner: ownerButton, tenant: tenantButton };
  const closed = new Promise((resolve) => {
    modal.addEventListener('close', () => resolve('/login'), { once: true });
  });
  const saveRole = async (role) => {
    const selectedButton = choicesByRole[role];
    ownerButton.disabled = true;
    tenantButton.disabled = true;
    ownerButton.setAttribute('aria-pressed', String(selectedButton === ownerButton));
    tenantButton.setAttribute('aria-pressed', String(selectedButton === tenantButton));
    errorMessage.hidden = true;
    try {
      await api.auth.setRegistrationRole(onboardingToken, role);
      modal.close();
    } catch (error) {
      errorMessage.textContent = error.message;
      errorMessage.hidden = false;
      ownerButton.disabled = false;
      tenantButton.disabled = false;
    }
  };
  tenantButton.addEventListener('click', () => saveRole('tenant'));
  ownerButton.addEventListener('click', () => saveRole('owner'));

  await openModal(modal);
  tenantButton.focus();
  return closed;
}
