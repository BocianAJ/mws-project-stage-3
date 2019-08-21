/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/sw.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/idb/build/esm/chunk.js":
/*!*********************************************!*\
  !*** ./node_modules/idb/build/esm/chunk.js ***!
  \*********************************************/
/*! exports provided: a, b, c, d, e */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return wrap; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return addTraps; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return instanceOfAny; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return reverseTransformCache; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return unwrap; });
const instanceOfAny = (object, constructors) => constructors.some(c => object instanceof c);

let idbProxyableTypes;
let cursorAdvanceMethods;
// This is a function to prevent it throwing up in node environments.
function getIdbProxyableTypes() {
    return idbProxyableTypes ||
        (idbProxyableTypes = [IDBDatabase, IDBObjectStore, IDBIndex, IDBCursor, IDBTransaction]);
}
// This is a function to prevent it throwing up in node environments.
function getCursorAdvanceMethods() {
    return cursorAdvanceMethods || (cursorAdvanceMethods = [
        IDBCursor.prototype.advance,
        IDBCursor.prototype.continue,
        IDBCursor.prototype.continuePrimaryKey,
    ]);
}
const cursorRequestMap = new WeakMap();
const transactionDoneMap = new WeakMap();
const transactionStoreNamesMap = new WeakMap();
const transformCache = new WeakMap();
const reverseTransformCache = new WeakMap();
function promisifyRequest(request) {
    const promise = new Promise((resolve, reject) => {
        const unlisten = () => {
            request.removeEventListener('success', success);
            request.removeEventListener('error', error);
        };
        const success = () => {
            resolve(wrap(request.result));
            unlisten();
        };
        const error = () => {
            reject(request.error);
            unlisten();
        };
        request.addEventListener('success', success);
        request.addEventListener('error', error);
    });
    promise.then((value) => {
        // Since cursoring reuses the IDBRequest (*sigh*), we cache it for later retrieval
        // (see wrapFunction).
        if (value instanceof IDBCursor) {
            cursorRequestMap.set(value, request);
        }
    });
    // This mapping exists in reverseTransformCache but doesn't doesn't exist in transformCache. This
    // is because we create many promises from a single IDBRequest.
    reverseTransformCache.set(promise, request);
    return promise;
}
function cacheDonePromiseForTransaction(tx) {
    // Early bail if we've already created a done promise for this transaction.
    if (transactionDoneMap.has(tx))
        return;
    const done = new Promise((resolve, reject) => {
        const unlisten = () => {
            tx.removeEventListener('complete', complete);
            tx.removeEventListener('error', error);
            tx.removeEventListener('abort', error);
        };
        const complete = () => {
            resolve();
            unlisten();
        };
        const error = () => {
            reject(tx.error);
            unlisten();
        };
        tx.addEventListener('complete', complete);
        tx.addEventListener('error', error);
        tx.addEventListener('abort', error);
    });
    // Cache it for later retrieval.
    transactionDoneMap.set(tx, done);
}
let idbProxyTraps = {
    get(target, prop, receiver) {
        if (target instanceof IDBTransaction) {
            // Special handling for transaction.done.
            if (prop === 'done')
                return transactionDoneMap.get(target);
            // Polyfill for objectStoreNames because of Edge.
            if (prop === 'objectStoreNames') {
                return target.objectStoreNames || transactionStoreNamesMap.get(target);
            }
            // Make tx.store return the only store in the transaction, or undefined if there are many.
            if (prop === 'store') {
                return receiver.objectStoreNames[1] ?
                    undefined : receiver.objectStore(receiver.objectStoreNames[0]);
            }
        }
        // Else transform whatever we get back.
        return wrap(target[prop]);
    },
    has(target, prop) {
        if (target instanceof IDBTransaction && (prop === 'done' || prop === 'store'))
            return true;
        return prop in target;
    },
};
function addTraps(callback) {
    idbProxyTraps = callback(idbProxyTraps);
}
function wrapFunction(func) {
    // Due to expected object equality (which is enforced by the caching in `wrap`), we
    // only create one new func per func.
    // Edge doesn't support objectStoreNames (booo), so we polyfill it here.
    if (func === IDBDatabase.prototype.transaction &&
        !('objectStoreNames' in IDBTransaction.prototype)) {
        return function (storeNames, ...args) {
            const tx = func.call(unwrap(this), storeNames, ...args);
            transactionStoreNamesMap.set(tx, storeNames.sort ? storeNames.sort() : [storeNames]);
            return wrap(tx);
        };
    }
    // Cursor methods are special, as the behaviour is a little more different to standard IDB. In
    // IDB, you advance the cursor and wait for a new 'success' on the IDBRequest that gave you the
    // cursor. It's kinda like a promise that can resolve with many values. That doesn't make sense
    // with real promises, so each advance methods returns a new promise for the cursor object, or
    // undefined if the end of the cursor has been reached.
    if (getCursorAdvanceMethods().includes(func)) {
        return function (...args) {
            // Calling the original function with the proxy as 'this' causes ILLEGAL INVOCATION, so we use
            // the original object.
            func.apply(unwrap(this), args);
            return wrap(cursorRequestMap.get(this));
        };
    }
    return function (...args) {
        // Calling the original function with the proxy as 'this' causes ILLEGAL INVOCATION, so we use
        // the original object.
        return wrap(func.apply(unwrap(this), args));
    };
}
function transformCachableValue(value) {
    if (typeof value === 'function')
        return wrapFunction(value);
    // This doesn't return, it just creates a 'done' promise for the transaction,
    // which is later returned for transaction.done (see idbObjectHandler).
    if (value instanceof IDBTransaction)
        cacheDonePromiseForTransaction(value);
    if (instanceOfAny(value, getIdbProxyableTypes()))
        return new Proxy(value, idbProxyTraps);
    // Return the same value back if we're not going to transform it.
    return value;
}
function wrap(value) {
    // We sometimes generate multiple promises from a single IDBRequest (eg when cursoring), because
    // IDB is weird and a single IDBRequest can yield many responses, so these can't be cached.
    if (value instanceof IDBRequest)
        return promisifyRequest(value);
    // If we've already transformed this value before, reuse the transformed value.
    // This is faster, but it also provides object equality.
    if (transformCache.has(value))
        return transformCache.get(value);
    const newValue = transformCachableValue(value);
    // Not all types are transformed.
    // These may be primitive types, so they can't be WeakMap keys.
    if (newValue !== value) {
        transformCache.set(value, newValue);
        reverseTransformCache.set(newValue, value);
    }
    return newValue;
}
const unwrap = (value) => reverseTransformCache.get(value);




/***/ }),

/***/ "./node_modules/idb/build/esm/index.js":
/*!*********************************************!*\
  !*** ./node_modules/idb/build/esm/index.js ***!
  \*********************************************/
/*! exports provided: unwrap, wrap, openDB, deleteDB */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "openDB", function() { return openDB; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "deleteDB", function() { return deleteDB; });
/* harmony import */ var _chunk_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./chunk.js */ "./node_modules/idb/build/esm/chunk.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "unwrap", function() { return _chunk_js__WEBPACK_IMPORTED_MODULE_0__["e"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "wrap", function() { return _chunk_js__WEBPACK_IMPORTED_MODULE_0__["a"]; });




