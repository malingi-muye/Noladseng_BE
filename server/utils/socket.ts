import { Server as SocketIOServer } from 'socket.io';

// Global socket.io instance - will be set by the server
let io: SocketIOServer | null = null;

export function setSocketIO(server: SocketIOServer) {
  io = server;
}

export function emitUpdate(event: string) {
  if (io) {
    console.log(`[Socket.IO] Emitting ${event} to all clients`);
    io.emit(event);
  } else {
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
