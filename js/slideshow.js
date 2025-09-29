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

// getDescription returns description for regular slide
function getDescription(path) {
  var result = "";

  // path is of format "*/file.jpg"
  // file is of format "yyyymmdd_picture-description"

  // Process valid paths (must have directory separator and .jpg extension)
  path = decodeURI(path);
  var index = path.lastIndexOf('/');
  if (index >= 0 && path.lastIndexOf('.jpg') > index) {
    var file = path.substring(index + 1, path.lastIndexOf('.'));

    // File begins with "yyyymmdd_" for slides
    if (/^[0-9]{8}[_T]{1}/.test(file)) {
      var date = file.substring(0, 8);

      if (/^[0-9]{8}_[C-Z]{1}[0-9]{7}/.test(file)) {
        // Found digital camera picture name ("yyyymmdd_Annnnnnn")
        result = file.substring(9, 17);
        index = 17;
      } else if (/^[0-9]{8}T[0-9]{6}/.test(file)) {
        // Found cell phone camera picture name ("yyyymmddTnnnnnn")
        result = file.substring(0, 8) + file.substring(9, 15);
        index = 15;
      }

      // Continue processing if recognized picture name
      if (result.length > 0) {
        // Handle description if present
        index = file.indexOf('-', index);
        if (index >= 0) {
          // Picture description is everything after "-"
          var desc = file.substring(index + 1);

          // Replace underscores with spaces
          result = result + " - " + desc.replace(/_/g, ' ');

          // Replace at sign with English
          result = result.replace(/@/g, " at ");

          // Replace special characters ("[*]") with HTML entity names ("&*;")
          index = file.indexOf('[');
          if (index >= 0 && index < file.indexOf(']')) {
            result = result.replace(/\[/g, '&');
            result = result.replace(/\]/g, ';');
          }
        }

        // Add date on separate line
        result = result + "<BR>("
                   + ["January","February","March","April","May","June","July","August","September","October","November","December"].at(date.substring(4, 6) - 1) + " "
                   + (date.charAt(6) == '0' ? date.charAt(7) : date.substring(6, 8)) + ", "
                   + date.substring(0, 4) + ")";
      }
    }
  }

  // Display space to occupy slideName span if description empty
  if (result.length == 0) {
    result = "&nbsp;<BR>&nbsp;";
  }

  return result;
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
          slideshowSound.play();
      }
    } else {
      // Slideshow paused, nothing to do
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

  // Change audio and song title if different from currently-playing clip
  // NOTE: Audio source is set in image element by slideshowSearch() in SEARCH\by-search.html - the
  // deb_audio property is NOT part of the standard definition
  if (SLIDESHOW_AUDIO && (slideshowSound == null || !slideshowSound.src.endsWith(slideshowElems[slideIndex-1].deb_audio))) {
    playAudio("media/" + slideshowElems[slideIndex-1].deb_audio, slideshowTimeout != null);
    document.getElementById("slideSong").innerHTML = slideshowElems[slideIndex-1].alt == "Slide"
      ? "&#9835; \"" +  mapAudioToName.get(slideshowElems[slideIndex-1].deb_audio) + "\" &#9835;"
      : "&nbsp;";
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
  // Don't do anything if search page
  if (window.location.pathname.includes("SEARCH")) return;

  if (!SLIDESHOW_AUDIO) {
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

  // Initiate slideshow if not search page
  if (!window.location.pathname.includes("SEARCH")) {
    if (MANUAL_SLIDESHOW) {
      hidePlayButton();
      showPic(1);
    } else {
      slideshow();
    }
  }
});
