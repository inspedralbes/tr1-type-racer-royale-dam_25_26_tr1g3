import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

const sales = {};

io.on("connection", (socket) => {
    console.log("Nou jugador connectat:", socket.id);

    socket.on("crearSala", (callback) => {
        const codiSala = Math.random().toString(36).substring(2, 8).toUpperCase();
        sales[codiSala] = { hostId: socket.id, jugadors: [socket.id] };
        socket.join(codiSala);
        console.log(`Sala creada: ${codiSala}`);
        callback({ success: true, codiSala });
    });

    socket.on("unirSala", (codiSala, callback) => {
        if (!sales[codiSala]) {
            callback({ success: false, message: "Sala no trobada" });
            return;
        }
        if (sales[codiSala].jugadors.length >= 4) {
            callback({ success: false, message: "La sala és plena" });
            return;
        }
        sales[codiSala].jugadors.push(socket.id);
        socket.join(codiSala);
        console.log(`Jugador ${socket.id} s'ha unit a la sala ${codiSala}`);
        callback({ success: true, codiSala });
        io.to(codiSala).emit("jugadorUnit", sales[codiSala].jugadors);
    });

    socket.on("sortirSala", (codiSala) => {
        if (sales[codiSala]) {
            sales[codiSala].jugadors = sales[codiSala].jugadors.filter(id => id !== socket.id);
            io.to(codiSala).emit("jugadorUnit", sales[codiSala].jugadors);
            if (sales[codiSala].jugadors.length === 0) delete sales[codiSala];
            console.log(`Jugador ${socket.id} ha sortit de la sala ${codiSala}`);
        }
    });

    socket.on("disconnect", () => {
        for (const codiSala in sales) {
            sales[codiSala].jugadors = sales[codiSala].jugadors.filter((id) => id !== socket.id);
            io.to(codiSala).emit("jugadorUnit", sales[codiSala].jugadors);
            if (sales[codiSala].jugadors.length === 0) delete sales[codiSala];
        }
        console.log("Jugador desconnectat:", socket.id);
    });
});

server.listen(3001, () => {
    console.log("Servidor en funcionament a http://localhost:3001");
});
