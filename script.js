/* Utils */
const select = (q, el=document) => el.querySelector(q);
const selectAll = (q, el=document) => Array.from(el.querySelectorAll(q));

/* Starfield background */
const starCanvas = select('#starfield');
const ctx = starCanvas.getContext('2d');
let stars = [];
let deviceRatio = Math.min(window.devicePixelRatio || 1, 2);
let width = 0, height = 0;

function resizeCanvas(){
  width = starCanvas.clientWidth = window.innerWidth;
  height = starCanvas.clientHeight = window.innerHeight;
  starCanvas.width = Math.floor(width * deviceRatio);
  starCanvas.height = Math.floor(height * deviceRatio);
  ctx.setTransform(deviceRatio,0,0,deviceRatio,0,0);
  createStars();
}

function createStars(){
  const starCount = Math.floor((width * height) / 3200);
  stars = new Array(starCount).fill(0).map(() => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.2 + 0.2,
    speed: Math.random() * 0.2 + 0.05,
    alpha: Math.random() * 0.7 + 0.3,
    twinkle: Math.random() * 0.02 + 0.005,
  }));
}

let lastTime = 0;
function animate(ts){
  const delta = ts - lastTime; lastTime = ts;
  ctx.clearRect(0,0,width,height);
  for(const s of stars){
    s.y += s.speed * (delta * 0.06);
    if(s.y > height + 2) s.y = -2;
    s.alpha += (Math.random() - 0.5) * s.twinkle;
    s.alpha = Math.max(0.2, Math.min(1, s.alpha));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI*2);
    ctx.fillStyle = `rgba(186, 226, 255, ${s.alpha})`;
    ctx.shadowColor = 'rgba(90, 209, 255, .6)';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  requestAnimationFrame(animate);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
requestAnimationFrame(animate);

/* Smooth scroll */
selectAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if(href && href.length > 1){
      const target = select(href);
      if(target){
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });
});

/* Mobile nav */
const nav = select('.nav');
const toggle = select('.nav-toggle');
toggle.addEventListener('click', () => {
  const expanded = nav.getAttribute('aria-expanded') === 'true';
  nav.setAttribute('aria-expanded', String(!expanded));
  toggle.setAttribute('aria-expanded', String(!expanded));
});
selectAll('.nav-list a').forEach(link => link.addEventListener('click', () => {
  nav.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-expanded', 'false');
}));

/* Scroll effects: reveal on view */
const observer = new IntersectionObserver(entries => {
  for(const entry of entries){
    if(entry.isIntersecting){
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  }
},{threshold:0.12});
selectAll('.section, .card, .news-card').forEach(el => observer.observe(el));

/* Gallery data & modal */
const sampleImages = [
  {src:'https://images-assets.nasa.gov/image/PIA12235/PIA12235~orig.jpg', label:'Orion Nebula'},
  {src:'https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e000705/GSFC_20171208_Archive_e000705~orig.jpg', label:'Earth at Night'},
  {src:'https://images-assets.nasa.gov/image/PIA03149/PIA03149~orig.jpg', label:'Jupiter Storms'},
  {src:'https://images-assets.nasa.gov/image/PIA17011/PIA17011~orig.jpg', label:'Saturn Rings'},
  {src:'https://images-assets.nasa.gov/image/PIA04921/PIA04921~orig.jpg', label:'Mars Dunes'},
  {src:'https://images-assets.nasa.gov/image/PIA04981/PIA04981~orig.jpg', label:'Crab Nebula'},
  {src:'https://images-assets.nasa.gov/image/PIA12233/PIA12233~orig.jpg', label:'Barred Spiral'},
  {src:'https://images-assets.nasa.gov/image/PIA07077/PIA07077~orig.jpg', label:'Ring Nebula'}
];

const galleryGrid = select('#galleryGrid');
const modal = select('#imageModal');
const modalImg = select('.modal-image');
const modalCaption = select('.modal-caption');
const modalClose = select('.modal-close');

function buildGallery(){
  const frag = document.createDocumentFragment();
  for(const item of sampleImages){
    const wrapper = document.createElement('div');
    wrapper.className = 'thumb';
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.alt = item.label;
    img.src = item.src;
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = item.label;
    wrapper.appendChild(img);
    wrapper.appendChild(label);
    wrapper.addEventListener('click', () => openModal(item));
    frag.appendChild(wrapper);
  }
  galleryGrid.appendChild(frag);
}

function openModal(item){
  modalImg.src = item.src;
  modalImg.alt = item.label;
  modalCaption.textContent = item.label;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
}
function closeModal(){
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
  modalImg.src = '';
}
modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', e => { if(e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeModal(); });

buildGallery();

/* APOD Integration */
const apodKey = 'DEMO_KEY'; // replace with your key for higher rate limits
async function loadAPOD(){
  const card = select('#apodCard');
  const media = select('.apod-media');
  const title = select('#apodTitle');
  const date = select('#apodDate');
  const expl = select('#apodExplanation');
  const hdLink = select('#apodHdLink');
  // ensure loading state at start
  card.classList.add('loading');
  try{
    const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apodKey}`);
    if(!res.ok) throw new Error('APOD request failed');
    const data = await res.json();
    title.textContent = data.title || 'Astronomy Picture of the Day';
    date.textContent = data.date || '';
    expl.textContent = data.explanation || '';
    hdLink.href = data.hdurl || data.url || '#';
    media.innerHTML = '';
    if(data.media_type === 'video'){
      const iframe = document.createElement('iframe');
      iframe.src = data.url;
      iframe.loading = 'lazy';
      iframe.allowFullscreen = true;
      iframe.addEventListener('load', () => card.classList.remove('loading'));
      media.appendChild(iframe);
    } else {
      const img = document.createElement('img');
      img.src = data.url;
      img.alt = data.title || 'APOD image';
      img.loading = 'lazy';
      img.addEventListener('load', () => card.classList.remove('loading'));
      img.addEventListener('error', () => card.classList.remove('loading'));
      media.appendChild(img);
    }
  }catch(err){
    media.innerHTML = '<p style="color:#ff9fa1">Failed to load APOD. Please try again later.</p>';
    console.error(err);
    card.classList.remove('loading');
  }
}
loadAPOD();

/* Contact form (demo) */
select('#contactForm').addEventListener('submit', e => {
  e.preventDefault();
  const form = e.currentTarget;
  const note = select('#formNote');
  const name = select('#name').value.trim();
  const email = select('#email').value.trim();
  const message = select('#message').value.trim();
  if(!name || !email || !message){
    note.textContent = 'Please fill in all fields.';
    note.style.color = 'var(--danger)';
    return;
  }
  note.textContent = 'Message sent. We\'ll get back to you soon!';
  note.style.color = 'var(--success)';
  form.reset();
});

/* Year */
select('#year').textContent = new Date().getFullYear();



