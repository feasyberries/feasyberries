// this seemed a better fetch-with-retry than mine, stolen from:
// https://stackoverflow.com/questions/46175660/fetch-retry-request-on-failure
const fetchRetry = (url, delay, tries, fetchOptions = {}) => {
  function onError(err){
    const triesLeft = tries - 1;
    if(!triesLeft){
      throw err;
    }
    return wait(delay).then(() => fetchRetry(url, delay, triesLeft, fetchOptions));
  }
  return fetch(url,fetchOptions).catch(onError);
}

const wait = (delay) => {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export default fetchRetry;
