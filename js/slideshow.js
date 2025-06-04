// Indicates manual (true) or automatic (false) slideshow
var MANUAL_SLIDESHOW = false;
// Automatic slideshow interval in milliseconds
var SLIDESHOW_INTERVAL = 3000;
// Indicates audio (true) or no audio (false) during slideshow
var SLIDESHOW_AUDIO = false;
// Indicates concert date (null indicates none)
var SLIDESHOW_DATE = null;

// Current slide index
var slideIndex;
// Timeout object (Number representing timer ID)
var slideshowTimeout = null;
// Sound object (HTMLAudioElement object)
var slideshowSound = null;
// Array of slides with class "concertPix"
var slideshowElems = document.getElementsByClassName("concertPix");
// Indicates if mobile device (if not detected, default behavior occurs which is acceptable)
var isMobileDevice = false;
// Map slide names to audio clips (initialized in slideshow.html)
// var mapSlideToAudio = new Map([]);
// Slide count for current audio clip (pause audio if count goes negative due to user interaction)
var songSlideCount = 0;

// Allow for override of default behavior in URL via query parameters
if ("URLSearchParams" in window) {
  var urlParams = new URLSearchParams(window.location.search);
  var urlParam = urlParams.get('mode');
  if (urlParam === 'manual') {
    MANUAL_SLIDESHOW = true;
  }
  urlParam = urlParams.get('interval');
  if (/^\d+$/.test(urlParam)) {
    SLIDESHOW_INTERVAL = parseInt(urlParam, 10);

    // Audio clips set up for maximum interval of five seconds
    if (SLIDESHOW_AUDIO && SLIDESHOW_INTERVAL > 5000) {
      alert('Specified interval (' + SLIDESHOW_INTERVAL + ') too large, setting to 5000');
      SLIDESHOW_INTERVAL = 5000;
    }
  }
  urlParam = urlParams.get('audio');
  if (urlParam === 'off') {
    SLIDESHOW_AUDIO = false;
  }
  urlParam = urlParams.get('date');
  if (/^\d{8}$/.test(urlParam)) {
    SLIDESHOW_DATE = urlParam;
  }
}

// playAudio creates audio object where path is audio clip path and start indicates whether
// to play clip
function playAudio(path, start) {
  // Pause current audio object if one exists
  if (slideshowSound != null) {
    slideshowSound.pause();
  }

  // Create audio object
  slideshowSound = new Audio(path);

  // Set audio object to loop
  if (typeof slideshowSound.loop == 'boolean') {
    slideshowSound.loop = true;
  } else {
    slideshowSound.addEventListener('ended', function() {
      this.currentTime = 0;
      this.play();
    }, false);
  }

  // Play audio object if indicated, catching/ignoring any errors
  if (start) {
    promise = slideshowSound.play();
    if (promise != null) {
      promise.catch(function(error) { });
    }
  }
}

// reduceSlideshow removes elements from slideshowElems that are not specified date
function reduceSlideshow() {
  // Start at end so that remove() does not affect index
  for (var i = slideshowElems.length - 1; i > -1; i--) {
    var path = slideshowElems[i].src;
    var index = path.lastIndexOf('/');
    if (index >= 0 && path.lastIndexOf('.jpg') > index) {
      var file = path.substring(index + 1, path.lastIndexOf('.'));
      if (/^[0-9]{8}/.test(file) && (!file.startsWith(SLIDESHOW_DATE))) {
        slideshowElems[i].remove();
      }
    }
  }
  SLIDESHOW_DATE = null;
}

// hidePlayButton hides play/pause button for manual slideshows
function hidePlayButton() {
  document.getElementById("buttonPlayPause").style.display = "none";
}

// toggleFlow plays/pauses slideshow as result of user action (mouseclick or keystroke)
// where elem is play/pause button
function toggleFlow(elem) {
  if (slideshowTimeout != null) {
    // Pause slideshow
    clearInterval(slideshowTimeout);
    slideshowTimeout = null;

    // Set button text to ">" (play)
    elem.innerHTML = "&#9658;";
    elem.title = "Play";

    // Pause audio if it exists
    if (slideshowSound != null) {
      slideshowSound.pause();
    }
  } else {
    // Play slideshow
    slideshow();

    // Set button text to "||" (pause)
    elem.innerHTML = "&#10074;&#10074;";
    elem.title = "Pause";

    // Play audio if it exists
    if (slideshowSound != null) {
      slideshowSound.play();
    }
  }
}

// changePic changes slide as result of user action (mouseclick or keystroke)
// where n is delta (+1 or -1)
function changePic(n) {
  showPic(n);

  if (!MANUAL_SLIDESHOW) {
    // Automatic slideshow

    if (slideshowTimeout != null) {
      // Slideshow playing

      // Set new timeout for new slide
      clearInterval(slideshowTimeout);
      slideshowTimeout = setInterval(slideshow, SLIDESHOW_INTERVAL);

      if (slideshowSound != null) {
        // Load silent audio clip and clear song title if user backed up past beginning of song,
        // otherwise play audio
        if (songSlideCount < 0) {
          slideshowSound.pause();
          playAudio("media/silence.mp3", false);
          document.getElementById("slideSong").innerHTML = "&nbsp;";
        } else {
          slideshowSound.play();
        }
      }
    } else {
      // Slideshow paused

      // Load silent audio clip and clear song title if user backed up past beginning of song
      if (songSlideCount < 0) {
        playAudio("media/silence.mp3", false);
        document.getElementById("slideSong").innerHTML = "&nbsp;";
      }
    }
  } else {
    // Manual slideshow

    // Play audio if it exists
    if (slideshowSound != null) {
      slideshowSound.play();
    }
  }
}

