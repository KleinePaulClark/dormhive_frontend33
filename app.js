import { installRouter, renderRoute, navigate, redirectForRole } from './router.js';
import { installAvatarPreview } from './src/components/avatarPreview.js';
import { confirmDialog } from './src/components/modal.js';
import { connectRealtime, installRealtimeFetchHeader } from './src/services/realtime.js';

export { navigate, redirectForRole };
function clearSession() {
  localStorage.removeItem('dormhive.accessToken');
  localStorage.removeItem('dormhive.user');
}

async function requestLogout(button) {
  if (button.disabled) return;
  button.disabled = true;
  try {
    const confirmed = await confirmDialog({
      title: 'Log out?',
      message: 'Are you sure you want to log out?',
      confirmLabel: 'YES',
      cancelLabel: 'NO',
      iconName: 'reject',
      variant: 'logout'
    });
    if (!confirmed) return;
    clearSession();
    document.querySelector('#app')?.replaceChildren();
    navigate('/login', true);
  } catch (error) {
    console.error('Unable to complete logout.', error);
  } finally {
    button.disabled = false;
  }
}

function installGlobalAuthHandlers() {
  document.addEventListener('click', (event) => {
    const button = event.target.closest('button.logout, button.signout');
    if (!button) return;
    event.preventDefault();
    requestLogout(button);
  });
}

export function startApp() {
  installAvatarPreview();
  installGlobalAuthHandlers();
  installRouter();
  installRealtimeFetchHeader();
  connectRealtime(() => window.dispatchEvent(new Event('dormhive:data-changed')));
  return renderRoute();
}

export function redirectAfterLogin(user) {
  localStorage.setItem('dormhive.user', JSON.stringify(user));
  return navigate(redirectForRole(user.role), true);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startApp);
else startApp();
