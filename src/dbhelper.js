/**
 * IDB
 */
import {
    openDB,
    deleteDB,
    wrap,
    unwrap
} from 'idb';


const dbPromise = openDB('restaurants-reviews', 1, {
    upgrade(db, oldVersion, newVersion, transaction) {
        db.createObjectStore('restaurants', {
            keyPath: 'id',
            unique: true
        });;
        const reviewsStore = db.createObjectStore('reviews', {
            autoIncrement: true
        });
        reviewsStore.createIndex('restaurant_id', 'restaurant_id');
        db.createObjectStore('offline', {
            autoIncrement: true
        });

    }
});

/**
 * IDB helper functions
 */
const idbKeyVal = {
    get(store, key) {
        return dbPromise.then(db => {
            return db
                .transaction(store)
                .objectStore(store)
                .get(key);
        });
    },
    getAll(store) {
        return dbPromise.then(db => {
            return db
                .transaction(store)
                .objectStore(store)
                .getAll();
        });
    },
    set(store, val) {
        return dbPromise.then(db => {
            const tx = db.transaction(store, 'readwrite');
            tx.objectStore(store).put(val);
            return tx.complete;
        });
    },
    setReturnId(store, val) {
        return dbPromise.then(db => {
            const tx = db.transaction(store, 'readwrite');
            const pk = tx
                .objectStore(store)
                .put(val);
            tx.complete;
            return pk;
        });
    }
};

/**
 * Common database helper functions.
 */

class DBHelper {

    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    static get RESTAURANT_DATABASE_URL() {
        const port = 1337 // Change this to your server port
        return `http://localhost:${port}/restaurants/`;
    }

    static get REVIEWS_DATABASE_URL() {
        const port = 1337 // Change this to your server port
        return `http://localhost:${port}/reviews/`;
    }


    /**
     * Fetch all restaurants.
     */
    static fetchRestaurants(callback) {
        return idbKeyVal.getAll('restaurants')
            .then(restaurants => {
                if (restaurants.length) {
                    return restaurants;
                }
                return fetch(DBHelper.RESTAURANT_DATABASE_URL)
                    .then(response => response.json())
                    .then(json => {
                        json.forEach(restaurant => {
                            idbKeyVal.set('restaurants', restaurant);
                        });
                        return json;
                    });
            })
            .then(restaurants => {
                callback(null, restaurants);
            }).catch(error => {
                console.log("fetchRestaurants error", error);
            });
    }

    /**
     * Fetch a restaurant by its ID.
     */

