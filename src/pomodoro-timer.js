import DataroomElement from 'dataroom-js';

class PomodoroTimer extends DataroomElement {
  async initialize(){
    console.log('PomodoroTimer initializing...');
    this.state = 'idle';
    this.sessionCount = 0;
    this.currentGoal = '';
    this.timeRemaining = 0;
    this.timerInterval = null;
    this.isPaused = false;
    this.playlists = [];
    
    // Load playlists in background
    this.loadPlaylists().catch(console.error);
    
    // Render immediately
    this.renderStartScreen();
  }

  async loadPlaylists() {
    try {
      const response = await fetch('./youtube-playlist.csv');
      const text = await response.text();
      const lines = text.split('\n').slice(1);
      this.playlists = lines.filter(line => line.trim()).map(line => line.trim());
      console.log('Loaded playlists:', this.playlists.length);
    } catch (error) {
      console.error('Failed to load playlists:', error);
      this.playlists = [];
    }
  }

  renderStartScreen() {
    console.log('Rendering start screen...');
    this.innerHTML = '';
    
    // Create container
    const container = document.createElement('div');
    container.className = 'pomodoro-container start-screen';
    this.appendChild(container);

    // Logo
    const logoContainer = document.createElement('div');
    logoContainer.className = 'logo-container';
    container.appendChild(logoContainer);
    
    fetch('./logo.svg')
      .then(response => response.text())
      .then(svgContent => logoContainer.innerHTML = svgContent)
      .catch(() => logoContainer.innerHTML = '<div class="logo-placeholder">⚡</div>');

    // Title
    const title = document.createElement('h1');
    title.className = 'main-title';
    title.textContent = 'Pomodoro Timer';
    container.appendChild(title);

    // Session counter
    const counter = document.createElement('div');
    counter.className = 'session-counter';
    counter.textContent = `Sessions Completed: ${this.sessionCount}`;
    container.appendChild(counter);

    // Start button
    const startButton = document.createElement('button');
    startButton.className = 'start-button';
    startButton.textContent = 'Start Pomodoro';
    startButton.addEventListener('click', () => {
      console.log('Start button clicked');
      this.startPomodoroSession();
    });
    container.appendChild(startButton);
    
    console.log('Start screen rendered');
  }

  startPomodoroSession() {
    console.log('Starting Pomodoro session...');
    this.state = 'goal-setting';
    this.timeRemaining = 5 * 60;
    this.renderGoalSettingScreen();
    this.startTimer();
  }

  renderGoalSettingScreen() {
    this.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'pomodoro-container goal-setting-screen';
    this.appendChild(container);

    // Add logo
    const logoContainer = document.createElement('div');
    logoContainer.className = 'logo-container';
    container.appendChild(logoContainer);
    
    fetch('./logo.svg')
      .then(response => response.text())
      .then(svgContent => logoContainer.innerHTML = svgContent)
      .catch(() => logoContainer.innerHTML = '<div class="logo-placeholder">⚡</div>');

    const title = document.createElement('h2');
    title.className = 'phase-title';
    title.textContent = 'Set Our Goal!';
    container.appendChild(title);

    const timer = document.createElement('div');
    timer.className = 'timer-display';
    timer.textContent = this.formatTime(this.timeRemaining);
    container.appendChild(timer);

    const label = document.createElement('label');
    label.className = 'goal-label';
    label.textContent = 'What is our goal?';
    container.appendChild(label);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'goal-input';
    input.placeholder = 'Enter your goal for this session...';
    input.addEventListener('input', (e) => this.currentGoal = e.target.value);
    container.appendChild(input);

    this.renderTimerControls(container);
    setTimeout(() => input.focus(), 100);
  }

  renderDeepWorkScreen() {
    this.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'pomodoro-container deep-work-screen';
    this.appendChild(container);

    // Add logo
    const logoContainer = document.createElement('div');
    logoContainer.className = 'logo-container';
    container.appendChild(logoContainer);
    
    fetch('./logo.svg')
      .then(response => response.text())
      .then(svgContent => logoContainer.innerHTML = svgContent)
      .catch(() => logoContainer.innerHTML = '<div class="logo-placeholder">⚡</div>');

    const title = document.createElement('h2');
    title.className = 'phase-title';
    title.textContent = 'Deep Work';
    container.appendChild(title);

    if (this.currentGoal) {
      const goal = document.createElement('div');
      goal.className = 'goal-display';
      goal.textContent = this.currentGoal;
      container.appendChild(goal);
    }

    const timer = document.createElement('div');
    timer.className = 'timer-display';
    timer.textContent = this.formatTime(this.timeRemaining);
    container.appendChild(timer);

    this.renderTimerControls(container);
  }

