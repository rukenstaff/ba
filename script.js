const select = (selector) => document.querySelector(selector);
const opening = select('#opening');
const openButton = select('#openInvitation');
const openText = select('#openText');
const site = select('#site');
const music = select('#bgMusic');
const musicToggle = select('#musicToggle');
const toast = select('#toast');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const data = window.INVITATION_DATA || window.WEDDING_DATA;
let currentLanguage = 'ku';
let opened = false;
let toastTimer;
let musicUnavailable = false;

function setMonogram(selector, accentTag) {
  const element = select(selector);
  const accent = document.createElement(accentTag);
  accent.textContent = '&';
  element.replaceChildren(
    document.createTextNode(data.couple.first.charAt(0).toUpperCase()),
    accent,
    document.createTextNode(data.couple.second.charAt(0).toUpperCase())
  );
}

function setHeading(selector, first, emphasis) {
  const element = select(selector);
  if (!emphasis) {
    element.textContent = first;
    return;
  }
  const italic = document.createElement('em');
  italic.textContent = emphasis;
  element.replaceChildren(document.createTextNode(first + ' '), italic);
}

function to24Hour(value) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') hour += 12;
  return String(hour).padStart(2, '0') + ':' + match[2];
}

function phoneHref(value) {
  const compact = value.replace(/[^\d+]/g, '');
  return 'tel:' + (compact.startsWith('0') ? '+964' + compact.slice(1) : compact);
}

function renderInvitation(language = currentLanguage) {
  currentLanguage = language;
  const copy = data.languages[language];
  const { couple, event, schedule, photography } = data;
  const date = new Date(event.date + 'T12:00:00Z');
  const formatted = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
  const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
  const [year, month, day] = event.date.split('-');
  const names = 'B&A';

  document.documentElement.lang = language;
  document.documentElement.dir = language === 'ku' ? 'rtl' : 'ltr';
  document.title = names + ' | ' + copy.titleSuffix;
  select('meta[name="description"]').content = copy.metaDescription
    .replace('{names}', names)
    .replace('{date}', formatted)
    .replace('{venue}', event.venue);
  const openingElement = select('#opening');
  if (openingElement) {
    openingElement.setAttribute('aria-label', copy.openingAria);
    select('.opening-heading .overline').textContent = copy.openingOverline;
    select('#openInvitation').setAttribute('aria-label', copy.openAria);
    select('#openText span').textContent = copy.openPrompt;
    select('.insert-caption').textContent = copy.insertCaption;
    setMonogram('.opening-heading p', 'em');
    setMonogram('.insert-monogram', 'i');
    setMonogram('.invitation-seal', 'span');
    select('.opening-date').textContent = day + ' / ' + month + ' / ' + year;
  }
  select('.hero-overline').textContent = copy.heroOverline;
  select('.hero-photo').alt = copy.heroAlt;
  select('.hero-invite').textContent = copy.heroInvite;
  select('.hero-link').firstChild.textContent = copy.discover + ' ';
  select('.story-section .section-kicker').textContent = copy.storyKicker;
  select('.countdown-section .section-kicker').textContent = copy.countdown;
  select('.countdown-date').textContent = weekday;
  select('.countdown').setAttribute('aria-label', copy.timerLabel);
  select('.venue-content .overline').textContent = copy.venue;
  select('.border-button').firstChild.textContent = copy.directions + ' ';
  select('.schedule-section .section-kicker').textContent = copy.scheduleKicker;
  setHeading('#schedule-title', copy.scheduleTitle, copy.scheduleEmphasis);
  select('.staff-intro .section-kicker').textContent = copy.staffKicker;
  select('.staff-intro > p').textContent = copy.staffDescription;
  select('.staff-contact-title').textContent = copy.connect;
  select('#shareBtn').firstChild.textContent = copy.share + ' ';
  document.querySelectorAll('.countdown span').forEach((element, index) => {
    element.textContent = [copy.days, copy.hours, copy.minutes, copy.seconds][index];
  });
  document.querySelectorAll('.language-button').forEach((button) => {
    const selected = button.dataset.language === language;
    button.setAttribute('aria-pressed', String(selected));
    button.setAttribute('aria-label', button.dataset.language === 'ku' ? copy.switchToKurdish : copy.switchToEnglish);
  });
  select('.language-switcher').setAttribute('aria-label', copy.languageGroup);
  document.querySelectorAll('.contact-row').forEach((row, index) => {
    if (index > 1) row.querySelector('span').textContent = copy.phone;
  });
  setMonogram('.hero h1', 'span');
  ['.story-ornament', '.footer-mark'].forEach((selector) => setMonogram(selector, 'i'));
  setMonogram('.brand-mark', 'span');
  select('.brand-mark').setAttribute('aria-label', names + copy.backToTop);
  select('.hero-side-note').textContent = couple.first.charAt(0).toUpperCase() + '&' + couple.second.charAt(0).toUpperCase() + ' / ' + year;
  const heroCaption = select('.hero-top-caption');
  const captionDate = document.createElement('bdi');
  captionDate.dir = 'ltr';
  captionDate.textContent = formatted;
  const captionDivider = document.createElement('span');
  captionDivider.className = 'caption-divider';
  heroCaption.replaceChildren(document.createTextNode(copy.heroCaption + ' '), captionDivider, document.createTextNode(' '), captionDate);
  select('.hero-meta').replaceChildren(
    document.createTextNode(formatted + ' '),
    document.createElement('span'),
    document.createTextNode(' ' + event.venue)
  );
  setHeading('.story-section h2', copy.storyTitle, copy.storyEmphasis);
  select('.story-section blockquote').textContent = copy.storyQuote;
  setHeading('.venue-content h2', event.venue, '');
  select('.venue-section img').alt = copy.venueAlt;
  select('.border-button').href = event.directionsUrl;

  document.querySelectorAll('.event').forEach((element, index) => {
    const item = schedule[index];
    if (!item) return;
    const time = element.querySelector('time');
    time.textContent = item.time;
    const hour = to24Hour(item.time);
    if (hour) time.dateTime = event.date + 'T' + hour + ':00' + event.utcOffset;
    else time.removeAttribute('datetime');
    element.querySelector('h3').textContent = item.title[language];
    element.querySelector('p').textContent = item.detail[language];
  });

  const staffParts = photography.name.split(' ');
  setHeading('.staff-intro h2', staffParts[0], staffParts.slice(1).join(' '));
  select('.staff-image img').alt = photography.name + ' branding';
  const rows = document.querySelectorAll('.contact-row');
  rows[0].href = photography.instagramUrl;
  rows[0].querySelector('strong').textContent = photography.instagramHandle;
  rows[1].href = photography.snapchatUrl;
  rows[1].querySelector('strong').textContent = photography.snapchatHandle;
  photography.phones.slice(0, 3).forEach((number, index) => {
    rows[index + 2].href = phoneHref(number);
    rows[index + 2].querySelector('strong').textContent = number;
  });
  select('.staff-page-link').href = photography.pageUrl;
  select('.staff-page-link').firstChild.textContent = copy.staffLink + ' ';
  const footer = select('.site-footer p');
  const footerNames = document.createElement('bdi');
  footerNames.dir = 'ltr';
  footerNames.textContent = names;
  const footerDate = document.createElement('bdi');
  footerDate.dir = 'ltr';
  footerDate.textContent = formatted;
  const footerVenue = document.createElement('bdi');
  footerVenue.dir = 'ltr';
  footerVenue.textContent = event.venue;
  footer.replaceChildren(document.createTextNode(copy.footer + ' '), footerNames, document.createTextNode(' · '), footerDate, document.createTextNode(' · '), footerVenue);
}

