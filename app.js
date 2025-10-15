const entradaUrlServidor = document.getElementById('serverUrl');
const botaoConectar = document.getElementById('connectBtn');
const elementoStatus = document.getElementById('status');
const listaMusicasEl = document.getElementById('songList');

const audioEl = document.getElementById('audio');
const songTitleEl = document.getElementById('song-title');
const artistNameEl = document.getElementById('artist-name');
const playPauseBtn = document.getElementById('play-pause-btn');
const playPauseIcon = playPauseBtn.querySelector('.material-symbols-outlined');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const seekBar = document.getElementById('seek-bar');
const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const volumeBar = document.getElementById('volume-bar');

const menuToggleBtn = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('main-content');
const allSongsBtn = document.getElementById('allSongsBtn');
const favoritesBtn = document.getElementById('favoritesBtn');
const historyBtn = document.getElementById('historyBtn');
const topSongsBtn = document.getElementById('topSongsBtn');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');

let currentSongIndex = -1;
let allSongs = [];
let musicasAtuais = [];
let history = [];
let isConnected = false;
const FAVORITAS_KEY = 'musicasFavoritas';
const TOP_SONGS_KEY = 'topSongsCounts';
let musicasFavoritas = JSON.parse(localStorage.getItem(FAVORITAS_KEY) || '[]');
let topSongsCounts = JSON.parse(localStorage.getItem(TOP_SONGS_KEY) || '{}');

const urlSalva = localStorage.getItem('urlServidor') ?? localStorage.getItem('serverUrl');
if (urlSalva) entradaUrlServidor.value = urlSalva;

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

function juntarUrl(base, relativo) {
  try {
    return new URL(relativo, base).href;
  } catch {
    return base.replace(/\/+$/, '') + '/' + relativo.replace(/^\/+/, '');
  }
}

async function buscarJSON(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return resposta.json();
}

function definirStatus(mensagem) {
  elementoStatus.textContent = mensagem;
}

function salvarFavoritas() {
  localStorage.setItem(FAVORITAS_KEY, JSON.stringify(musicasFavoritas));
}

function salvarTopSongs() {
    localStorage.setItem(TOP_SONGS_KEY, JSON.stringify(topSongsCounts));
}

function alternarFavorita(musica) {
  const index = musicasFavoritas.findIndex(m => m.url === musica.url);
  if (index === -1) {
    musicasFavoritas.push(musica);
  } else {
    musicasFavoritas.splice(index, 1);
  }
  salvarFavoritas();
}

function estaFavoritada(musica) {
  return musicasFavoritas.some(m => m.url === musica.url);
}

async function carregarMusicas(base) {
  definirStatus('Carregando músicas...');
  try {
    const musicas = await buscarJSON(juntarUrl(base, '/api/musicas'));
    allSongs = musicas;
    musicasAtuais = allSongs;
    definirStatus(`${allSongs.length} músicas disponíveis.`);
    renderizarMusicas(musicasAtuais);
    isConnected = true;
  } catch (erro) {
    definirStatus('Falha ao carregar músicas. Verifique a URL e a rede.');
    console.error(erro);
    isConnected = false;
  }
}

