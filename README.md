
CONCERT PICTURE SLIDESHOWS README
---------------------------------

To view the slideshows, go to https://deblaschke.github.io/concert-slideshows/
in your favorite browser and select the slideshow of interest by clicking on its
thumbnail, which will enlarge when selectable.  The slideshow will open in a new
tab/window. When the slideshow is complete (there are two standard closing credit
slides at the end) or you've had too much, close the tab/window.

Automatic slideshows have three control buttons below the pictures: previous
slide, pause/play, and next slide.  Manual slideshows only have the previous
slide and next slide buttons.  The left arrow (previous slide), right arrow
(next slide), and escape (pause/play) keys can be used in lieu of the control
buttons.

A rudimentary search capability was added on May 17, 2025.  With it, you can
search for slides by artist (search text) and/or venue.  An exclamation mark (!)
as the first character in the search text indicates negation, i.e. matches all
artists NOT containing the search text.  Searches are case-insensitive and can
include spaces to match multiple words, e.g. "re speed" will match all slides
with "REO Speedwagon" as the artist.

The slideshows have been tested on the following browsers:
- Firefox on Windows and macOS
- Chrome on Windows, macOS and Android (NOTE: Not perfectly responsive on mobile devices)
- Internet Explorer on Windows (NOTE: Might need to allow blocked content)
- Safari on macOS
- Edge on Windows

The following slideshow attibutes can be customized:

   1) Manual/Automatic

      In js/slideshow.js, change MANUAL_SLIDESHOW (default false) to desired
      value

      NOTE: This can be overridden on the URL through use of the mode query
      parameter, for example "?mode=manual"

   2) Interval

      In js/slideshow.js, change SLIDESHOW_INTERVAL (default 3000) to desired
      value in milliseconds

      NOTE: Only applicable if MANUAL_SLIDESHOW is false

      NOTE: This can be overridden on the URL through use of the interval query
      parameter, for example "?interval=1000"

   3) Date

      A specific concert can be set on the URL through use of the date query
      parameter, for example "?date=20241231" will display only pictures from
      12/31/2024

