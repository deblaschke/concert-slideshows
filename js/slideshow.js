// Indicates manual (true) or automatic (false) slideshow
var MANUAL_SLIDESHOW = false;
// Automatic slideshow interval in milliseconds
var SLIDESHOW_INTERVAL = 3000;
// Indicates audio (true) or no audio (false) during slideshow
var SLIDESHOW_AUDIO = false;

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
    if (SLIDESHOW_INTERVAL > 5000) {
      alert('Specified interval (' + SLIDESHOW_INTERVAL + ') too large, setting to 5000');
      SLIDESHOW_INTERVAL = 5000;
    }
  }
  urlParam = urlParams.get('audio');
  if (urlParam === 'off') {
    SLIDESHOW_AUDIO = false;
  }
}

// playAudio creates and plays audio object where path is audio clip path
function playAudio(path) {
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

  // Play audio object, catching/ignoring any errors
  promise = slideshowSound.play();
  if (promise) {
    promise.catch(function(error) { });
  }
}

// Play default audio if audio clip array not specified
if (SLIDESHOW_AUDIO && typeof(mapSlideToAudio) !== 'object') {
  playAudio("media/audio.mp3");
}

// hidePlayButton hides play/pause button for manual slideshows
function hidePlayButton() {
  document.getElementById("buttonPlayPause").style.display = "none";
}

// toggleFlow plays/pauses slideshow where elem is play/pause button
function toggleFlow(elem) {
  if (slideshowTimeout != null) {
    // Pause slideshow
    clearInterval(slideshowTimeout);
    slideshowTimeout = null;

    // Set button text to ">" (play)
    elem.innerHTML = "&#9658;";

    // Pause audio if it exists
    if (slideshowSound != null) {
      slideshowSound.pause();
    }
  } else {
    // Play slideshow
    slideshow();

    // Set button text to "||" (pause)
    elem.innerHTML = "&#10074;&#10074;";

    // Play audio if it exists
    if (slideshowSound != null) {
      slideshowSound.play();
    }
  }
}

// changePic changes slide index where n is delta (+1 or -1)
function changePic(n) {
  showPic(slideIndex += n);

  if (!MANUAL_SLIDESHOW) {
    // Automatic slideshow

    if (slideshowTimeout != null) {
      clearInterval(slideshowTimeout);
      slideshowTimeout = setInterval(slideshow, SLIDESHOW_INTERVAL);

      // Play audio if it exists
      if (slideshowSound != null) {
        slideshowSound.play();
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

// showPic displays slide where n is slide index
function showPic(n) {
  // Handle wrapping past end of slideshow
  if (n > slideshowElems.length) {slideIndex = 1}

  // Handle wrapping before beginning of slideshow
  if (n < 1) {slideIndex = slideshowElems.length}

  // Set all slides to hidden
  var i;
  for (i = 0; i < slideshowElems.length; i++) {
    slideshowElems[i].style.display = "none";
  }

  // Set current slide to visible
  slideshowElems[slideIndex-1].style.display = "block";

  // Set slide description
  document.getElementById("slideName").innerHTML = getDescription(slideshowElems[slideIndex-1].src);
}

// slideshow begins automatic slideshow
function slideshow() {
  slideIndex++;

  // Handle wrapping past end of slideshow
  if (slideIndex > slideshowElems.length) {slideIndex = 1}

  // Set all slides to hidden
  var i;
  for (i = 0; i < slideshowElems.length; i++) {
    slideshowElems[i].style.display = "none";
  }

  // Set current slide to visible
  slideshowElems[slideIndex-1].style.display = "block";

  // Set slide description
  var slideName = getDescription(slideshowElems[slideIndex-1].src);
  document.getElementById("slideName").innerHTML = slideName;

  // Change audio based on slide name
  if (SLIDESHOW_AUDIO && typeof(mapSlideToAudio) === 'object') {
    // Slide description contains " - " whereas title/credits do not
    var index = slideName.trim().indexOf(' ');
    if (index != -1) {
      // Change audio if slide in mapSlideToAudio
      slideName = slideName.substring(0, index);
      if (mapSlideToAudio.has(slideName)) {
        playAudio(mapSlideToAudio.get(slideName));
      }
    } else if (slideshowSound != null) {
      // Pause audio during title/credits
      slideshowSound.pause();
    }
  }

  // Play slideshow if paused
  if (slideshowTimeout == null) {
    slideshowTimeout = setInterval(slideshow, SLIDESHOW_INTERVAL);
  }
}

// Handle left and right arrow keys
document.onkeydown = function(event) {
  switch (event.key) {
    case 'ArrowLeft':
      changePic(-1);
      break;
    case 'ArrowRight':
      changePic(1);
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
  isMobileDevice = /iPhone|Android|BlackBerry/i.test(navigator.userAgent);
  setPicDimensions();

  // Change audio credit if it exists and audio clip array not specified
  if (typeof(mapSlideToAudio) !== 'object') {
    var audioCredit = slideshowElems[slideshowElems.length-1].src;
    if (audioCredit.indexOf("theend3") != -1) {
      slideshowElems[slideshowElems.length-1].src = audioCredit.replace("theend3", "theend3-audio");
    }
  }
    if (MANUAL_SLIDESHOW) {
      hidePlayButton();
      slideIndex = 1;
      showPic(slideIndex);
    } else {
      slideIndex = 0;
      slideshow();
    }
    console.log("HERE 3");
}

// Handle window resize
window.onresize = function() {
  setPicDimensions();
}

// Handle document readyState attribute change
document.onreadystatechange = function() {
  if (document.readyState === 'complete') {
    console.log("HERE 2");
  }
}
  console.log("HERE 4");
  setPicDimensions();