function renderizarMusicas(musicas) {
  listaMusicasEl.innerHTML = '';
  if (!musicas.length) {
    listaMusicasEl.innerHTML = '<li>Nenhuma música encontrada.</li>';
    return;
  }

  musicas.forEach((musica) => {
    const li = document.createElement('li');
    
    const blocoMeta = document.createElement('div');
    blocoMeta.className = 'meta';

    const tituloEl = document.createElement('div');
    tituloEl.className = 'title';
    tituloEl.textContent = musica.title || '(Sem título)';
    
    const artistaEl = document.createElement('div');
    artistaEl.className = 'artist';
    artistaEl.textContent = musica.artist || 'Desconhecido';

    blocoMeta.appendChild(tituloEl);
    blocoMeta.appendChild(artistaEl);

    const botoes = document.createElement('div');
    botoes.className = 'song-controls';

    const botaoFavoritar = document.createElement('button');
    botaoFavoritar.className = 'favorite-btn';
    const estrela = document.createElement('span');
    estrela.className = 'material-symbols-outlined';
    estrela.textContent = estaFavoritada(musica) ? 'favorite' : 'favorite_border';
    botaoFavoritar.appendChild(estrela);

    if (estaFavoritada(musica)) {
      botaoFavoritar.classList.add('favorited');
    }

    botaoFavoritar.addEventListener('click', (e) => {
      e.stopPropagation();
      alternarFavorita(musica);
      estrela.textContent = estaFavoritada(musica) ? 'favorite' : 'favorite_border';
      if (estaFavoritada(musica)) {
        botaoFavoritar.classList.add('favorited');
      } else {
        botaoFavoritar.classList.remove('favorited');
      }
    });
    
    const playCount = topSongsCounts[musica.url] || 0;
    const playCountEl = document.createElement('span');
    playCountEl.textContent = `${playCount} tocadas`;
    playCountEl.style.fontSize = '12px';
    playCountEl.style.color = 'var(--sub-text-color)';
    playCountEl.style.marginLeft = '10px';
    botoes.appendChild(playCountEl);

    const botaoTocar = document.createElement('button');
    botaoTocar.className = 'play-btn';
    botaoTocar.textContent = 'Tocar';
    botaoTocar.addEventListener('click', () => tocarMusica(musica));

    botoes.appendChild(botaoFavoritar);
    botoes.appendChild(botaoTocar);
    
    li.appendChild(blocoMeta);
    li.appendChild(botoes);
    listaMusicasEl.appendChild(li);
  });
}

function renderizarFavoritas() {
  renderizarMusicas(musicasFavoritas);
}

function tocarMusica(musica) {
  const url = musica.url?.startsWith('http') ? musica.url : juntarUrl(entradaUrlServidor.value, musica.url);
  audioEl.src = url;
  songTitleEl.textContent = musica.title || '(Sem título)';
  artistNameEl.textContent = musica.artist || 'Desconhecido';
  audioEl.play().catch(console.error);

  const musicaIndex = musicasAtuais.findIndex(m => m.url === musica.url);
  currentSongIndex = musicaIndex;
  
  if (!history.some(h => h.url === musica.url)) {
    history.unshift(musica);
  }
}

audioEl.addEventListener('play', () => {
    playPauseIcon.textContent = 'pause';
    // Incrementa a contagem de reproduções quando a música começa
    if (musicasAtuais[currentSongIndex]) {
        const musicaAtual = musicasAtuais[currentSongIndex];
        const urlKey = musicaAtual.url;
        topSongsCounts[urlKey] = (topSongsCounts[urlKey] || 0) + 1;
        salvarTopSongs();
        renderizarMusicas(musicasAtuais); // Atualiza a lista para mostrar a contagem
    }
});

function renderizarTopSongs() {
    definirStatus('Ordenando músicas mais tocadas...');
    const musicasComContagem = allSongs.map(musica => ({
        ...musica,
        playCount: topSongsCounts[musica.url] || 0
    }));

    // Filtra as músicas para incluir apenas aquelas com mais de 5 reproduções
    const musicasFiltradas = musicasComContagem.filter(musica => musica.playCount > 5);

    const topMusicas = musicasFiltradas.sort((a, b) => b.playCount - a.playCount);
    musicasAtuais = topMusicas;
    renderizarMusicas(musicasAtuais);
    definirStatus(`Top ${topMusicas.length} músicas com mais de 5 reproduções.`);
}

function togglePlayPause() {
  if (audioEl.paused) {
    audioEl.play().catch(console.error);
  } else {
    audioEl.pause();
  }
}

function playNextSong() {
  if (musicasAtuais.length === 0) return;
  currentSongIndex = (currentSongIndex + 1) % musicasAtuais.length;
  tocarMusica(musicasAtuais[currentSongIndex]);
}

