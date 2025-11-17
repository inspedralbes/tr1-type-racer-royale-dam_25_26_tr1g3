CREATE TABLE IF NOT EXISTS usuaris (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
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
    PRIMARY KEY (usuari_id, sala_id),
    FOREIGN KEY (usuari_id) REFERENCES usuaris(id) ON DELETE CASCADE,
    FOREIGN KEY (sala_id) REFERENCES sales(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dades d'exemple
INSERT INTO usuaris (nom, email, password, sessions_completades, repeticions_totals) 
VALUES 
('nodeuser', 'nodeuser@fit.ai', '$2b$10$6O46vOctyIawTSgRv7kuVO3vkeyWguz7rZvTncDOv6tZJW8dF8Ssy', 25, 15400), --nodepass
('1', '1@fit.ai', '$2b$10$srE4ojgoCYxoEqlO1Uhqbe4y434PpbM/cxAAh3jwFKKGJ91m6HoRu', 18, 12100), --1
('TestUser', 'test@user.com', '$2a$10$K.j.7.n1.aC5.wB1.Xf1..O.1g.0.A2.bC3.dE4.fG5.hI6.jK7.', 5, 350); --(este no funciona)

INSERT INTO sales (creador_id, codi_acces, estat) VALUES (1, 'FITAI1', 'finalitzada');

INSERT INTO participacions (usuari_id, sala_id, exercici, repeticions)
VALUES
(1, 1, 'sentadillas', 50),
(2, 1, 'sentadillas', 45),
(3, 1, 'sentadillas', 30);