  renderRelaxationScreen() {
    this.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'pomodoro-container relaxation-screen';
    this.appendChild(container);

    // Add logo
    const logoContainer = document.createElement('div');
    logoContainer.className = 'logo-container';
    container.appendChild(logoContainer);
    
    fetch('./logo.svg')
      .then(response => response.text())
      .then(svgContent => logoContainer.innerHTML = svgContent)
      .catch(() => logoContainer.innerHTML = '<div class="logo-placeholder">⚡</div>');

    const title = document.createElement('h2');
    title.className = 'phase-title';
    title.textContent = 'Relax!';
    container.appendChild(title);

    const timer = document.createElement('div');
    timer.className = 'timer-display';
    timer.textContent = this.formatTime(this.timeRemaining);
    container.appendChild(timer);
    
    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
    container.appendChild(videoContainer);
    this.loadRandomVideo(videoContainer);
    
    this.renderTimerControls(container);
  }

  loadRandomVideo(container) {
    const playlist = this.getRandomPlaylist();
    if (!playlist) {
      container.innerHTML = '<div class="video-placeholder">Loading relaxation video...</div>';
      return;
    }

    const playlistId = this.extractPlaylistId(playlist);
    if (!playlistId) {
      container.innerHTML = '<div class="video-placeholder">Invalid playlist format</div>';
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/videoseries?list=${playlistId}&autoplay=1&mute=1&controls=1&loop=1`;
    iframe.width = '560';
    iframe.height = '315';
    iframe.frameBorder = '0';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.className = 'youtube-player';
    container.appendChild(iframe);
  }

  getRandomPlaylist() {
    if (this.playlists.length === 0) return null;
    return this.playlists[Math.floor(Math.random() * this.playlists.length)];
  }

  extractPlaylistId(url) {
    const match = url.match(/[?&]list=([^&]+)/);
    return match ? match[1] : null;
  }

  renderTimerControls(parent) {
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'timer-controls';
    parent.appendChild(controlsContainer);

    const pauseButton = document.createElement('button');
    pauseButton.className = 'control-button pause-button';
    pauseButton.textContent = this.isPaused ? 'Resume' : 'Pause';
    pauseButton.addEventListener('click', () => {
      this.togglePause();
      pauseButton.textContent = this.isPaused ? 'Resume' : 'Pause';
    });
    controlsContainer.appendChild(pauseButton);

    const stopButton = document.createElement('button');
    stopButton.className = 'control-button stop-button';
    stopButton.textContent = 'Stop';
    stopButton.addEventListener('click', () => {
      this.stopTimer();
      this.renderStartScreen();
    });
    controlsContainer.appendChild(stopButton);

    const skipButton = document.createElement('button');
    skipButton.className = 'control-button skip-button';
    skipButton.textContent = 'Skip Phase';
    skipButton.addEventListener('click', () => this.skipPhase());
    controlsContainer.appendChild(skipButton);
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (!this.isPaused) {
        this.timeRemaining--;
        this.updateTimerDisplay();
        if (this.timeRemaining <= 0) this.completeCurrentPhase();
      }
    }, 1000);
  }

  updateTimerDisplay() {
    const timerDisplay = this.querySelector('.timer-display');
    if (timerDisplay) timerDisplay.textContent = this.formatTime(this.timeRemaining);
  }

  togglePause() {
    this.isPaused = !this.isPaused;
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.isPaused = false;
    this.state = 'idle';
  }

  skipPhase() {
    this.timeRemaining = 0;
    this.completeCurrentPhase();
  }

  completeCurrentPhase() {
    console.log('Completing phase:', this.state);
    
    // Stop timer but don't reset state yet
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.isPaused = false;
    
    switch (this.state) {
      case 'goal-setting':
        console.log('Moving to deep work phase');
        this.state = 'deep-work';
        this.timeRemaining = 20 * 60;
        this.renderDeepWorkScreen();
        this.startTimer();
        break;
      case 'deep-work':
        console.log('Moving to relaxation phase');
        this.state = 'relaxation';
        this.timeRemaining = 5 * 60;
        this.renderRelaxationScreen();
        this.startTimer();
        break;
      case 'relaxation':
        console.log('Completing pomodoro session');
        this.sessionCount++;
        this.currentGoal = '';
        this.state = 'idle';
        this.renderStartScreen();
        break;
    }
  }

  showPhaseTransition(message, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'phase-transition-overlay';
    
    fetch('/logo.svg')
      .then(response => response.text())
      .then(svgContent => {
        overlay.innerHTML = `
          <div class="transition-content">
            <div class="logo-animation">${svgContent}</div>
            <h2 class="transition-message">${message}</h2>
          </div>
        `;
      })
      .catch(() => {
        overlay.innerHTML = `
          <div class="transition-content">
            <div class="logo-animation">⚡</div>
            <h2 class="transition-message">${message}</h2>
          </div>
        `;
      });
    
    document.body.appendChild(overlay);
    
    setTimeout(() => overlay.classList.add('active'), 100);
    setTimeout(() => {
      overlay.classList.remove('active');
      setTimeout(() => {
        document.body.removeChild(overlay);
        callback();
      }, 500);
    }, 3000);
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

if (!customElements.get('pomodoro-timer')) {
  customElements.define('pomodoro-timer', PomodoroTimer);
}