renderInvitation();

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2500);
}

function updateMusicControl() {
  const playing = !music.paused && !music.error;
  musicToggle.hidden = musicUnavailable || !!music.error;
  musicToggle.classList.toggle('is-muted', !playing);
  musicToggle.setAttribute('aria-pressed', String(playing));
  musicToggle.setAttribute('aria-label', playing ? data.languages[currentLanguage].mute : data.languages[currentLanguage].play);
  select('.music-word').textContent = playing ? data.languages[currentLanguage].musicOn : data.languages[currentLanguage].musicOff;
}

function playMusic() {
  // Called directly in the opening click handler to satisfy iOS audio rules.
  const attempt = music.play();
  if (attempt && typeof attempt.then === 'function') {
    attempt.then(updateMusicControl).catch(() => {
      musicUnavailable = true;
      updateMusicControl();
      showToast(data.languages[currentLanguage].musicUnavailable);
    });
  }
}

function openInvitation() {
  if (opened) return;
  opened = true;
  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;
  document.body.classList.remove('is-locked');
  root.style.scrollBehavior = 'auto';
  window.scrollTo(0, 0);
  root.style.scrollBehavior = previousScrollBehavior;
  document.body.classList.add('is-locked');
  playMusic();
  opening.classList.add('is-opening');
  openButton.disabled = true;
  openText.disabled = true;
  const delay = reducedMotion.matches ? 80 : 1150;
  window.setTimeout(() => {
    site.inert = false;
    document.body.classList.remove('is-locked');
    opening.classList.add('is-dismissed');
    updateMusicControl();
    window.setTimeout(() => opening.remove(), reducedMotion.matches ? 50 : 950);
  }, delay);
}

openButton.addEventListener('click', openInvitation);
openText.addEventListener('click', openInvitation);
document.querySelectorAll('.language-button').forEach((button) => {
  button.addEventListener('click', () => {
    renderInvitation(button.dataset.language);
    if (opened) updateMusicControl();
  });
});
musicToggle.addEventListener('click', () => {
  if (music.paused) playMusic();
  else music.pause();
  updateMusicControl();
});
music.addEventListener('play', updateMusicControl);
music.addEventListener('pause', updateMusicControl);
music.addEventListener('error', () => {
  musicUnavailable = true;
  updateMusicControl();
});

const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px 35px 0px' });
  reveals.forEach((item) => observer.observe(item));
} else {
  reveals.forEach((item) => item.classList.add('is-visible'));
}

// Use the event's configured UTC offset, independent of the guest's timezone.
const eventTime = new Date(data.event.date + 'T' + data.event.startTime + ':00' + data.event.utcOffset).getTime();
const countFields = ['days', 'hours', 'minutes', 'seconds'].map((id) => select(`#${id}`));
function updateCountdown() {
  let remaining = Math.max(0, eventTime - Date.now());
  const days = Math.floor(remaining / 86400000); remaining %= 86400000;
  const hours = Math.floor(remaining / 3600000); remaining %= 3600000;
  const minutes = Math.floor(remaining / 60000); remaining %= 60000;
  const seconds = Math.floor(remaining / 1000);
  [days, hours, minutes, seconds].forEach((value, index) => {
    countFields[index].textContent = String(value).padStart(2, '0');
  });
}
updateCountdown();
window.setInterval(updateCountdown, 1000);

select('#shareBtn').addEventListener('click', async () => {
  const copy = data.languages[currentLanguage];
  const shareData = { title: document.title, text: copy.shareText, url: window.location.href };
  try {
    if (navigator.share) await navigator.share(shareData);
    else if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(shareData.url);
      showToast(copy.linkCopied);
    } else showToast(copy.sharingUnavailable);
  } catch (error) {
    if (error.name !== 'AbortError') showToast(copy.sharingUnavailable);
  }
});