// showPic displays slide where n is change to slideIndex
function showPic(n) {
  songSlideCount += n;
  slideIndex += n;

  // Reduce slideshow to specific date (one time only)
  if (SLIDESHOW_DATE != null) reduceSlideshow();

  // Handle wrapping past end of slideshow
  if (slideIndex > slideshowElems.length) {slideIndex = 1}

  // Handle wrapping before beginning of slideshow
  if (slideIndex < 1) {slideIndex = slideshowElems.length}

  // Set all slides to hidden
  for (var i = 0; i < slideshowElems.length; i++) {
    slideshowElems[i].style.display = "none";
  }

  // Set current slide to visible
  slideshowElems[slideIndex-1].style.display = "block";

  // Set slide description
  var description = getDescription(slideshowElems[slideIndex-1].src);
  document.getElementById("slideName").innerHTML = description;

  // Clear song title if slide description empty
  if (description.includes("&nbsp;")) {
    document.getElementById("slideSong").innerHTML = "&nbsp;";
  }

  // Change audio based on slide name
  if (SLIDESHOW_AUDIO && !MANUAL_SLIDESHOW && typeof(mapSlideToAudio) === 'object') {
    // Slide description contains " - " whereas title/credits do not
    var index = description.trim().indexOf(' ');
    if (index != -1) {
      // Change audio if slide in mapSlideToAudio
      var slideName = description.substring(0, index);
      if (mapSlideToAudio.has(slideName)) {
        var mapObj = mapSlideToAudio.get(slideName);
        playAudio(mapObj.file, slideshowTimeout != null);
        document.getElementById("slideSong").innerHTML = "&#9835; \"" + mapObj.title + "\" &#9835;";
        songSlideCount = 0;
      }
    } else if (slideshowSound != null) {
      // Pause audio during title/credits
      slideshowSound.pause();

      // Clear song title during title/credits
      document.getElementById("slideSong").innerHTML = "&nbsp;";
    }
  }
}

// slideshow begins automatic slideshow
function slideshow() {
  showPic(1);

  // Play slideshow if paused
  if (slideshowTimeout == null) {
    slideshowTimeout = setInterval(slideshow, SLIDESHOW_INTERVAL);
  }
}

// Handle left arrow, right arrow and pause keys
document.onkeydown = function(event) {
  switch (event.key) {
    case 'ArrowLeft':
      changePic(-1);
      break;
    case 'ArrowRight':
      changePic(1);
      break;
    case 'Escape':
      if (!MANUAL_SLIDESHOW) {
        toggleFlow(document.getElementById("buttonPlayPause"));
      }
      break;
  }
}

// setPicDimensions sets dimensions of #innerTable based on window dimensions and device type
function setPicDimensions() {
  // Find smallest window dimension
  var minDim = Math.min(window.innerHeight, window.innerWidth);

  // Calculate smallest dimension based on smallest window dimension and device type
  if (minDim > 842 && isMobileDevice) {
    minDim = 842; /* 95% of 842 is 800 (bump up mimimum on mobile because width is large but screen is small) */
  } else if (minDim > 674) {
    minDim = 674; /* 95% of 674 is 640, which is actual slide resolution */
  } else if (minDim < 269) {
    minDim = 269; /* 95% of 269 is 256, which is as small as we want to go */
  }

  // Set innerTable dimensions (a square) to smallest dimension
  document.getElementById("innerTable").style.width = minDim + 'px';
  document.getElementById("innerTable").style.height = minDim + 'px';

  // Set slideName width to smaller than innerTable width
  document.getElementById("slideName").style.width = (minDim-2) + 'px';
}

// Handle window load
window.onload = function() {
  if (SLIDESHOW_AUDIO) {
    if (typeof(mapSlideToAudio) !== 'object' || MANUAL_SLIDESHOW) {
      // Play default audio
      playAudio("media/audio.mp3", true);

      // Change music credit (last slide) if it exists
      var audioCredit = slideshowElems[slideshowElems.length-1].src;
      if (audioCredit.indexOf("theend3") != -1) {
        slideshowElems[slideshowElems.length-1].src = audioCredit.replace("theend3", "theend3-audio");
      }
    }
  } else {
    // Remove music credit (last slide) if it exists
    var audioCredit = slideshowElems[slideshowElems.length-1].src;
    if (audioCredit.indexOf("theend3") != -1) {
      slideshowElems[slideshowElems.length-1].remove();
    }
  }
}

// Handle window resize
window.onresize = function() {
  setPicDimensions();
}

// Handle DOM loaded event
document.addEventListener("DOMContentLoaded", (event) => {
  isMobileDevice = /iPhone|Android|BlackBerry/i.test(navigator.userAgent);
  setPicDimensions();
  slideIndex = 0;

  // Hide song title if unused
  if (MANUAL_SLIDESHOW || !SLIDESHOW_AUDIO) {
    document.getElementById("slideSong").style.display = "none";
  }

  // Initiate slideshow
  if (MANUAL_SLIDESHOW) {
    hidePlayButton();
    showPic(1);
  } else {
    slideshow();
  }
});
