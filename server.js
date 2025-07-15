const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// store connected clients and conductor
let clients = {};
let conductorId = null;
const names = ["zugo", "rume", "laku", "pewa", "matu", "kufa", "noka", "lume", "sopa", "daku", "futa", "tuma", "zela", "kuru", "raka", "zalu", "tepa", "lapa", "golu", "sami", "doka", "mika", "telu", "naki", "ruli", "piki", "zori", "kati", "hapu", "molu"]; // Provided name array, ensure unique name per performer
const palette = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'];
const usedNames = new Set();
const usedColors = new Set();

function getRandomName() {
  let available = names.filter(n => !usedNames.has(n));
  if (available.length === 0) return `guest-${Math.floor(Math.random() * 1000)}`;
  let name = available[Math.floor(Math.random() * available.length)];
  usedNames.add(name);
  return name;
}

function getRandomColor() {
  let available = palette.filter(c => !usedColors.has(c));
  if (available.length === 0) {
    usedColors.clear(); // reset if colors run out
    available = palette;
  }
  let color = available[Math.floor(Math.random() * available.length)];
  usedColors.add(color);
  return color;
}

io.on('connection', (socket) => {
  // Ensure unique name and color for each new connection
  let name = getRandomName();
  let color = getRandomColor();
  console.log('user connected:', socket.id);
  
  // initialize at canvas center
  clients[socket.id] = {
    id: socket.id,
    name: name, // assign unique random name
    color: color,
    role: 'performer',
    position: { xNorm: 0.5, yNorm: 0.5 } // use normalized coordinates for cross-device compatibility
  };
  
  // if no conductor, first user can claim it
  if (!conductorId) {
    conductorId = socket.id;
    clients[socket.id].role = 'conductor';
  }
  
  // send client their ID, name, and role
  console.log(`sending init to ${socket.id}: name=${name}, role=${clients[socket.id].role}`);
  socket.emit('init', { id: socket.id, name: name, role: clients[socket.id].role, clients: clients });
  console.log(`assigned: id=${socket.id}, name=${name}, color=${color}, role=${clients[socket.id].role}`);
  console.log('current clients:', clients);
  
  // broadcast new client to others
  io.emit('clientUpdate', clients);
  
  // handle sensor data
  socket.on('sensorData', (data) => {
    if (clients[socket.id]) {
      clients[socket.id].sensorData = { beta: data.beta, gamma: data.gamma };
      io.emit('clientUpdate', clients);
    }
  });
  
  // handle location updates
  socket.on('location', (location) => {
    if (clients[socket.id]) {
      let [, , xNorm, yNorm] = location.split('/');
      clients[socket.id].position = {
        xNorm: parseFloat(xNorm),
        yNorm: parseFloat(yNorm)
      };
      io.emit('clientUpdate', clients);
      console.log(`location update: ${location}`);
    }
  });
  
  // handle conductor instructions
  socket.on('conductorControl', (data) => {
    if (socket.id === conductorId) {
      if (data.target) {
        io.to(data.target).emit('control', data);
      } else {
        io.emit('control', data);
      }
    }
  });
  
  // handle conductor role request
  socket.on('requestConductor', () => {
    if (conductorId !== socket.id) {
      clients[conductorId].role = 'performer';
      conductorId = socket.id;
      clients[socket.id].role = 'conductor';
      io.emit('clientUpdate', clients);
    }
  });
  
  // handle generator commands from conductor
  socket.on('generator', (data) => {
    console.log(`[SERVER] Received generator command from ${socket.id}:`, data);
    
    if (socket.id === conductorId) {
      console.log(`[SERVER] Broadcasting generator command to all clients. Type: ${data.type}`);
      // Add server timestamp to trace command flow
      data.serverTimestamp = Date.now();
      io.emit('generator', data);
    } else {
      console.log(`[SERVER] Rejected generator command: sender ${socket.id} is not the conductor (${conductorId})`);
      socket.emit('error', { message: 'Only conductor can broadcast generator commands' });
    }
  });
  
  // Handle generator acknowledgments from clients
  socket.on('generator_received', (data) => {
    console.log(`[SERVER] Client ${data.id} received generator command`);
    // Forward to conductor so they can see who received the command
    if (conductorId) {
      io.to(conductorId).emit('client_received', { clientId: data.id, type: 'generator' });
    }
  });
  
  // Handle generator played confirmations
  socket.on('generator_played', (data) => {
    console.log(`[SERVER] Client ${data.id} played sound: ${data.success ? 'success' : 'failed'}`);
    // Forward to conductor so they can see who played the sound
    if (conductorId) {
      io.to(conductorId).emit('client_played', { 
        clientId: data.id, 
        success: data.success, 
        error: data.error 
      });
    }
  });
  
  // Handle panic events (immediate stop or fade out)
  socket.on('panic', (data) => {
    console.log(`[SERVER] Received panic ${data.type} from ${socket.id}`);
    
    // Broadcast the panic event to all clients
    const panicData = {
      type: data.type,              // 'stop' or 'fade'
      from: socket.id,             // Who triggered the panic
      timestamp: Date.now(),       // Server timestamp
      duration: data.duration || 0 // Duration for fade (if applicable)
    };
    
    console.log(`[SERVER] Broadcasting panic ${data.type} to all clients`);
    io.emit('panic', panicData);
  });

  // handle disconnection
  socket.on('disconnect', () => {
  // Release name and color back to pool
  if (clients[socket.id]) {
    usedNames.delete(clients[socket.id].name);
    usedColors.delete(clients[socket.id].color);
  }
    console.log('user disconnected:', socket.id);
    if (clients[socket.id]) {
      usedNames.delete(clients[socket.id].name);
      usedColors.delete(clients[socket.id].color);
    }
    delete clients[socket.id];
    if (socket.id === conductorId) {
      conductorId = Object.keys(clients)[0] || null;
      if (conductorId) clients[conductorId].role = 'conductor';
    }
    io.emit('clientUpdate', clients);
  });
});

const PORT = process.env.PORT || 4000;
http.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});