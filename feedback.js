'use strict';
// Browser-only movie-prop feedback. This URL is public, not an encrypted secret.
// Replace or remove the disposable webhook after filming.
const PROP_FEEDBACK_WEBHOOK = 'https://discord.com/api/webhooks/1553638990106861610/eZRt99csJZj6aGmv-Hrjaw4fG6NLKoV3KkfP0NbDCVNWzlKpp7wX6nQ4pHekvGdb0I0x';
let propFeedbackSending = false;
async function sendPropFeedback(form) {
 const status = form.querySelector('[data-feedback-status]');
 if (propFeedbackSending) { status.textContent = 'A message is already being sent. Please wait.'; return; }
 const data = new FormData(form);
 const subject = String(data.get('subject') || '');
 const message = String(data.get('message') || '').trim();
 if (!['Order Support','General Question/Inquiry','Website bug'].includes(subject) || message.length < 5 || message.length > 2000) {
  status.textContent = 'Choose a feedback subject and enter 5 to 2,000 characters.'; return;
 }
 const button = form.querySelector('[type="submit"]');
 const originalLabel = button.innerHTML;
 propFeedbackSending = true;
 button.disabled = true;
 button.textContent = 'Sending...';
 form.setAttribute('aria-busy','true');
 status.textContent = 'Sending movie-prop feedback to Discord...';
 const controller = new AbortController();
 const timeout = setTimeout(() => controller.abort(),15000);
 try {
  const url = new URL(PROP_FEEDBACK_WEBHOOK);
  url.searchParams.set('wait','true');
  const response = await fetch(url.href, {
   method:'POST', headers:{'Content-Type':'application/json'}, credentials:'omit', referrerPolicy:'no-referrer', signal:controller.signal,
   body:JSON.stringify({
    content:'Movie-prop feedback only. No real purchases, payments, or orders are supported.',
    embeds:[{title:subject,description:message,color:7919856}],
    allowed_mentions:{parse:[]}
   })
  });
  if (response.status === 429) throw new Error('Discord is receiving messages too quickly. Please wait before trying again. Your text has been kept.');
  if (!response.ok) throw new Error('Discord did not accept the message. Your text has been kept. The creator may need to replace the webhook.');
  const result = await response.json();
  if (!result.id) throw new Error('Delivery could not be confirmed. Check Discord before retrying to avoid duplicates.');
  form.reset();
  status.textContent = 'Message sent to the creator\'s Discord. Thank you for the movie-prop feedback.';
 } catch (error) {
  status.textContent = error.name === 'AbortError' || error instanceof TypeError
   ? 'Delivery could not be confirmed. Your text has been kept. Check Discord before retrying to avoid duplicates.'
   : error.message;
 } finally {
  clearTimeout(timeout);
  propFeedbackSending = false;
  button.disabled = false;
  button.innerHTML = originalLabel;
  form.removeAttribute('aria-busy');
 }
}
