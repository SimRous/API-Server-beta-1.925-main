import * as utilities from "../utilities.js";
import * as serverVariables from "../serverVariables.js";

let RequestsCachesExpirationTime = serverVariables.get("main.repository.CacheExpirationTime");

// Repository file data models cache
global.requestsCaches = [];
global.cachedRequestsCleanerStarted = false;

export default class CachedRequestsManager {
    static add(url, content,ETag = "") {
        if (!cachedRequestsCleanerStarted) {
            cachedRequestsCleanerStarted = true;
            CachedRequestsManager.startCachedRequestCleaner();
        }
        if (url != "") {
            CachedRequestsManager.clear(url); 
            requestsCaches.push({
                url,
                content,
                ETag,
                Expire_Time: utilities.nowInSeconds() + RequestsCachesExpirationTime
            });
            console.log(BgWhite + FgBlue, `[Content of ${url} request has been cached]`);
        }
    }
    static startCachedRequestCleaner() { //DONE
        // periodic cleaning of expired cached repository data
        setInterval(CachedRequestsManager.flushExpired, RequestsCachesExpirationTime * 1000);
        console.log(BgWhite + FgBlue, "[Periodic repositories data caches cleaning process started...]");

    } 
    static clear(url) { //DONE
        if (url != "") {
            let indexToDelete = [];
            let index = 0;
            for (let cache of requestsCaches) {
                if (cache.url == url) indexToDelete.push(index);
                index++;
            }
            utilities.deleteByIndex(requestsCaches, indexToDelete);
        }
    }
    static find(url) { //DONE
        try {
            if (url != "") {
                for (let cache of requestsCaches) {
                    if (cache.url == url) {
                        // renew cache
                        cache.Expire_Time = utilities.nowInSeconds() + RequestsCachesExpirationTime;
                        console.log(BgWhite + FgBlue, `[${cache.url} content retrieved from cache]`);
                        return cache;
                    }
                }
            }
        } catch (error) {
            console.log(BgWhite + FgRed, "[request cache error!]", error);
        }
        return null;
    }
    static flushExpired() { //DONE
        let now = utilities.nowInSeconds();
        for (let cache of requestsCaches) {
            if (cache.Expire_Time <= now) {
                console.log(BgWhite + FgBlue, "Cached file data of " + cache.url + ".json expired");
            }
        }
        requestsCaches = requestsCaches.filter( cache => cache.Expire_Time > now);
    }
    static get(HttpContext){
        let requestCache = CachedRequestsManager.find(HttpContext.req.url);
        if (requestCache != null){
            HttpContext.response.JSON( requestCache.content, requestCache.ETag, true /* from cache */)
            return true
        }
        else
        return false;
    }
}