function playPrevSong() {
  if (musicasAtuais.length === 0) return;
  currentSongIndex = (currentSongIndex - 1 + musicasAtuais.length) % musicasAtuais.length;
  tocarMusica(musicasAtuais[currentSongIndex]);
}

// Event Listeners
botaoConectar.addEventListener('click', async () => {
  const base = entradaUrlServidor.value.trim().replace(/\/$/, '');
  if (!base) {
    definirStatus('Informe a URL do servidor.');
    return;
  }
  localStorage.setItem('urlServidor', base);
  await carregarMusicas(base);
});

playPauseBtn.addEventListener('click', togglePlayPause);
nextBtn.addEventListener('click', playNextSong);
prevBtn.addEventListener('click', playPrevSong);

audioEl.addEventListener('pause', () => {
  playPauseIcon.textContent = 'play_arrow';
});

audioEl.addEventListener('ended', playNextSong);

audioEl.addEventListener('timeupdate', () => {
  const currentTime = audioEl.currentTime;
  const duration = audioEl.duration;
  if (!isNaN(duration)) {
    const progressPercent = (currentTime / duration) * 100;
    progressBar.style.width = `${progressPercent}%`;
    seekBar.value = progressPercent;
    currentTimeEl.textContent = formatTime(currentTime);
    durationEl.textContent = formatTime(duration);
  }
});

audioEl.addEventListener('loadedmetadata', () => {
  durationEl.textContent = formatTime(audioEl.duration);
});

seekBar.addEventListener('input', () => {
  const newTime = (seekBar.value / 100) * audioEl.duration;
  audioEl.currentTime = newTime;
});

volumeBar.addEventListener('input', () => {
  audioEl.volume = volumeBar.value / 100;
});

// Lógica para abrir/fechar o menu em telas pequenas
menuToggleBtn.addEventListener('click', () => {
  sidebar.classList.add('active');
});

toggleSidebarBtn.addEventListener('click', () => {
  sidebar.classList.remove('active');
});

// Navegação do menu sanduíche
function setActiveLink(link) {
  document.querySelectorAll('.nav-link').forEach(navLink => {
    navLink.classList.remove('active');
  });
  link.classList.add('active');
}

allSongsBtn.addEventListener('click', (e) => {
  e.preventDefault();
  setActiveLink(allSongsBtn);
  if (isConnected) {
    musicasAtuais = allSongs;
    renderizarMusicas(musicasAtuais);
    definirStatus(`${allSongs.length} músicas disponíveis.`);
  } else {
    definirStatus('Por favor, conecte-se a um servidor.');
  }
});

favoritesBtn.addEventListener('click', (e) => {
  e.preventDefault();
  setActiveLink(favoritesBtn);
  musicasAtuais = musicasFavoritas;
  renderizarMusicas(musicasAtuais);
  definirStatus(`${musicasFavoritas.length} músicas favoritas.`);
});

historyBtn.addEventListener('click', (e) => {
  e.preventDefault();
  setActiveLink(historyBtn);
  if (history.length > 0) {
    musicasAtuais = history;
    renderizarMusicas(musicasAtuais);
    definirStatus(`Histórico de ${history.length} músicas.`);
  } else {
    musicasAtuais = [];
    renderizarMusicas([]);
    definirStatus('Nenhuma música foi tocada ainda.');
  }
});

topSongsBtn.addEventListener('click', (e) => {
  e.preventDefault();
  setActiveLink(topSongsBtn);
  if (isConnected) {
    renderizarTopSongs();
  } else {
    definirStatus('Por favor, conecte-se a um servidor.');
  }
});

if (urlSalva) {
    carregarMusicas(urlSalva);
}

window.addEventListener("load", () => {
  const loadingScreen = document.getElementById("loading-screen");
  setTimeout(() => {
    loadingScreen.classList.add("hidden");
  }, 600); // Espera 0.6s para suavizar a transição
});
