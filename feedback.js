'use strict';
// This webhook is a dummy webhook connected to a test channel on a new discord account in a new server.
const PROP_FEEDBACK_WEBHOOK = 'https://discord.com/api/webhooks/1553638990106861610/eZRt99csJZj6aGmv-Hrjaw4fG6NLKoV3KkfP0NbDCVNWzlKpp7wX6nQ4pHekvGdb0I0x';
const ACCESS_REQUEST_MESSAGE = "Id like access to Tornet Market. Please contact me at : [your email].";
let propFeedbackSending = false;
document.addEventListener('change',event=>{
 if(!event.target.matches('#support-form select[name="subject"]'))return;
 const form=event.target.form,message=form.querySelector('[name="message"]');
 if(event.target.value==='Request access'){
  if(!message.value.trim())message.value=ACCESS_REQUEST_MESSAGE;
 }else if(message.value===ACCESS_REQUEST_MESSAGE){message.value='';}
 form.querySelector('[data-feedback-status]').textContent='';
});
async function sendPropFeedback(form) {
 const status = form.querySelector('[data-feedback-status]');
 if (propFeedbackSending) { status.textContent = 'A message is already being sent. Please wait.'; return; }
 const data = new FormData(form);
 const subject = String(data.get('subject') || '');
 const message = String(data.get('message') || '').trim();
 if (!['Order Support','General Question/Inquiry','Website bug','Request access'].includes(subject) || message.length < 5 || message.length > 2000) {
  status.textContent = 'Choose a feedback subject and enter 5 to 2,000 characters.'; return;
 }
 if(subject==='Request access'&&(message.includes('[your email]')||! /[^\s@]+@[^\s@]+\.[^\s@]+/.test(message))){
  status.textContent='Replace [your email] with your email address before sending.';return;
 }
 const button = form.querySelector('[type="submit"]');
 const originalLabel = button.innerHTML;
 propFeedbackSending = true;
 button.disabled = true;
 button.textContent = 'Sending...';
 form.setAttribute('aria-busy','true');
 status.textContent = 'Sending message to Tornet Market...';
 const controller = new AbortController();
 const timeout = setTimeout(() => controller.abort(),15000);
 try {
  const url = new URL(PROP_FEEDBACK_WEBHOOK);
  url.searchParams.set('wait','true');
  const response = await fetch(url.href, {
   method:'POST', headers:{'Content-Type':'application/json'}, credentials:'omit', referrerPolicy:'no-referrer', signal:controller.signal,
   body:JSON.stringify({
    content:'',
    embeds:[{title:subject,description:message,color:7919856}],
    allowed_mentions:{parse:[]}
   })
  });
  if (response.status === 429) throw new Error('Tornet Market is receiving messages too quickly. Please wait before trying again. Your text has been kept.');
  if (!response.ok) throw new Error('Tornet Market did not accept the message. Your text has been kept. The Owner may need to fix a bug.');
  const result = await response.json();
  if (!result.id) throw new Error('Delivery could not be confirmed. Check with a Admin before retrying to avoid duplicates.');
  form.reset();
  status.textContent = 'Message sent to Tornet Market. Expect a response within 24 Hours.';
 } catch (error) {
  status.textContent = error.name === 'AbortError' || error instanceof TypeError
   ? 'Delivery could not be confirmed. Your text has been kept. Check Tornet Market before retrying to avoid duplicates.'
   : error.message;
 } finally {
  clearTimeout(timeout);
  propFeedbackSending = false;
  button.disabled = false;
  button.innerHTML = originalLabel;
  form.removeAttribute('aria-busy');
 }
}
