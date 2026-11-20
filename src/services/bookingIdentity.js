import { createModal, openModal } from '../components/modal.js';

const API = (window.DORMHIVE_API_URL ?? 'http://localhost:5000/api/v1').replace(/\/$/, '');
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('dormhive.accessToken') ?? ''}` });

async function showDocument(bookingId, side, mimeType) {
  const response = await fetch(`${API}/bookings/${encodeURIComponent(bookingId)}/identity-documents/${side}`, {
    headers: authHeaders(),
    cache: 'no-store'
  });
  if (!response.ok) throw new Error('Unable to open this ID document.');

  const objectUrl = URL.createObjectURL(await response.blob());
  const preview = document.createElement('div');
  preview.className = 'booking-identity-preview';
  if (mimeType.startsWith('image/')) {
    const image = document.createElement('img');
    image.src = objectUrl;
    image.alt = `Government ID ${side} side`;
    preview.append(image);
  } else {
    const frame = document.createElement('iframe');
    frame.src = objectUrl;
    frame.title = `Government ID ${side} side`;
    frame.setAttribute('sandbox', '');
    preview.append(frame);
  }

  const modal = createModal({ title: `Government ID — ${side} side`, content: preview });
  modal.addEventListener('close', () => URL.revokeObjectURL(objectUrl), { once: true });
  await openModal(modal);
}

export async function renderBookingIdentityDocuments(container, bookingId) {
  if (!container) return;
  const section = document.createElement('section');
  section.className = 'booking-identity-documents';
  const heading = document.createElement('h3');
  heading.textContent = 'Identity verification';
  const idType = document.createElement('p');
  idType.textContent = 'Loading ID documents…';
  idType.setAttribute('role', 'status');
  const actions = document.createElement('div');
  actions.className = 'booking-identity-documents__actions';
  section.append(heading, idType, actions);
  container.append(section);

  try {
    const response = await fetch(`${API}/bookings/${encodeURIComponent(bookingId)}/identity-documents`, {
      headers: authHeaders(),
      cache: 'no-store'
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || 'Unable to load ID documents.');

    const documents = Array.isArray(body.data) ? body.data : [];
    if (!documents.length) {
      idType.textContent = 'No ID documents are available for this booking.';
      return;
    }

    const names = { philid: 'PhilID / National ID', passport: 'Passport', drivers_license: "Driver's License", umid: 'UMID', other: 'Other government-issued ID' };
    idType.textContent = `ID type: ${names[documents[0].id_type] || 'Government-issued ID'}`;
    for (const documentInfo of documents) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `View ${documentInfo.side} side`;
      button.addEventListener('click', async () => {
        button.disabled = true;
        idType.textContent = '';
        try {
          await showDocument(bookingId, documentInfo.side, documentInfo.mime_type);
        } catch (error) {
          idType.textContent = error.message;
        } finally {
          button.disabled = false;
        }
      });
      actions.append(button);
    }
  } catch (error) {
    idType.textContent = error.message;
  }
}