    static fetchRestaurantById(id, callback) {

        // fetch all restaurants with proper error handling.
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                const restaurant = restaurants[id - 1];
                if (restaurant) { // Got the restaurant
                    callback(null, restaurant);
                } else { // Restaurant does not exist in the database
                    callback('Restaurant does not exist', null);
                }
            }
        });
    }

    /**
     * Fetch reviews by restaurant's ID.
     */

    static fetchReviewsById(id, callback) {
        return idbKeyVal.getAll('reviews')
            .then(reviews => {
                if (reviews.length) {
                    return reviews;
                } else {
                    return fetch(`${DBHelper.REVIEWS_DATABASE_URL}?restaurant_id=${id}`)
                        .then(response => response.json())
                        .then(reviews => {
                            reviews.forEach(review => {
                                idbKeyVal.set('reviews', review);
                            });
                            return reviews;
                        })
                }
            })
            .then(reviews => {
                const restaurantReviews = [];
                reviews.forEach(review => {
                    restaurantReviews.push(review);
                });
                callback(null, restaurantReviews);
            })
            .catch(error => {
                console.log('While fetching reviews, the following error accured: ', error);
            });
    }
    /**
     * Add reviews by restaurant's ID.
     */

    static addReview(review) {

        const url = DBHelper.REVIEWS_DATABASE_URL;
        const headers = {
            'Content-Type': 'application/form-data'
        };
        const method = 'POST';
        const data = {
            restaurant_id: parseInt(review.restaurant_id),
            name: review.name,
            rating: parseInt(review.rating),
            comments: review.comments,
            createdAt: new Date()
        };


        var fetch_options = {
            method: method,
            body: JSON.stringify(data),
            headers: headers
        };
        fetch(url, fetch_options)
            .then((response) => {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.indexOf('application/json') !== -1) {
                    return response.json();
                } else {
                    return 'API call successfull'
                }
            })
            .then(review => {
                idbKeyVal.set('reviews', review);
                return review;
            })
            .then(() => {
                const formAlert = document.getElementById('form-alert');
                formAlert.innerHTML = 'Review Added!';
                formAlert.focus();
            })
            .catch(error => {
                DBHelper.createIDBReview(data)
                    .then(review_key => {
                        const request = {
                            url: url,
                            headers: headers,
                            method: method,
                            data: data,
                            review_key: review_key
                        };
                        return idbKeyVal.setReturnId('offline', request)
                            .then(id => {
                                console.log('Saved to IDB: offline', request);
                                return id;
                            });
                    });
            });
    }

    static createIDBReview(review) {
        return idbKeyVal.setReturnId('reviews', review)
            .then(id => {
                console.log('Saved to IDB: reviews', review);
                return id;
            });
    }

    static addOfflineReviews() {
        dbPromise.then(db => {
                if (!db) return;
                const tx = db.transaction(['offline'], 'readwrite');
                const store = tx.objectStore('offline');
                return store.openCursor();
            })
            .then(function followingRequest(cursor) {
                if (!cursor) {
                    return;
                }

                const offline_key = cursor.key;
                const url = cursor.value.url;
                const headers = cursor.value.headers;
                const method = cursor.value.method;
                const data = cursor.value.data;
                const review_key = cursor.value.review_key;
                const body = JSON.stringify(data);

                fetch(url, {
                        headers: headers,
                        method: method,
                        body: body
                    })
                    .then(response => response.json())
                    .then(data => {
                        dbPromise.then(db => {
                                const tx = db.transaction(['offline'], 'readwrite');
                                tx.objectStore('offline').delete(offline_key);
                                return tx.complete;
                            })
                    }).catch(err => {
                        console.log(err);
                        return;
                    });
                return cursor.continue().then(followingRequest);
            })
            .catch(err => console.log('When adding offline reviews the following error accured: ', err));
    }


    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */
    static fetchRestaurantByCuisine(cuisine, callback) {
        // Fetch all restaurants  with proper error handling
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given cuisine type
                const results = restaurants.filter(r => r.cuisine_type == cuisine);
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */
    static fetchRestaurantByNeighborhood(neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given neighborhood
                const results = restaurants.filter(r => r.neighborhood == neighborhood);
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */
    static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                let results = restaurants

                if (cuisine != 'all') { // filter by cuisine
                    results = results.filter(r => r.cuisine_type == cuisine);
                }
                if (neighborhood != 'all') { // filter by neighborhood
                    results = results.filter(r => r.neighborhood == neighborhood);
                }
                callback(null, results);
            }
        });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */
    static fetchNeighborhoods(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all neighborhoods from all restaurants
                const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
                // Remove duplicates from neighborhoods
                const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
                callback(null, uniqueNeighborhoods);
            }
        });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */
    static fetchCuisines(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all cuisines from all restaurants
                const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
                // Remove duplicates from cuisines
                const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
                callback(null, uniqueCuisines);
            }
        });
    }

    /**
     * Restaurant page URL.
     */
    static urlForRestaurant(restaurant) {
        return (`./restaurant.html?id=${restaurant.id}`);
    }

    /**
     * Restaurant image URL.
     */
    static imageUrlForRestaurant(restaurant) {
        return (`/images/${restaurant.id}.jpg`);
    }

    /**
     * Restaurant image srcset attribute.
     */
    static imageUrlSetForRestaurant(restaurant) {
        return (`/images/200w-${restaurant.id}.jpg 200w, /images/400w-${restaurant.id}.jpg 400w, /images/600w-${restaurant.id}.jpg 600w, /images/${restaurant.id}.jpg 800w`);
    }

    /**
     * Map marker for a restaurant.
     */
    static mapMarkerForRestaurant(restaurant, map) {
        // https://leafletjs.com/reference-1.3.0.html#marker  
        const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng], {
            title: restaurant.name,
            alt: restaurant.name,
            url: DBHelper.urlForRestaurant(restaurant)
        })
        marker.addTo(newMap);
        return marker;
    }


    /**
     * Change is_favorite property in a restaurant with specific id
     */

    static removeFav(id) {
        fetch(`${DBHelper.RESTAURANT_DATABASE_URL}${id}/?is_favorite=false`, {
                method: 'PUT'
            })
            .then(response => response.json())
            .then(json => {
                idbKeyVal.set('restaurants', json);
                return json;
            });
    }

    static addFav(id) {
        fetch(`${DBHelper.RESTAURANT_DATABASE_URL}${id}/?is_favorite=true`, {
                method: 'PUT'
            }).then(response => response.json())
            .then(json => {
                idbKeyVal.set('restaurants', json);
                return json;
            });
    }

}

window.DBHelper = DBHelper;
