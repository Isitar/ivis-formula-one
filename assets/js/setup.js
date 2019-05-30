myCache = {}
function fromCacheOrFetch(url){
    if (!(url in myCache)) {

        myCache[url] = fetchFromLSOrFetch(url);

    } 
    return myCache[url];
}

function fetchFromLSOrFetch(url) {
    result = localStorage.getItem(url);
    if (result === null) {
        return fetch(url)
        .then(res => res.json())
        .then(resJson => { localStorage.setItem(url, JSON.stringify(resJson)); return resJson;});
    } else {
        return new Promise((resolve, reject) => resolve(JSON.parse(result)));
    }
}