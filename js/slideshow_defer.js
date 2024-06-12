    console.log("HERE 4");
    if (MANUAL_SLIDESHOW) {
      hidePlayButton();
      slideIndex = 1;
      showPic(slideIndex);
    } else {
      slideIndex = 0;
      slideshow();
    }
