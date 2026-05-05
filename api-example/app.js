const API_KEY  = '2183731c8a42380b504050bebc3276b2';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_W500 = 'https://image.tmdb.org/t/p/w500';
const IMG_ORIG = 'https://image.tmdb.org/t/p/original';

let heroMovie = null;
let allMovies = [];

async function fetchMovies(endpoint) {
  const url = `${BASE_URL}${endpoint}?api_key=${API_KEY}&language=ko-KR&page=1`;
  const res  = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.results || [];
}

function renderSkeletons(rowId, count = 8) {
  const row = document.getElementById(rowId);
  row.innerHTML = Array.from({ length: count }, () => `
    <div class="skeleton">
      <div class="skeleton-poster"></div>
      <div class="skeleton-text"></div>
    </div>
  `).join('');
}

function renderCards(rowId, movies) {
  const row = document.getElementById(rowId);
  row.innerHTML = '';
  movies.forEach(movie => {
    const poster = movie.poster_path
      ? `<img src="${IMG_W500}${movie.poster_path}" alt="${movie.title}" loading="lazy" />`
      : `<div class="no-poster">🎬</div>`;

    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const year   = movie.release_date ? movie.release_date.slice(0, 4) : '';

    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
      ${poster}
      <div class="movie-card-overlay">
        <div class="movie-card-info">
          <div class="movie-card-title">${movie.title}</div>
          <div class="movie-card-rating">★ ${rating}</div>
          <div class="movie-card-year">${year}</div>
        </div>
      </div>
      <div class="movie-label">${movie.title}</div>
    `;
    card.addEventListener('click', () => openModal(movie));
    row.appendChild(card);
  });
}

function setHero(movie) {
  heroMovie = movie;
  const bgPath = movie.backdrop_path
    ? `${IMG_ORIG}${movie.backdrop_path}`
    : (movie.poster_path ? `${IMG_W500}${movie.poster_path}` : '');

  document.getElementById('hero-bg').style.backgroundImage = bgPath ? `url(${bgPath})` : 'none';
  document.getElementById('hero-title').textContent = movie.title;

  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
  const year   = movie.release_date ? movie.release_date.slice(0, 4) : '';

  document.getElementById('hero-meta').innerHTML = `
    <span style="color:#46d369;font-weight:700;">★ ${rating}</span>
    <span class="rating-badge">${year}</span>
  `;
  document.getElementById('hero-overview').textContent =
    movie.overview || '줄거리 정보가 없습니다.';
}

function heroPlay() { if (heroMovie) openModal(heroMovie); }
function heroInfo() { if (heroMovie) openModal(heroMovie); }

function openModal(movie) {
  const bannerPath = movie.backdrop_path
    ? `${IMG_ORIG}${movie.backdrop_path}`
    : (movie.poster_path ? `${IMG_W500}${movie.poster_path}` : '');

  document.getElementById('modal-banner').src = bannerPath;
  document.getElementById('modal-banner').alt = movie.title;
  document.getElementById('modal-modal-title').textContent = movie.title;

  const rating     = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
  const year       = movie.release_date ? movie.release_date.slice(0, 4) : '';
  const votes      = movie.vote_count ? `${movie.vote_count.toLocaleString()}명 평가` : '';
  const popularity = movie.popularity ? `인기도 ${Math.round(movie.popularity)}` : '';

  document.getElementById('modal-meta').innerHTML = `
    <span class="modal-score">★ ${rating}</span>
    <span>${year}</span>
    <span>${votes}</span>
    <span>${popularity}</span>
  `;
  document.getElementById('modal-overview').textContent =
    movie.overview || '줄거리 정보가 없습니다.';

  document.getElementById('modal-backdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(event) {
  if (event && event.target !== document.getElementById('modal-backdrop') &&
      event.target !== document.getElementById('modal-close')) return;
  document.getElementById('modal-backdrop').classList.remove('open');
  document.body.style.overflow = '';
}

function scrollRow(rowId, dir) {
  const row = document.getElementById(rowId);
  row.scrollBy({ left: dir * 600, behavior: 'smooth' });
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.getElementById('modal-backdrop').classList.remove('open');
    document.body.style.overflow = '';
  }
});

document.getElementById('search-input').addEventListener('input', function () {
  const q = this.value.trim().toLowerCase();
  const filtered = q
    ? allMovies.filter(m => m.title.toLowerCase().includes(q))
    : allMovies;
  renderCards('now-playing', filtered);
});

async function init() {
  ['now-playing', 'top-rated', 'popular'].forEach(id => renderSkeletons(id));

  try {
    const [nowPlaying, topRated, popular] = await Promise.all([
      fetchMovies('/movie/now_playing'),
      fetchMovies('/movie/top_rated'),
      fetchMovies('/movie/popular'),
    ]);

    allMovies = nowPlaying;

    const heroCandidate = nowPlaying.find(m => m.backdrop_path) || nowPlaying[0];
    if (heroCandidate) setHero(heroCandidate);

    renderCards('now-playing', nowPlaying);
    renderCards('top-rated',   topRated);
    renderCards('popular',     popular);

  } catch (err) {
    console.error(err);
    ['now-playing', 'top-rated', 'popular'].forEach(id => {
      document.getElementById(id).innerHTML =
        '<p style="padding:20px;color:#e50914;">데이터를 불러오지 못했습니다. API 키를 확인해 주세요.</p>';
    });
  }
}

init();