/**
 * Open a database.
 *
 * @param name Name of the database.
 * @param version Schema version.
 * @param callbacks Additional callbacks.
 */
function openDB(name, version, { blocked, upgrade, blocking } = {}) {
    const request = indexedDB.open(name, version);
    const openPromise = Object(_chunk_js__WEBPACK_IMPORTED_MODULE_0__["a"])(request);
    if (upgrade) {
        request.addEventListener('upgradeneeded', (event) => {
            upgrade(Object(_chunk_js__WEBPACK_IMPORTED_MODULE_0__["a"])(request.result), event.oldVersion, event.newVersion, Object(_chunk_js__WEBPACK_IMPORTED_MODULE_0__["a"])(request.transaction));
        });
    }
    if (blocked)
        request.addEventListener('blocked', () => blocked());
    if (blocking)
        openPromise.then(db => db.addEventListener('versionchange', blocking));
    return openPromise;
}
/**
 * Delete a database.
 *
 * @param name Name of the database.
 */
function deleteDB(name, { blocked } = {}) {
    const request = indexedDB.deleteDatabase(name);
    if (blocked)
        request.addEventListener('blocked', () => blocked());
    return Object(_chunk_js__WEBPACK_IMPORTED_MODULE_0__["a"])(request).then(() => undefined);
}

const readMethods = ['get', 'getKey', 'getAll', 'getAllKeys', 'count'];
const writeMethods = ['put', 'add', 'delete', 'clear'];
const cachedMethods = new Map();
function getMethod(target, prop) {
    if (!(target instanceof IDBDatabase &&
        !(prop in target) &&
        typeof prop === 'string'))
        return;
    if (cachedMethods.get(prop))
        return cachedMethods.get(prop);
    const targetFuncName = prop.replace(/FromIndex$/, '');
    const useIndex = prop !== targetFuncName;
    const isWrite = writeMethods.includes(targetFuncName);
    if (
    // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
    !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) ||
        !(isWrite || readMethods.includes(targetFuncName)))
        return;
    const method = async function (storeName, ...args) {
        const tx = this.transaction(storeName, isWrite ? 'readwrite' : 'readonly');
        let target = tx.store;
        if (useIndex)
            target = target.index(args.shift());
        const returnVal = target[targetFuncName](...args);
        if (isWrite)
            await tx.done;
        return returnVal;
    };
    cachedMethods.set(prop, method);
    return method;
}
Object(_chunk_js__WEBPACK_IMPORTED_MODULE_0__["b"])(oldTraps => ({
    get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
    has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop),
}));




/***/ }),

/***/ "./src/sw.js":
/*!*******************!*\
  !*** ./src/sw.js ***!
  \*******************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var idb__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! idb */ "./node_modules/idb/build/esm/index.js");





const dbPromise = Object(idb__WEBPACK_IMPORTED_MODULE_0__["openDB"])('restaurants-reviews', 1, {
    upgrade(db, oldVersion, newVersion, transaction) {
        const restaurantsStore = db.createObjectStore('restaurants');
        restaurantsStore
        const reviewsStore = db.createObjectStore('reviews');
    }
});


const staticCacheName = 'restaurant-reviews-v1';
var allCaches = [staticCacheName];

const urlsCached = [
  '.',
  'index.html',
  'restaurant.html',
  'styles/styles.css',
  'styles/leaflet.css',
  'styles/images/layers.png',
  'styles/images/layers-2x.png',
  'styles/images/marker-icon.png',
  'styles/images/marker-icon-2x.png',
  'styles/images/marker-shadow.png',
  'scripts/dbhelper.js',
  'scripts/main.js',
  'scripts/restaurant_info.js',
  'scripts/leaflet-src.js',
  'images/1.jpg',
  'images/2.jpg',
  'images/3.jpg',
  'images/4.jpg',
  'images/5.jpg',
  'images/6.jpg',
  'images/7.jpg',
  'images/8.jpg',
  'images/9.jpg',
  'images/10.jpg',
  'images/icons/icon-192x192.png',
  'images/icons/icon-512x512.png',
  'images/icons/favicon.ico',
  'manifest.json'
];


/* Caching files */

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(staticCacheName).then(function (cache) {
            return cache.addAll(urlsCached);
        })
    );
});

/* Deleting old catches */


self.addEventListener('activate', function (event) {
    event.waitUntil(caches.keys().then(function (cacheNames) {
        return Promise.all(cacheNames.filter(function (cacheName) {
            return cacheName.startsWith('restaurant-reviews-') && !allCaches.includes(cacheName);
        }).map(function (cacheName) {
            return caches['delete'](cacheName);
        }));
    }));
});



/* Fetching cached files */
const idbKeyVal = {
    async get(key) {
        return (await dbPromise).get('restaurants', key);
    },
    async set(key, val) {
        return (await dbPromise).put('restaurants', val, key);
    }
};

function restaurantsDatabase(eventRequest) {
    console.log("aga4: ", eventRequest);
    return idbKeyVal.get('restaurants')
        .then(function (restaurants) {
            return (
                restaurants ||
                fetch(eventRequest)
                .then(function (response) {
                    return response.json()
                })
                .then(function (json) {
                    idbKeyVal.set('restaurants', json);
                    return json;
                })
            );
        })
        .then(function (response) {
            return new Response(JSON.stringify(response))
        })
        .catch(function (error) {
            return new Response(error, {
                status: 404,
                statusText: 'my bad request'
            });
        });
}

