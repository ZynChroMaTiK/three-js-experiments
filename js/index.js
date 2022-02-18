(async () => {
  const response = await fetch('https://api.github.com/repos/zynchromatik/three-js-experiments/contents/');
  const data = await response.json();
  let htmlString = '<ul>';
  for (let file of data) {
    if (file.name !== 'index.html' && file.name.split('.').pop() == 'html') {
      htmlString += `<li><a href="${file.path}">${file.name.split(".")[0]}</a></li>`;
    }
  }
  htmlString += '</ul>';
  document.getElementsByTagName('div')[0].innerHTML = htmlString;
})()
