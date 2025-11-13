CREATE TABLE IF NOT EXISTS usuaris (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    sessions_completades INT DEFAULT 0,
    repeticions_totals INT DEFAULT 0,
    data_registre TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    creador_id INT NOT NULL,
    codi_acces CHAR(6) NOT NULL UNIQUE,
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
    PRIMARY KEY (usuari_id, sala_id),
    FOREIGN KEY (usuari_id) REFERENCES usuaris(id) ON DELETE CASCADE,
    FOREIGN KEY (sala_id) REFERENCES sales(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO usuaris (nom, email, password, sessions_completades, repeticions_totals) 
VALUES 
(
    'nodeuser', 
    'nodeuser@fit.ai', 
    '$2b$10$6O46vOctyIawTSgRv7kuVO3vkeyWguz7rZvTncDOv6tZJW8dF8Ssy', -- 'nodepass'
    25, 
    15400
),
(
    '1', 
    '1@fit.ai', 
    '$2b$10$srE4ojgoCYxoEqlO1Uhqbe4y434PpbM/cxAAh3jwFKKGJ91m6HoRu', -- '1'
    18, 
    12100
),
(
    'TestUser', 
    'test@user.com', 
    '$2a$10$K.j.7.n1.aC5.wB1.Xf1..O.1g.0.A2.bC3.dE4.fG5.hI6.jK7.', -- 'password123'
    5, 
    350
);


-- 2. Inserir una SALA de prova
-- Simulem una sala que ja ha estat creada per 'NeoFitMaster' (id=1)
-- I que ja està finalitzada.
INSERT INTO sales (creador_id, codi_acces, estat) 
VALUES 
(
    1,          -- ID de 'NeoFitMaster'
    'FITAI1',   -- Codi d'accés d'exemple
    'finalitzada' -- Estat d'exemple
);


-- 3. Inserir PARTICIPACIONS de prova
-- Simulem les participacions que van tenir lloc a la sala 'FITAI1' (id=1)
-- El 'usuari_id' i 'sala_id' han de coincidir amb els IDs creats a dalt.
-- L'exercici ha de coincidir amb els noms en minúscula (ex: 'sentadillas')
INSERT INTO participacions (usuari_id, sala_id, exercici, repeticions)
VALUES
(
    1,          -- 'NeoFitMaster'
    1,          -- Sala 'FITAI1'
    'sentadillas', -- Nom de l'exercici (com s'envia des del Vue)
    50
),
(
    2,          -- 'CyberLifter'
    1,          -- Sala 'FITAI1'
    'sentadillas',
    45
),
(
    3,          -- 'TestUser'
    1,          -- Sala 'FITAI1'
    'sentadillas',
    30
);