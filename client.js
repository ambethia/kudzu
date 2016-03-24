Typekit.load();
const ws = new WebSocket(location.origin.replace(/^http/, 'ws'));
ws.onmessage = (event) => updatePreview(event.data);
const root = document.querySelector('.root');
let lastHTML = root.innerHTML;

const updatePreview = (newHTML) => {
  root.innerHTML = newHTML;

  // TODO: This is a really janky way of scrolling to the last change.
  // A better option would be to diff the dom nodes and scroll directly
  // to the first changed element itself.
  // Even better, maybe flash a higlight around the changes?
  let diff = findDiff(lastHTML, newHTML);
  let position = diff / newHTML.length;
  if (position > 0);
    // window.scrollTo(0, (document.body.clientHeight * position));

  lastHTML = newHTML;
  shameless();
};

const findDiff = (a, b) => {
  var i = 0;
  while (a.charAt(i) === b.charAt(i))
    if (a.charAt(i++) === '') return -1;
  return i;
}
