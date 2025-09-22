// Global socket.io instance - will be set by the server
let io = null;
export function setSocketIO(server) {
    io = server;
}
export function emitUpdate(event) {
    if (io) {
        console.log(`[Socket.IO] Emitting ${event} to all clients`);
        io.emit(event);
    }
    else {
        console.warn(`[Socket.IO] Cannot emit ${event} - Socket.IO not initialized`);
    }
}
export function emitProductUpdate() {
    emitUpdate('products:update');
}
export function emitServiceUpdate() {
    emitUpdate('services:update');
}
export function emitTestimonialUpdate() {
    emitUpdate('testimonials:update');
}
export function emitBlogUpdate() {
    emitUpdate('blog:update');
}
