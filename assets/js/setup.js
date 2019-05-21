myCache = {}
function fromCacheOrFetch(url){
    if (!(url in myCache)) {
        myCache[url] = fetch(url)
            .then(res => res.json());
    } 
    return myCache[url];
}