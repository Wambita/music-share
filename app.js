class SerenadeApp {
    constructor() {
        this.youtubePlayer = null;
        this.isPlaying = false;
        this.initEventListeners();
        this.initYouTubeAPI();
        this.checkForSharedSerenade();
    }

    initYouTubeAPI() {
        window.onYouTubeIframeAPIReady = () => {
            console.log('YouTube API is ready');
            this.checkForSharedSerenade();
        };
    }

    initEventListeners() {
        document.getElementById('createSerenade').addEventListener('click', this.createSerenade.bind(this));
        document.getElementById('playButton').addEventListener('click', this.startSerenade.bind(this));
        document.getElementById('surpriseButton').addEventListener('click', this.getSurpriseSong.bind(this));
        document.getElementById('backButton').addEventListener('click', this.goBackToLanding.bind(this));
        
        const copyLinkButton = document.getElementById('copyLinkButton');
        if (copyLinkButton) {
            copyLinkButton.addEventListener('click', this.copyShareLink.bind(this));
        }
    }

    extractYouTubeVideoId(url) {
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    goBackToLanding() {
        // Safely stop the video if the YouTube player exists and has a method to stop
        if (this.youtubePlayer && typeof this.youtubePlayer.stopVideo === 'function') {
            try {
                this.youtubePlayer.stopVideo();
            } catch (error) {
                console.warn('Could not stop video:', error);
            }
        }

        document.querySelector('.serenade-preview').style.display = 'none';
        document.querySelector('.landing-page').style.display = 'block';

        gsap.to('body', {
            background: 'linear-gradient(135deg, var(--pastel-pink), var(--pastel-purple))',
            duration: 1
        });

        const songCover = document.querySelector('.song-cover');
        songCover.style.backgroundImage = 'none';

        const container = document.querySelector('.floating-hearts');
        container.innerHTML = '';
    }

    createSerenade() {
        const recipientName = document.getElementById('recipientName').value;
        const loveMessage = document.getElementById('loveMessage').value;
        const songUrl = document.getElementById('songUrl').value;

        const videoId = this.extractYouTubeVideoId(songUrl);
        if (!videoId) {
            alert('Please enter a valid YouTube video URL');
            return;
        }

        // Generate a unique shareable link
        const serenadeId = uuid.v4();
        const shareLink = `${window.location.origin}?serenade=${serenadeId}`;
        
        // Store serenade details in localStorage
        const serenadeDetails = {
            recipientName,
            loveMessage,
            videoId,
            timestamp: Date.now()
        };
        localStorage.setItem(`serenade_${serenadeId}`, JSON.stringify(serenadeDetails));

        // Display and copy link
        const shareLinkInput = document.getElementById('shareLink');
        shareLinkInput.value = shareLink;
        document.getElementById('shareLinkContainer').style.display = 'flex';
        document.getElementById('shareLinkContainer').style.gap= '10px';

        document.getElementById('previewName').textContent = `A Serenade for ${recipientName}`;
        document.getElementById('previewMessage').textContent = loveMessage;

        document.querySelector('.landing-page').style.display = 'none';
        document.querySelector('.serenade-preview').style.display = 'block';

        this.setupYouTubePlayer(videoId);
        this.setupSongTheme(videoId);
        this.createFloatingHearts();
    }

    copyShareLink() {
        const shareLinkInput = document.getElementById('shareLink');
        shareLinkInput.select();
        document.execCommand('copy');
        alert('Link copied to clipboard!');
    }

    checkForSharedSerenade() {
        const urlParams = new URLSearchParams(window.location.search);
        const serenadeId = urlParams.get('serenade');

        if (serenadeId) {
            const serenadeDetails = JSON.parse(localStorage.getItem(`serenade_${serenadeId}`));
            
            if (serenadeDetails) {
                document.getElementById('app').innerHTML = `
                    <div class="shared-serenade-page">
                        <div class="shared-serenade-background"></div>
                        <div class="floating-hearts"></div>
                        <div class="shared-serenade-content">
                            <h1>A Serenade for ${serenadeDetails.recipientName}</h1>
                            <p class="love-message">"${serenadeDetails.loveMessage}"</p>
                            <div class="shared-player-container">
                                <div id="youtubePlayer"></div>
                            </div>
                            <button id="playButton">Play ❤️</button>
                        </div>
                    </div>
                `;

                const backgroundImage = `https://img.youtube.com/vi/${serenadeDetails.videoId}/maxresdefault.jpg`;
                const backgroundEl = document.querySelector('.shared-serenade-background');
                backgroundEl.style.backgroundImage = `url(${backgroundImage})`;

                this.setupYouTubePlayer(serenadeDetails.videoId);
                this.createFloatingHearts();
            }
        }
    }

    setupYouTubePlayer(videoId) {
        const playerContainer = document.getElementById('youtubePlayer');
        playerContainer.innerHTML = '';

        if (typeof YT !== 'undefined' && YT.Player) {
            this.youtubePlayer = new YT.Player('youtubePlayer', {
                height: '360',
                width: '640',
                videoId: videoId,
                playerVars: {
                    'autoplay': 0,
                    'controls': 1,
                    'modestbranding': 1
                },
                events: {
                    'onReady': (event) => {
                        console.log('YouTube player is ready');
                        this.setupPlayPauseButton();
                    },
                    'onError': (error) => {
                        console.error('YouTube player error:', error);
                    }
                }
            });
        } else {
            console.error('YouTube API not loaded');
        }
    }

    setupPlayPauseButton() {
        const playButton = document.getElementById('playButton');
        if (playButton) {
            playButton.addEventListener('click', () => {
                if (this.youtubePlayer) {
                    if (this.isPlaying) {
                        this.youtubePlayer.pauseVideo();
                        playButton.textContent = 'Play ❤️';
                        this.isPlaying = false;
                    } else {
                        this.youtubePlayer.playVideo();
                        playButton.textContent = 'Pause ❚❚';
                        this.isPlaying = true;
                    }
                }
            });
        }
    }

    setupSongTheme(videoId) {
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        const songCover = document.querySelector('.song-cover');
        songCover.style.backgroundImage = `url(${thumbnailUrl})`;
        
        gsap.to('body', {
            background: 'linear-gradient(135deg, #E0BBE4, #B4D4FF)',
            duration: 1
        });
    }

    createFloatingHearts() {
        const container = document.querySelector('.floating-hearts');
        container.innerHTML = ''; 
        for (let i = 0; i < 30; i++) {
            const heart = document.createElement('div');
            heart.classList.add('heart');
            heart.style.left = `${Math.random() * 100}%`;
            heart.style.animationDelay = `${Math.random() * 5}s`;
            container.appendChild(heart);
        }
    }

    startSerenade() {
        if (this.youtubePlayer) {
            this.youtubePlayer.playVideo();
        }
    }

    getSurpriseSong() {
        const loveSongs = [
            'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 
            'https://www.youtube.com/watch?v=RbmS3tQJ7Os', 
            'https://www.youtube.com/watch?v=V2hxwt9OP1E'  
        ];
        const randomSong = loveSongs[Math.floor(Math.random() * loveSongs.length)];
        document.getElementById('songUrl').value = randomSong;
    }
}

// Fallback method to ensure YouTube API initialization
function onYouTubeIframeAPIReady() {
    // Delay creation to ensure all DOM elements are ready
    setTimeout(() => {
        new SerenadeApp();
    }, 100);
}

// Additional fallback in case the API doesn't load
window.addEventListener('load', () => {
    if (typeof YT === 'undefined') {
        console.warn('YouTube API did not load, attempting manual initialization');
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
    }
});