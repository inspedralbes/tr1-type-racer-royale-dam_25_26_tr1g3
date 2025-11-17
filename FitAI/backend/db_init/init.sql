CREATE TABLE IF NOT EXISTS usuaris (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    
    -- === CAMP AFEGIT ===
    foto_url VARCHAR(255) NULL DEFAULT NULL,
    
    sessions_completades INT DEFAULT 0,
    repeticions_totals INT DEFAULT 0,
    ratxa INT DEFAULT 0,
    ultima_sessio DATE NULL,
    data_registre TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    creador_id INT NOT NULL,
    codi_acces CHAR(6) NULL,
    estat ENUM('esperant', 'en_curs', 'finalitzada') NOT NULL DEFAULT 'esperant',
    data_creacio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creador_id) REFERENCES usuaris(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS participacions (
    usuari_id INT NOT NULL,
    sala_id INT NOT NULL,
    exercici VARCHAR(100) NOT NULL,
    temps_s INT DEFAULT 0,                                              
    repeticions INT DEFAULT 0,
    data_finalitzacio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- === CLAU PRIMÀRIA CORREGIDA ===
    PRIMARY KEY (usuari_id, sala_id, exercici),
    
    FOREIGN KEY (usuari_id) REFERENCES usuaris(id) ON DELETE CASCADE,
    FOREIGN KEY (sala_id) REFERENCES sales(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Els teus INSERTs estan perfectes per començar
-- Inserta usuarios con datos en las nuevas columnas
INSERT INTO usuaris (nom, email, password, sessions_completades, repeticions_totals, ratxa, ultima_sessio, foto_url) 
VALUES 
('nodeuser', 'nodeuser@fit.ai', '$2b$10$6O46vOctyIawTSgRv7kuVO3vkeyWguz7rZvTncDOv6tZJW8dF8Ssy', 25, 15400, 5, '2025-11-16', '/uploads/profiles/default-user-1.png'),
('1', '1@fit.ai', '$2b$10$srE4ojgoCYxoEqlO1Uhqbe4y434PpbM/cxAAh3jwFKKGJ91m6HoRu', 18, 12100, 2, '2025-11-14', NULL),
('TestUser', 'test@user.com', '$2a$10$K.j.7.n1.aC5.wB1.Xf1..O.1g.0.A2.bC3.dE4.fG5.hI6.jK7.', 5, 350, 0, NULL, NULL);

-- Inserta una sala (igual que antes, está perfecto)
INSERT INTO sales (creador_id, codi_acces, estat) VALUES (1, 'FITAI1', 'finalizada');

-- Inserta participaciones
-- Ahora el usuari_id = 1 puede tener dos entradas en la misma sala,
-- porque tienen un 'exercici' diferente (prueba la nueva Primary Key)
INSERT INTO participacions (usuari_id, sala_id, exercici, repeticions)
VALUES
(1, 1, 'sentadillas', 50),
(1, 1, 'flexiones', 25),
(2, 1, 'sentadillas', 45);