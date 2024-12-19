const express = require('express');
const cors = require('cors');
const app = express();

// Configuración básica
app.use(express.json());

// Configuración de CORS para desarrollo local
app.use(cors({
    origin: ['http://localhost:3000'],
    methods: ['POST', 'GET'],
    credentials: true
}));

// Añadir una ruta GET para la página principal
app.get('/', (req, res) => {
    res.json({ message: 'API funcionando correctamente' });
});

app.post('/transfer', (req, res) => {
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    
    try {
        res.json({ message: 'Transferencia recibida correctamente' });
    } catch (error) {
        console.error('Error en transferencia:', error);
        res.status(400).json({ error: 'Error en la transferencia' });
    }
}); 

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
}); 