self.addEventListener('fetch', function (event) {

    var requestUrl = new URL(event.request.url);

    if (requestUrl.origin === location.origin) {
        if (requestUrl.pathname.startsWith('/restaurant.html')) {
            event.respondWith(caches.match('restaurant.html'));
        }
        /* Fetching cached images */
        if (requestUrl.pathname.startsWith('/images/')) {
            /* Replacing url of compressed images with url of cached full resolution images */
            var imgUrl = requestUrl.pathname.replace(/[0-9]00w-/, '');

            event.respondWith(caches.match(imgUrl));
        } else {
            console.log("event request url:", event, event.request.url);
            event.respondWith(caches.match(event.request).then(function (response) {
                return response || fetch(event.request);
            }).catch(error => console.log("Fetch error: ", error)));
        }
    }

    if (requestUrl.port === '1337') {
        if (requestUrl.pathname.startsWith('/restaurants/')) {
            console.log("port 1337 request");
            const eventRequest = event.request;
            event.respondWith(restaurantsDatabase(eventRequest));
        }
        if (requestUrl.pathname.startsWith('/reviews/')) {
            console.log("request reviews");
        }
        else {
            console.log("Unknown path name: ", requestUrl);
        }
    }
});


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL2lkYi9idWlsZC9lc20vY2h1bmsuanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL2lkYi9idWlsZC9lc20vaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3N3LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGtEQUEwQyxnQ0FBZ0M7QUFDMUU7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxnRUFBd0Qsa0JBQWtCO0FBQzFFO0FBQ0EseURBQWlELGNBQWM7QUFDL0Q7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlEQUF5QyxpQ0FBaUM7QUFDMUUsd0hBQWdILG1CQUFtQixFQUFFO0FBQ3JJO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsbUNBQTJCLDBCQUEwQixFQUFFO0FBQ3ZELHlDQUFpQyxlQUFlO0FBQ2hEO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDhEQUFzRCwrREFBK0Q7O0FBRXJIO0FBQ0E7OztBQUdBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7QUNsRkE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRWlHOzs7Ozs7Ozs7Ozs7O0FDdktqRztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQXNEO0FBQ0Y7O0FBRXBEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0NBQWdDLDZCQUE2QixLQUFLO0FBQ2xFO0FBQ0Esd0JBQXdCLG1EQUFJO0FBQzVCO0FBQ0E7QUFDQSxvQkFBb0IsbURBQUksc0RBQXNELG1EQUFJO0FBQ2xGLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUIsVUFBVSxLQUFLO0FBQ3hDO0FBQ0E7QUFDQTtBQUNBLFdBQVcsbURBQUk7QUFDZjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1EQUFRO0FBQ1I7QUFDQTtBQUNBLENBQUM7O0FBRTJCOzs7Ozs7Ozs7Ozs7O0FDeEU1QjtBQUFBO0FBQWE7O0FBT0E7OztBQUdiLGtCQUFrQixrREFBTTtBQUN4QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQzs7O0FBR0Q7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0EsQ0FBQzs7QUFFRDs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQSxTQUFTO0FBQ1QsS0FBSztBQUNMLENBQUM7Ozs7QUFJRDtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2IsU0FBUztBQUNUOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDIiwiZmlsZSI6InN3LmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZ2V0dGVyIH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuIFx0XHR9XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBjcmVhdGUgYSBmYWtlIG5hbWVzcGFjZSBvYmplY3RcbiBcdC8vIG1vZGUgJiAxOiB2YWx1ZSBpcyBhIG1vZHVsZSBpZCwgcmVxdWlyZSBpdFxuIFx0Ly8gbW9kZSAmIDI6IG1lcmdlIGFsbCBwcm9wZXJ0aWVzIG9mIHZhbHVlIGludG8gdGhlIG5zXG4gXHQvLyBtb2RlICYgNDogcmV0dXJuIHZhbHVlIHdoZW4gYWxyZWFkeSBucyBvYmplY3RcbiBcdC8vIG1vZGUgJiA4fDE6IGJlaGF2ZSBsaWtlIHJlcXVpcmVcbiBcdF9fd2VicGFja19yZXF1aXJlX18udCA9IGZ1bmN0aW9uKHZhbHVlLCBtb2RlKSB7XG4gXHRcdGlmKG1vZGUgJiAxKSB2YWx1ZSA9IF9fd2VicGFja19yZXF1aXJlX18odmFsdWUpO1xuIFx0XHRpZihtb2RlICYgOCkgcmV0dXJuIHZhbHVlO1xuIFx0XHRpZigobW9kZSAmIDQpICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgJiYgdmFsdWUuX19lc01vZHVsZSkgcmV0dXJuIHZhbHVlO1xuIFx0XHR2YXIgbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIobnMpO1xuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobnMsICdkZWZhdWx0JywgeyBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogdmFsdWUgfSk7XG4gXHRcdGlmKG1vZGUgJiAyICYmIHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykgZm9yKHZhciBrZXkgaW4gdmFsdWUpIF9fd2VicGFja19yZXF1aXJlX18uZChucywga2V5LCBmdW5jdGlvbihrZXkpIHsgcmV0dXJuIHZhbHVlW2tleV07IH0uYmluZChudWxsLCBrZXkpKTtcbiBcdFx0cmV0dXJuIG5zO1xuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKF9fd2VicGFja19yZXF1aXJlX18ucyA9IFwiLi9zcmMvc3cuanNcIik7XG4iLCJjb25zdCBpbnN0YW5jZU9mQW55ID0gKG9iamVjdCwgY29uc3RydWN0b3JzKSA9PiBjb25zdHJ1Y3RvcnMuc29tZShjID0+IG9iamVjdCBpbnN0YW5jZW9mIGMpO1xuXG5sZXQgaWRiUHJveHlhYmxlVHlwZXM7XHJcbmxldCBjdXJzb3JBZHZhbmNlTWV0aG9kcztcclxuLy8gVGhpcyBpcyBhIGZ1bmN0aW9uIHRvIHByZXZlbnQgaXQgdGhyb3dpbmcgdXAgaW4gbm9kZSBlbnZpcm9ubWVudHMuXHJcbmZ1bmN0aW9uIGdldElkYlByb3h5YWJsZVR5cGVzKCkge1xyXG4gICAgcmV0dXJuIGlkYlByb3h5YWJsZVR5cGVzIHx8XHJcbiAgICAgICAgKGlkYlByb3h5YWJsZVR5cGVzID0gW0lEQkRhdGFiYXNlLCBJREJPYmplY3RTdG9yZSwgSURCSW5kZXgsIElEQkN1cnNvciwgSURCVHJhbnNhY3Rpb25dKTtcclxufVxyXG4vLyBUaGlzIGlzIGEgZnVuY3Rpb24gdG8gcHJldmVudCBpdCB0aHJvd2luZyB1cCBpbiBub2RlIGVudmlyb25tZW50cy5cclxuZnVuY3Rpb24gZ2V0Q3Vyc29yQWR2YW5jZU1ldGhvZHMoKSB7XHJcbiAgICByZXR1cm4gY3Vyc29yQWR2YW5jZU1ldGhvZHMgfHwgKGN1cnNvckFkdmFuY2VNZXRob2RzID0gW1xyXG4gICAgICAgIElEQkN1cnNvci5wcm90b3R5cGUuYWR2YW5jZSxcclxuICAgICAgICBJREJDdXJzb3IucHJvdG90eXBlLmNvbnRpbnVlLFxyXG4gICAgICAgIElEQkN1cnNvci5wcm90b3R5cGUuY29udGludWVQcmltYXJ5S2V5LFxyXG4gICAgXSk7XHJcbn1cclxuY29uc3QgY3Vyc29yUmVxdWVzdE1hcCA9IG5ldyBXZWFrTWFwKCk7XHJcbmNvbnN0IHRyYW5zYWN0aW9uRG9uZU1hcCA9IG5ldyBXZWFrTWFwKCk7XHJcbmNvbnN0IHRyYW5zYWN0aW9uU3RvcmVOYW1lc01hcCA9IG5ldyBXZWFrTWFwKCk7XHJcbmNvbnN0IHRyYW5zZm9ybUNhY2hlID0gbmV3IFdlYWtNYXAoKTtcclxuY29uc3QgcmV2ZXJzZVRyYW5zZm9ybUNhY2hlID0gbmV3IFdlYWtNYXAoKTtcclxuZnVuY3Rpb24gcHJvbWlzaWZ5UmVxdWVzdChyZXF1ZXN0KSB7XHJcbiAgICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHVubGlzdGVuID0gKCkgPT4ge1xyXG4gICAgICAgICAgICByZXF1ZXN0LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3N1Y2Nlc3MnLCBzdWNjZXNzKTtcclxuICAgICAgICAgICAgcmVxdWVzdC5yZW1vdmVFdmVudExpc3RlbmVyKCdlcnJvcicsIGVycm9yKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIHJlc29sdmUod3JhcChyZXF1ZXN0LnJlc3VsdCkpO1xyXG4gICAgICAgICAgICB1bmxpc3RlbigpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgY29uc3QgZXJyb3IgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIHJlamVjdChyZXF1ZXN0LmVycm9yKTtcclxuICAgICAgICAgICAgdW5saXN0ZW4oKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lcignc3VjY2VzcycsIHN1Y2Nlc3MpO1xyXG4gICAgICAgIHJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCBlcnJvcik7XHJcbiAgICB9KTtcclxuICAgIHByb21pc2UudGhlbigodmFsdWUpID0+IHtcclxuICAgICAgICAvLyBTaW5jZSBjdXJzb3JpbmcgcmV1c2VzIHRoZSBJREJSZXF1ZXN0ICgqc2lnaCopLCB3ZSBjYWNoZSBpdCBmb3IgbGF0ZXIgcmV0cmlldmFsXHJcbiAgICAgICAgLy8gKHNlZSB3cmFwRnVuY3Rpb24pLlxyXG4gICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIElEQkN1cnNvcikge1xyXG4gICAgICAgICAgICBjdXJzb3JSZXF1ZXN0TWFwLnNldCh2YWx1ZSwgcmVxdWVzdCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICAvLyBUaGlzIG1hcHBpbmcgZXhpc3RzIGluIHJldmVyc2VUcmFuc2Zvcm1DYWNoZSBidXQgZG9lc24ndCBkb2Vzbid0IGV4aXN0IGluIHRyYW5zZm9ybUNhY2hlLiBUaGlzXHJcbiAgICAvLyBpcyBiZWNhdXNlIHdlIGNyZWF0ZSBtYW55IHByb21pc2VzIGZyb20gYSBzaW5nbGUgSURCUmVxdWVzdC5cclxuICAgIHJldmVyc2VUcmFuc2Zvcm1DYWNoZS5zZXQocHJvbWlzZSwgcmVxdWVzdCk7XHJcbiAgICByZXR1cm4gcHJvbWlzZTtcclxufVxyXG5mdW5jdGlvbiBjYWNoZURvbmVQcm9taXNlRm9yVHJhbnNhY3Rpb24odHgpIHtcclxuICAgIC8vIEVhcmx5IGJhaWwgaWYgd2UndmUgYWxyZWFkeSBjcmVhdGVkIGEgZG9uZSBwcm9taXNlIGZvciB0aGlzIHRyYW5zYWN0aW9uLlxyXG4gICAgaWYgKHRyYW5zYWN0aW9uRG9uZU1hcC5oYXModHgpKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIGNvbnN0IGRvbmUgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgY29uc3QgdW5saXN0ZW4gPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIHR4LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NvbXBsZXRlJywgY29tcGxldGUpO1xyXG4gICAgICAgICAgICB0eC5yZW1vdmVFdmVudExpc3RlbmVyKCdlcnJvcicsIGVycm9yKTtcclxuICAgICAgICAgICAgdHgucmVtb3ZlRXZlbnRMaXN0ZW5lcignYWJvcnQnLCBlcnJvcik7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBjb25zdCBjb21wbGV0ZSA9ICgpID0+IHtcclxuICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB1bmxpc3RlbigpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgY29uc3QgZXJyb3IgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIHJlamVjdCh0eC5lcnJvcik7XHJcbiAgICAgICAgICAgIHVubGlzdGVuKCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0eC5hZGRFdmVudExpc3RlbmVyKCdjb21wbGV0ZScsIGNvbXBsZXRlKTtcclxuICAgICAgICB0eC5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIGVycm9yKTtcclxuICAgICAgICB0eC5hZGRFdmVudExpc3RlbmVyKCdhYm9ydCcsIGVycm9yKTtcclxuICAgIH0pO1xyXG4gICAgLy8gQ2FjaGUgaXQgZm9yIGxhdGVyIHJldHJpZXZhbC5cclxuICAgIHRyYW5zYWN0aW9uRG9uZU1hcC5zZXQodHgsIGRvbmUpO1xyXG59XHJcbmxldCBpZGJQcm94eVRyYXBzID0ge1xyXG4gICAgZ2V0KHRhcmdldCwgcHJvcCwgcmVjZWl2ZXIpIHtcclxuICAgICAgICBpZiAodGFyZ2V0IGluc3RhbmNlb2YgSURCVHJhbnNhY3Rpb24pIHtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBoYW5kbGluZyBmb3IgdHJhbnNhY3Rpb24uZG9uZS5cclxuICAgICAgICAgICAgaWYgKHByb3AgPT09ICdkb25lJylcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cmFuc2FjdGlvbkRvbmVNYXAuZ2V0KHRhcmdldCk7XHJcbiAgICAgICAgICAgIC8vIFBvbHlmaWxsIGZvciBvYmplY3RTdG9yZU5hbWVzIGJlY2F1c2Ugb2YgRWRnZS5cclxuICAgICAgICAgICAgaWYgKHByb3AgPT09ICdvYmplY3RTdG9yZU5hbWVzJykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRhcmdldC5vYmplY3RTdG9yZU5hbWVzIHx8IHRyYW5zYWN0aW9uU3RvcmVOYW1lc01hcC5nZXQodGFyZ2V0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBNYWtlIHR4LnN0b3JlIHJldHVybiB0aGUgb25seSBzdG9yZSBpbiB0aGUgdHJhbnNhY3Rpb24sIG9yIHVuZGVmaW5lZCBpZiB0aGVyZSBhcmUgbWFueS5cclxuICAgICAgICAgICAgaWYgKHByb3AgPT09ICdzdG9yZScpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZWNlaXZlci5vYmplY3RTdG9yZU5hbWVzWzFdID9cclxuICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQgOiByZWNlaXZlci5vYmplY3RTdG9yZShyZWNlaXZlci5vYmplY3RTdG9yZU5hbWVzWzBdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBFbHNlIHRyYW5zZm9ybSB3aGF0ZXZlciB3ZSBnZXQgYmFjay5cclxuICAgICAgICByZXR1cm4gd3JhcCh0YXJnZXRbcHJvcF0pO1xyXG4gICAgfSxcclxuICAgIGhhcyh0YXJnZXQsIHByb3ApIHtcclxuICAgICAgICBpZiAodGFyZ2V0IGluc3RhbmNlb2YgSURCVHJhbnNhY3Rpb24gJiYgKHByb3AgPT09ICdkb25lJyB8fCBwcm9wID09PSAnc3RvcmUnKSlcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgcmV0dXJuIHByb3AgaW4gdGFyZ2V0O1xyXG4gICAgfSxcclxufTtcclxuZnVuY3Rpb24gYWRkVHJhcHMoY2FsbGJhY2spIHtcclxuICAgIGlkYlByb3h5VHJhcHMgPSBjYWxsYmFjayhpZGJQcm94eVRyYXBzKTtcclxufVxyXG5mdW5jdGlvbiB3cmFwRnVuY3Rpb24oZnVuYykge1xyXG4gICAgLy8gRHVlIHRvIGV4cGVjdGVkIG9iamVjdCBlcXVhbGl0eSAod2hpY2ggaXMgZW5mb3JjZWQgYnkgdGhlIGNhY2hpbmcgaW4gYHdyYXBgKSwgd2VcclxuICAgIC8vIG9ubHkgY3JlYXRlIG9uZSBuZXcgZnVuYyBwZXIgZnVuYy5cclxuICAgIC8vIEVkZ2UgZG9lc24ndCBzdXBwb3J0IG9iamVjdFN0b3JlTmFtZXMgKGJvb28pLCBzbyB3ZSBwb2x5ZmlsbCBpdCBoZXJlLlxyXG4gICAgaWYgKGZ1bmMgPT09IElEQkRhdGFiYXNlLnByb3RvdHlwZS50cmFuc2FjdGlvbiAmJlxyXG4gICAgICAgICEoJ29iamVjdFN0b3JlTmFtZXMnIGluIElEQlRyYW5zYWN0aW9uLnByb3RvdHlwZSkpIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHN0b3JlTmFtZXMsIC4uLmFyZ3MpIHtcclxuICAgICAgICAgICAgY29uc3QgdHggPSBmdW5jLmNhbGwodW53cmFwKHRoaXMpLCBzdG9yZU5hbWVzLCAuLi5hcmdzKTtcclxuICAgICAgICAgICAgdHJhbnNhY3Rpb25TdG9yZU5hbWVzTWFwLnNldCh0eCwgc3RvcmVOYW1lcy5zb3J0ID8gc3RvcmVOYW1lcy5zb3J0KCkgOiBbc3RvcmVOYW1lc10pO1xyXG4gICAgICAgICAgICByZXR1cm4gd3JhcCh0eCk7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIC8vIEN1cnNvciBtZXRob2RzIGFyZSBzcGVjaWFsLCBhcyB0aGUgYmVoYXZpb3VyIGlzIGEgbGl0dGxlIG1vcmUgZGlmZmVyZW50IHRvIHN0YW5kYXJkIElEQi4gSW5cclxuICAgIC8vIElEQiwgeW91IGFkdmFuY2UgdGhlIGN1cnNvciBhbmQgd2FpdCBmb3IgYSBuZXcgJ3N1Y2Nlc3MnIG9uIHRoZSBJREJSZXF1ZXN0IHRoYXQgZ2F2ZSB5b3UgdGhlXHJcbiAgICAvLyBjdXJzb3IuIEl0J3Mga2luZGEgbGlrZSBhIHByb21pc2UgdGhhdCBjYW4gcmVzb2x2ZSB3aXRoIG1hbnkgdmFsdWVzLiBUaGF0IGRvZXNuJ3QgbWFrZSBzZW5zZVxyXG4gICAgLy8gd2l0aCByZWFsIHByb21pc2VzLCBzbyBlYWNoIGFkdmFuY2UgbWV0aG9kcyByZXR1cm5zIGEgbmV3IHByb21pc2UgZm9yIHRoZSBjdXJzb3Igb2JqZWN0LCBvclxyXG4gICAgLy8gdW5kZWZpbmVkIGlmIHRoZSBlbmQgb2YgdGhlIGN1cnNvciBoYXMgYmVlbiByZWFjaGVkLlxyXG4gICAgaWYgKGdldEN1cnNvckFkdmFuY2VNZXRob2RzKCkuaW5jbHVkZXMoZnVuYykpIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcclxuICAgICAgICAgICAgLy8gQ2FsbGluZyB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gd2l0aCB0aGUgcHJveHkgYXMgJ3RoaXMnIGNhdXNlcyBJTExFR0FMIElOVk9DQVRJT04sIHNvIHdlIHVzZVxyXG4gICAgICAgICAgICAvLyB0aGUgb3JpZ2luYWwgb2JqZWN0LlxyXG4gICAgICAgICAgICBmdW5jLmFwcGx5KHVud3JhcCh0aGlzKSwgYXJncyk7XHJcbiAgICAgICAgICAgIHJldHVybiB3cmFwKGN1cnNvclJlcXVlc3RNYXAuZ2V0KHRoaXMpKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzKSB7XHJcbiAgICAgICAgLy8gQ2FsbGluZyB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gd2l0aCB0aGUgcHJveHkgYXMgJ3RoaXMnIGNhdXNlcyBJTExFR0FMIElOVk9DQVRJT04sIHNvIHdlIHVzZVxyXG4gICAgICAgIC8vIHRoZSBvcmlnaW5hbCBvYmplY3QuXHJcbiAgICAgICAgcmV0dXJuIHdyYXAoZnVuYy5hcHBseSh1bndyYXAodGhpcyksIGFyZ3MpKTtcclxuICAgIH07XHJcbn1cclxuZnVuY3Rpb24gdHJhbnNmb3JtQ2FjaGFibGVWYWx1ZSh2YWx1ZSkge1xyXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICByZXR1cm4gd3JhcEZ1bmN0aW9uKHZhbHVlKTtcclxuICAgIC8vIFRoaXMgZG9lc24ndCByZXR1cm4sIGl0IGp1c3QgY3JlYXRlcyBhICdkb25lJyBwcm9taXNlIGZvciB0aGUgdHJhbnNhY3Rpb24sXHJcbiAgICAvLyB3aGljaCBpcyBsYXRlciByZXR1cm5lZCBmb3IgdHJhbnNhY3Rpb24uZG9uZSAoc2VlIGlkYk9iamVjdEhhbmRsZXIpLlxyXG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgSURCVHJhbnNhY3Rpb24pXHJcbiAgICAgICAgY2FjaGVEb25lUHJvbWlzZUZvclRyYW5zYWN0aW9uKHZhbHVlKTtcclxuICAgIGlmIChpbnN0YW5jZU9mQW55KHZhbHVlLCBnZXRJZGJQcm94eWFibGVUeXBlcygpKSlcclxuICAgICAgICByZXR1cm4gbmV3IFByb3h5KHZhbHVlLCBpZGJQcm94eVRyYXBzKTtcclxuICAgIC8vIFJldHVybiB0aGUgc2FtZSB2YWx1ZSBiYWNrIGlmIHdlJ3JlIG5vdCBnb2luZyB0byB0cmFuc2Zvcm0gaXQuXHJcbiAgICByZXR1cm4gdmFsdWU7XHJcbn1cclxuZnVuY3Rpb24gd3JhcCh2YWx1ZSkge1xyXG4gICAgLy8gV2Ugc29tZXRpbWVzIGdlbmVyYXRlIG11bHRpcGxlIHByb21pc2VzIGZyb20gYSBzaW5nbGUgSURCUmVxdWVzdCAoZWcgd2hlbiBjdXJzb3JpbmcpLCBiZWNhdXNlXHJcbiAgICAvLyBJREIgaXMgd2VpcmQgYW5kIGEgc2luZ2xlIElEQlJlcXVlc3QgY2FuIHlpZWxkIG1hbnkgcmVzcG9uc2VzLCBzbyB0aGVzZSBjYW4ndCBiZSBjYWNoZWQuXHJcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBJREJSZXF1ZXN0KVxyXG4gICAgICAgIHJldHVybiBwcm9taXNpZnlSZXF1ZXN0KHZhbHVlKTtcclxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgdHJhbnNmb3JtZWQgdGhpcyB2YWx1ZSBiZWZvcmUsIHJldXNlIHRoZSB0cmFuc2Zvcm1lZCB2YWx1ZS5cclxuICAgIC8vIFRoaXMgaXMgZmFzdGVyLCBidXQgaXQgYWxzbyBwcm92aWRlcyBvYmplY3QgZXF1YWxpdHkuXHJcbiAgICBpZiAodHJhbnNmb3JtQ2FjaGUuaGFzKHZhbHVlKSlcclxuICAgICAgICByZXR1cm4gdHJhbnNmb3JtQ2FjaGUuZ2V0KHZhbHVlKTtcclxuICAgIGNvbnN0IG5ld1ZhbHVlID0gdHJhbnNmb3JtQ2FjaGFibGVWYWx1ZSh2YWx1ZSk7XHJcbiAgICAvLyBOb3QgYWxsIHR5cGVzIGFyZSB0cmFuc2Zvcm1lZC5cclxuICAgIC8vIFRoZXNlIG1heSBiZSBwcmltaXRpdmUgdHlwZXMsIHNvIHRoZXkgY2FuJ3QgYmUgV2Vha01hcCBrZXlzLlxyXG4gICAgaWYgKG5ld1ZhbHVlICE9PSB2YWx1ZSkge1xyXG4gICAgICAgIHRyYW5zZm9ybUNhY2hlLnNldCh2YWx1ZSwgbmV3VmFsdWUpO1xyXG4gICAgICAgIHJldmVyc2VUcmFuc2Zvcm1DYWNoZS5zZXQobmV3VmFsdWUsIHZhbHVlKTtcclxuICAgIH1cclxuICAgIHJldHVybiBuZXdWYWx1ZTtcclxufVxyXG5jb25zdCB1bndyYXAgPSAodmFsdWUpID0+IHJldmVyc2VUcmFuc2Zvcm1DYWNoZS5nZXQodmFsdWUpO1xuXG5leHBvcnQgeyB3cmFwIGFzIGEsIGFkZFRyYXBzIGFzIGIsIGluc3RhbmNlT2ZBbnkgYXMgYywgcmV2ZXJzZVRyYW5zZm9ybUNhY2hlIGFzIGQsIHVud3JhcCBhcyBlIH07XG4iLCJpbXBvcnQgeyBhIGFzIHdyYXAsIGIgYXMgYWRkVHJhcHMgfSBmcm9tICcuL2NodW5rLmpzJztcbmV4cG9ydCB7IGUgYXMgdW53cmFwLCBhIGFzIHdyYXAgfSBmcm9tICcuL2NodW5rLmpzJztcblxuLyoqXHJcbiAqIE9wZW4gYSBkYXRhYmFzZS5cclxuICpcclxuICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgZGF0YWJhc2UuXHJcbiAqIEBwYXJhbSB2ZXJzaW9uIFNjaGVtYSB2ZXJzaW9uLlxyXG4gKiBAcGFyYW0gY2FsbGJhY2tzIEFkZGl0aW9uYWwgY2FsbGJhY2tzLlxyXG4gKi9cclxuZnVuY3Rpb24gb3BlbkRCKG5hbWUsIHZlcnNpb24sIHsgYmxvY2tlZCwgdXBncmFkZSwgYmxvY2tpbmcgfSA9IHt9KSB7XHJcbiAgICBjb25zdCByZXF1ZXN0ID0gaW5kZXhlZERCLm9wZW4obmFtZSwgdmVyc2lvbik7XHJcbiAgICBjb25zdCBvcGVuUHJvbWlzZSA9IHdyYXAocmVxdWVzdCk7XHJcbiAgICBpZiAodXBncmFkZSkge1xyXG4gICAgICAgIHJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lcigndXBncmFkZW5lZWRlZCcsIChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICB1cGdyYWRlKHdyYXAocmVxdWVzdC5yZXN1bHQpLCBldmVudC5vbGRWZXJzaW9uLCBldmVudC5uZXdWZXJzaW9uLCB3cmFwKHJlcXVlc3QudHJhbnNhY3Rpb24pKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGlmIChibG9ja2VkKVxyXG4gICAgICAgIHJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lcignYmxvY2tlZCcsICgpID0+IGJsb2NrZWQoKSk7XHJcbiAgICBpZiAoYmxvY2tpbmcpXHJcbiAgICAgICAgb3BlblByb21pc2UudGhlbihkYiA9PiBkYi5hZGRFdmVudExpc3RlbmVyKCd2ZXJzaW9uY2hhbmdlJywgYmxvY2tpbmcpKTtcclxuICAgIHJldHVybiBvcGVuUHJvbWlzZTtcclxufVxyXG4vKipcclxuICogRGVsZXRlIGEgZGF0YWJhc2UuXHJcbiAqXHJcbiAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIGRhdGFiYXNlLlxyXG4gKi9cclxuZnVuY3Rpb24gZGVsZXRlREIobmFtZSwgeyBibG9ja2VkIH0gPSB7fSkge1xyXG4gICAgY29uc3QgcmVxdWVzdCA9IGluZGV4ZWREQi5kZWxldGVEYXRhYmFzZShuYW1lKTtcclxuICAgIGlmIChibG9ja2VkKVxyXG4gICAgICAgIHJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lcignYmxvY2tlZCcsICgpID0+IGJsb2NrZWQoKSk7XHJcbiAgICByZXR1cm4gd3JhcChyZXF1ZXN0KS50aGVuKCgpID0+IHVuZGVmaW5lZCk7XHJcbn1cblxuY29uc3QgcmVhZE1ldGhvZHMgPSBbJ2dldCcsICdnZXRLZXknLCAnZ2V0QWxsJywgJ2dldEFsbEtleXMnLCAnY291bnQnXTtcclxuY29uc3Qgd3JpdGVNZXRob2RzID0gWydwdXQnLCAnYWRkJywgJ2RlbGV0ZScsICdjbGVhciddO1xyXG5jb25zdCBjYWNoZWRNZXRob2RzID0gbmV3IE1hcCgpO1xyXG5mdW5jdGlvbiBnZXRNZXRob2QodGFyZ2V0LCBwcm9wKSB7XHJcbiAgICBpZiAoISh0YXJnZXQgaW5zdGFuY2VvZiBJREJEYXRhYmFzZSAmJlxyXG4gICAgICAgICEocHJvcCBpbiB0YXJnZXQpICYmXHJcbiAgICAgICAgdHlwZW9mIHByb3AgPT09ICdzdHJpbmcnKSlcclxuICAgICAgICByZXR1cm47XHJcbiAgICBpZiAoY2FjaGVkTWV0aG9kcy5nZXQocHJvcCkpXHJcbiAgICAgICAgcmV0dXJuIGNhY2hlZE1ldGhvZHMuZ2V0KHByb3ApO1xyXG4gICAgY29uc3QgdGFyZ2V0RnVuY05hbWUgPSBwcm9wLnJlcGxhY2UoL0Zyb21JbmRleCQvLCAnJyk7XHJcbiAgICBjb25zdCB1c2VJbmRleCA9IHByb3AgIT09IHRhcmdldEZ1bmNOYW1lO1xyXG4gICAgY29uc3QgaXNXcml0ZSA9IHdyaXRlTWV0aG9kcy5pbmNsdWRlcyh0YXJnZXRGdW5jTmFtZSk7XHJcbiAgICBpZiAoXHJcbiAgICAvLyBCYWlsIGlmIHRoZSB0YXJnZXQgZG9lc24ndCBleGlzdCBvbiB0aGUgdGFyZ2V0LiBFZywgZ2V0QWxsIGlzbid0IGluIEVkZ2UuXHJcbiAgICAhKHRhcmdldEZ1bmNOYW1lIGluICh1c2VJbmRleCA/IElEQkluZGV4IDogSURCT2JqZWN0U3RvcmUpLnByb3RvdHlwZSkgfHxcclxuICAgICAgICAhKGlzV3JpdGUgfHwgcmVhZE1ldGhvZHMuaW5jbHVkZXModGFyZ2V0RnVuY05hbWUpKSlcclxuICAgICAgICByZXR1cm47XHJcbiAgICBjb25zdCBtZXRob2QgPSBhc3luYyBmdW5jdGlvbiAoc3RvcmVOYW1lLCAuLi5hcmdzKSB7XHJcbiAgICAgICAgY29uc3QgdHggPSB0aGlzLnRyYW5zYWN0aW9uKHN0b3JlTmFtZSwgaXNXcml0ZSA/ICdyZWFkd3JpdGUnIDogJ3JlYWRvbmx5Jyk7XHJcbiAgICAgICAgbGV0IHRhcmdldCA9IHR4LnN0b3JlO1xyXG4gICAgICAgIGlmICh1c2VJbmRleClcclxuICAgICAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0LmluZGV4KGFyZ3Muc2hpZnQoKSk7XHJcbiAgICAgICAgY29uc3QgcmV0dXJuVmFsID0gdGFyZ2V0W3RhcmdldEZ1bmNOYW1lXSguLi5hcmdzKTtcclxuICAgICAgICBpZiAoaXNXcml0ZSlcclxuICAgICAgICAgICAgYXdhaXQgdHguZG9uZTtcclxuICAgICAgICByZXR1cm4gcmV0dXJuVmFsO1xyXG4gICAgfTtcclxuICAgIGNhY2hlZE1ldGhvZHMuc2V0KHByb3AsIG1ldGhvZCk7XHJcbiAgICByZXR1cm4gbWV0aG9kO1xyXG59XHJcbmFkZFRyYXBzKG9sZFRyYXBzID0+ICh7XHJcbiAgICBnZXQ6ICh0YXJnZXQsIHByb3AsIHJlY2VpdmVyKSA9PiBnZXRNZXRob2QodGFyZ2V0LCBwcm9wKSB8fCBvbGRUcmFwcy5nZXQodGFyZ2V0LCBwcm9wLCByZWNlaXZlciksXHJcbiAgICBoYXM6ICh0YXJnZXQsIHByb3ApID0+ICEhZ2V0TWV0aG9kKHRhcmdldCwgcHJvcCkgfHwgb2xkVHJhcHMuaGFzKHRhcmdldCwgcHJvcCksXHJcbn0pKTtcblxuZXhwb3J0IHsgb3BlbkRCLCBkZWxldGVEQiB9O1xuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuaW1wb3J0IHtcclxuICAgIG9wZW5EQixcclxuICAgIGRlbGV0ZURCLFxyXG4gICAgd3JhcCxcclxuICAgIHVud3JhcFxyXG59IGZyb20gJ2lkYic7XHJcblxyXG5cclxuY29uc3QgZGJQcm9taXNlID0gb3BlbkRCKCdyZXN0YXVyYW50cy1yZXZpZXdzJywgMSwge1xyXG4gICAgdXBncmFkZShkYiwgb2xkVmVyc2lvbiwgbmV3VmVyc2lvbiwgdHJhbnNhY3Rpb24pIHtcclxuICAgICAgICBjb25zdCByZXN0YXVyYW50c1N0b3JlID0gZGIuY3JlYXRlT2JqZWN0U3RvcmUoJ3Jlc3RhdXJhbnRzJyk7XHJcbiAgICAgICAgcmVzdGF1cmFudHNTdG9yZVxyXG4gICAgICAgIGNvbnN0IHJldmlld3NTdG9yZSA9IGRiLmNyZWF0ZU9iamVjdFN0b3JlKCdyZXZpZXdzJyk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuXHJcbmNvbnN0IHN0YXRpY0NhY2hlTmFtZSA9ICdyZXN0YXVyYW50LXJldmlld3MtdjEnO1xyXG52YXIgYWxsQ2FjaGVzID0gW3N0YXRpY0NhY2hlTmFtZV07XHJcblxyXG5jb25zdCB1cmxzQ2FjaGVkID0gW1xyXG4gICcuJyxcclxuICAnaW5kZXguaHRtbCcsXHJcbiAgJ3Jlc3RhdXJhbnQuaHRtbCcsXHJcbiAgJ3N0eWxlcy9zdHlsZXMuY3NzJyxcclxuICAnc3R5bGVzL2xlYWZsZXQuY3NzJyxcclxuICAnc3R5bGVzL2ltYWdlcy9sYXllcnMucG5nJyxcclxuICAnc3R5bGVzL2ltYWdlcy9sYXllcnMtMngucG5nJyxcclxuICAnc3R5bGVzL2ltYWdlcy9tYXJrZXItaWNvbi5wbmcnLFxyXG4gICdzdHlsZXMvaW1hZ2VzL21hcmtlci1pY29uLTJ4LnBuZycsXHJcbiAgJ3N0eWxlcy9pbWFnZXMvbWFya2VyLXNoYWRvdy5wbmcnLFxyXG4gICdzY3JpcHRzL2RiaGVscGVyLmpzJyxcclxuICAnc2NyaXB0cy9tYWluLmpzJyxcclxuICAnc2NyaXB0cy9yZXN0YXVyYW50X2luZm8uanMnLFxyXG4gICdzY3JpcHRzL2xlYWZsZXQtc3JjLmpzJyxcclxuICAnaW1hZ2VzLzEuanBnJyxcclxuICAnaW1hZ2VzLzIuanBnJyxcclxuICAnaW1hZ2VzLzMuanBnJyxcclxuICAnaW1hZ2VzLzQuanBnJyxcclxuICAnaW1hZ2VzLzUuanBnJyxcclxuICAnaW1hZ2VzLzYuanBnJyxcclxuICAnaW1hZ2VzLzcuanBnJyxcclxuICAnaW1hZ2VzLzguanBnJyxcclxuICAnaW1hZ2VzLzkuanBnJyxcclxuICAnaW1hZ2VzLzEwLmpwZycsXHJcbiAgJ2ltYWdlcy9pY29ucy9pY29uLTE5MngxOTIucG5nJyxcclxuICAnaW1hZ2VzL2ljb25zL2ljb24tNTEyeDUxMi5wbmcnLFxyXG4gICdpbWFnZXMvaWNvbnMvZmF2aWNvbi5pY28nLFxyXG4gICdtYW5pZmVzdC5qc29uJ1xyXG5dO1xyXG5cclxuXHJcbi8qIENhY2hpbmcgZmlsZXMgKi9cclxuXHJcbnNlbGYuYWRkRXZlbnRMaXN0ZW5lcignaW5zdGFsbCcsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgZXZlbnQud2FpdFVudGlsKFxyXG4gICAgICAgIGNhY2hlcy5vcGVuKHN0YXRpY0NhY2hlTmFtZSkudGhlbihmdW5jdGlvbiAoY2FjaGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlLmFkZEFsbCh1cmxzQ2FjaGVkKTtcclxuICAgICAgICB9KVxyXG4gICAgKTtcclxufSk7XHJcblxyXG4vKiBEZWxldGluZyBvbGQgY2F0Y2hlcyAqL1xyXG5cclxuXHJcbnNlbGYuYWRkRXZlbnRMaXN0ZW5lcignYWN0aXZhdGUnLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgIGV2ZW50LndhaXRVbnRpbChjYWNoZXMua2V5cygpLnRoZW4oZnVuY3Rpb24gKGNhY2hlTmFtZXMpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoY2FjaGVOYW1lcy5maWx0ZXIoZnVuY3Rpb24gKGNhY2hlTmFtZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVOYW1lLnN0YXJ0c1dpdGgoJ3Jlc3RhdXJhbnQtcmV2aWV3cy0nKSAmJiAhYWxsQ2FjaGVzLmluY2x1ZGVzKGNhY2hlTmFtZSk7XHJcbiAgICAgICAgfSkubWFwKGZ1bmN0aW9uIChjYWNoZU5hbWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlc1snZGVsZXRlJ10oY2FjaGVOYW1lKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9KSk7XHJcbn0pO1xyXG5cclxuXHJcblxyXG4vKiBGZXRjaGluZyBjYWNoZWQgZmlsZXMgKi9cclxuY29uc3QgaWRiS2V5VmFsID0ge1xyXG4gICAgYXN5bmMgZ2V0KGtleSkge1xyXG4gICAgICAgIHJldHVybiAoYXdhaXQgZGJQcm9taXNlKS5nZXQoJ3Jlc3RhdXJhbnRzJywga2V5KTtcclxuICAgIH0sXHJcbiAgICBhc3luYyBzZXQoa2V5LCB2YWwpIHtcclxuICAgICAgICByZXR1cm4gKGF3YWl0IGRiUHJvbWlzZSkucHV0KCdyZXN0YXVyYW50cycsIHZhbCwga2V5KTtcclxuICAgIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIHJlc3RhdXJhbnRzRGF0YWJhc2UoZXZlbnRSZXF1ZXN0KSB7XHJcbiAgICBjb25zb2xlLmxvZyhcImFnYTQ6IFwiLCBldmVudFJlcXVlc3QpO1xyXG4gICAgcmV0dXJuIGlkYktleVZhbC5nZXQoJ3Jlc3RhdXJhbnRzJylcclxuICAgICAgICAudGhlbihmdW5jdGlvbiAocmVzdGF1cmFudHMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgIHJlc3RhdXJhbnRzIHx8XHJcbiAgICAgICAgICAgICAgICBmZXRjaChldmVudFJlcXVlc3QpXHJcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGpzb24pIHtcclxuICAgICAgICAgICAgICAgICAgICBpZGJLZXlWYWwuc2V0KCdyZXN0YXVyYW50cycsIGpzb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBqc29uO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlKSlcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyb3IpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShlcnJvciwge1xyXG4gICAgICAgICAgICAgICAgc3RhdHVzOiA0MDQsXHJcbiAgICAgICAgICAgICAgICBzdGF0dXNUZXh0OiAnbXkgYmFkIHJlcXVlc3QnXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG59XHJcblxyXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ2ZldGNoJywgZnVuY3Rpb24gKGV2ZW50KSB7XHJcblxyXG4gICAgdmFyIHJlcXVlc3RVcmwgPSBuZXcgVVJMKGV2ZW50LnJlcXVlc3QudXJsKTtcclxuXHJcbiAgICBpZiAocmVxdWVzdFVybC5vcmlnaW4gPT09IGxvY2F0aW9uLm9yaWdpbikge1xyXG4gICAgICAgIGlmIChyZXF1ZXN0VXJsLnBhdGhuYW1lLnN0YXJ0c1dpdGgoJy9yZXN0YXVyYW50Lmh0bWwnKSkge1xyXG4gICAgICAgICAgICBldmVudC5yZXNwb25kV2l0aChjYWNoZXMubWF0Y2goJ3Jlc3RhdXJhbnQuaHRtbCcpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLyogRmV0Y2hpbmcgY2FjaGVkIGltYWdlcyAqL1xyXG4gICAgICAgIGlmIChyZXF1ZXN0VXJsLnBhdGhuYW1lLnN0YXJ0c1dpdGgoJy9pbWFnZXMvJykpIHtcclxuICAgICAgICAgICAgLyogUmVwbGFjaW5nIHVybCBvZiBjb21wcmVzc2VkIGltYWdlcyB3aXRoIHVybCBvZiBjYWNoZWQgZnVsbCByZXNvbHV0aW9uIGltYWdlcyAqL1xyXG4gICAgICAgICAgICB2YXIgaW1nVXJsID0gcmVxdWVzdFVybC5wYXRobmFtZS5yZXBsYWNlKC9bMC05XTAwdy0vLCAnJyk7XHJcblxyXG4gICAgICAgICAgICBldmVudC5yZXNwb25kV2l0aChjYWNoZXMubWF0Y2goaW1nVXJsKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJldmVudCByZXF1ZXN0IHVybDpcIiwgZXZlbnQsIGV2ZW50LnJlcXVlc3QudXJsKTtcclxuICAgICAgICAgICAgZXZlbnQucmVzcG9uZFdpdGgoY2FjaGVzLm1hdGNoKGV2ZW50LnJlcXVlc3QpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UgfHwgZmV0Y2goZXZlbnQucmVxdWVzdCk7XHJcbiAgICAgICAgICAgIH0pLmNhdGNoKGVycm9yID0+IGNvbnNvbGUubG9nKFwiRmV0Y2ggZXJyb3I6IFwiLCBlcnJvcikpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHJlcXVlc3RVcmwucG9ydCA9PT0gJzEzMzcnKSB7XHJcbiAgICAgICAgaWYgKHJlcXVlc3RVcmwucGF0aG5hbWUuc3RhcnRzV2l0aCgnL3Jlc3RhdXJhbnRzLycpKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicG9ydCAxMzM3IHJlcXVlc3RcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IGV2ZW50UmVxdWVzdCA9IGV2ZW50LnJlcXVlc3Q7XHJcbiAgICAgICAgICAgIGV2ZW50LnJlc3BvbmRXaXRoKHJlc3RhdXJhbnRzRGF0YWJhc2UoZXZlbnRSZXF1ZXN0KSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChyZXF1ZXN0VXJsLnBhdGhuYW1lLnN0YXJ0c1dpdGgoJy9yZXZpZXdzLycpKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicmVxdWVzdCByZXZpZXdzXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJVbmtub3duIHBhdGggbmFtZTogXCIsIHJlcXVlc3RVcmwpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSk7XHJcbiJdLCJzb3VyY2VSb290IjoiIn0=