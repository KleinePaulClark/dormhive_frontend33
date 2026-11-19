import { redirectForRole } from '../../router.js';
import { api } from '../services/api.js';
import { showFirstLoginWelcome } from './firstLoginWelcome.js';

const API_BASE_URL = (window.DORMHIVE_API_URL ?? 'http://localhost:5000/api/v1').replace(/\/+$/, '');
const GOOGLE_IDENTITY_SCRIPT = 'https://accounts.google.com/gsi/client?hl=en';
let googleScriptPromise;
let googleConfigurationPromise;

export function oauthButtonsMarkup(mode = 'login') {
  if (mode !== 'login') return '';
  return `<div class="social-auth">
    <p class="oauth-divider"><span>Or sign in with</span></p>
    <div class="social-icons" role="group" aria-label="Social sign-in options">
      <div class="google-oauth-slot" data-google-oauth-button aria-label="Continue with Google"></div>
      <button class="oauth-button" type="button" data-oauth-provider="facebook" aria-label="Continue with Facebook" title="Continue with Facebook"><i class="bx bxl-facebook" aria-hidden="true"></i><span>Continue with Facebook</span><span class="oauth-spinner" aria-hidden="true"></span></button>
    </div>
  </div>`;
}

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    let script = document.querySelector(`script[src="${GOOGLE_IDENTITY_SCRIPT}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = GOOGLE_IDENTITY_SCRIPT;
      script.async = true;
      script.defer = true;
      document.head.append(script);
    }

    script.addEventListener('load', resolve, { once: true });
    script.addEventListener('error', () => reject(new Error('Google sign-in could not be loaded. Please try again later.')), { once: true });
    if (window.google?.accounts?.id) resolve();
  }).catch((error) => {
    googleScriptPromise = undefined;
    throw error;
  });

  return googleScriptPromise;
}

function showGoogleError(slot, error) {
  const message = slot.closest('.form-box')?.querySelector('.auth-message');
  if (!message) return;
  message.textContent = error.message;
  message.className = 'auth-message auth-message--error';
  message.hidden = false;
}

async function configureGoogleButton(slot) {
  try {
    if (!googleConfigurationPromise) googleConfigurationPromise = api.request('/auth/google/config', { auth: false });
    const { clientId } = await googleConfigurationPromise;
    await loadGoogleIdentityScript();
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async ({ credential }) => {
        slot.setAttribute('aria-busy', 'true');
        slot.closest('.form-box')?.querySelector('.auth-message')?.setAttribute('hidden', '');
        try {
          const result = await api.auth.googleLogin(credential);
          if (result.firstLogin && result.user.role === 'tenant') {
            const destination = await showFirstLoginWelcome(result.user);
            window.location.assign(`#${destination}`);
          } else {
            window.location.assign(`#${redirectForRole(result.user.role)}`);
          }
        } catch (error) {
          showGoogleError(slot, error);
        } finally {
          slot.removeAttribute('aria-busy');
        }
      }
    });
    window.google.accounts.id.renderButton(slot, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: Math.min(400, Math.round(slot.getBoundingClientRect().width)),
      locale: 'en'
    });
  } catch (error) {
    showGoogleError(slot, error);
  }
}

export function bindOAuthButtons(root) {
  root.querySelectorAll('[data-google-oauth-button]').forEach((slot) => {
    configureGoogleButton(slot);
  });

  root.querySelectorAll('[data-oauth-provider]').forEach((button) => {
    button.addEventListener('click', () => {
      const provider = button.dataset.oauthProvider;
      const role = root.querySelector('#role')?.value ?? 'tenant';
      const mode = button.dataset.oauthMode
        ?? (root.querySelector('.container')?.classList.contains('active') ? 'register' : 'login');
      button.disabled = true;
      button.classList.add('is-loading');
      button.setAttribute('aria-busy', 'true');
      button.setAttribute('aria-label', `Connecting to ${provider}...`);
      const params = new URLSearchParams({ mode, role });
      window.location.assign(`${API_BASE_URL}/auth/${provider}/start?${params}`);
    });
  });
}
