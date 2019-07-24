/**
 * Register Service Worker
 */

if (navigator.serviceWorker) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('sw.js').then(function(registration) {
     console.log('ServiceWorker is registered within scope: ', registration.scope);
     }, function(err) {
       console.log('ServiceWorker registration failed: ', err);
     });
   });
}
