let tryCount = 0;
const checkLoaded = (callback) => {
  tryCount++;
  if (tryCount > 600) {
    return;
  }
  if (document.readyState === 'complete') {
    callback();
    return true;
  } else {
    setTimeout(() => {
      checkLoaded(callback);
    }, 100);
  }
};
const domReadyCall = (callback) => {
  checkLoaded(callback);
};

const $ = document.querySelector.bind(document);

export { $, domReadyCall };

