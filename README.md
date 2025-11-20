# transversals
Esquema mínim de carpetes pels projectes transversals

És obligatori seguir aquesta estructura tot i que la podeu ampliar.

## Atenció
Un cop comenceu heu de canviar aquesta explicació amb la corresponent al vostre projecte (utilitzant markdown)

# Aquest fitxer ha de contenir com a mínim:
 * Nom dels integrants
 * Nom del projecte
 * Petita descripció
 * Adreça del gestor de tasques (taiga, jira, trello...)
 * Adreça del prototip gràfic del projecte (Penpot, figma, moqups...)
 * URL de producció (quan la tingueu)
 * Estat: (explicació d'en quin punt està)

---

# FitAI G3

### Grup 3

 * Enrique Manuel Cayo Moye
 * Kim Zairyl Galicio Lamar
 * Marc Cara Montes
 * Eric Ruiz Agustín
 * Joel Chica Herrero

### Descripció

FitAI, vol ser una aplicació social per ajudar-te com si fos un entrenador personal a fer els teus exercicis, estiguis on estiguis, ja només necessitarà tecnologies com un TensorFlow lite (el qual té capacitat per treballar amb navegadors), una càmera (per fer un stream de vídeo el qual la IA podrà interpretar). Fent que pugui treballar amb gairebé qualsevol dispositiu mòbil.

### Gestor de Tasques

Podeu accedir al Taiga en [aquest link](https://tree.taiga.io/project/a24kimgalgal-dam_25_26_tr1g3/).

## Prototip Gràfic

Enllaç per accedir al [Prototip Gràfic](https://www.canva.com/design/DAG2-s00H3A/_hehWQAujiWcfr1L6CZdWg/edit).

## URL de Producció

TODO

## Estat

Començant.

---

## Altres enllaços interesants

 * [Enunciat](https://sites.google.com/inspedralbes.cat/tr1dam2025-26/enunciat)
 * [Bitacores](https://docs.google.com/spreadsheets/d/1dAmw4pHsqixxw78n4tTtcN0cRsuXmbkM/edit?gid=1283798028#gid=1283798028)

#  NEXTREP: Type Racer Royale (TR1) Documentation

Aquesta documentació ofereix una visió general completa del sistema **NEXTREP** (originalment TR1 - Type Racer Royale), una aplicació web de fitness que combina detecció de posició mitjançant IA i sessions multijugador competitives en temps real, amb un mode individual on el usuaris mantenen les seves dades i clasificacio.

---

## 0.  Propòsit i Àmbit

NEXTREP és una aplicació basada en navegador que fusiona la **visió per computador** (per a la detecció de posicions i el recompte de repeticions) amb la **comunicació en temps real** i funcions socials. L'objectiu és oferir una experiència d'entrenament interactiva on els usuaris puguin realitzar exercicis en solitari o competir en sessions multijugador, rastrejant estadístiques de rendiment persistents.

---

## 1.  Arquitectura de l'Aplicació

L'aplicació segueix una **arquitectura de tres capes** robusta, amb serveis containeritzats (Docker Compose) que faciliten la separació de responsabilitats entre la presentació, la lògica de negoci i les dades.

### Piles Tecnològiques i Fitxers Clau Detallats

| Capa | Tecnologia | Propòsit | Fitxers / Configuracions Clau |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Vue.js 3** (Composition API) | UI framework | `FitAI/frontend/src/pages/*.vue` |
| | **Vuetify** | Components Material Design | `FitAI.vue`, components `*.vue` |
| | **Pinia** | Gestió de l'estat global | `authStore`, `workoutStore` |
| | **TensorFlow Lite** | Detecció de posició (AI) | Execució al client (browser) |
| **Backend** | **Node.js + Express 5** | Servidor HTTP i API REST | `FitAI/backend/server.js` |
| | **WebSocket** (`ws`) | Comunicació en temps real | `wsServer.js`, `wsHandler.js` |
| | **Sequelize** | ORM per a BBDD | Fitxers de definició de models |
| | **express-session** | Gestió de sessions HTTP | `sessionConfig` |
| | **bcryptjs** | *Hashing* de contrasenyes | `authController` |
| | **multer** | Gestió de pujada d'arxius | Càrrega d'imatges de perfil |
| **Base de Dades** | **MariaDB** | Base de dades relacional | Taules: `usuaris`, `sales`, `participacions` |
| **Infraestructura** | **Docker Compose** | Orquestració de contenidors | `docker-compose.yml` (Ús local) |
| |**nginx** | Reverse proxy + Terminació SSL | `nginx.conf` |
| | **certbot** | Automatització de certificats SSL | Integració Let's Encrypt |

### Protocols de Comunicació

L'aplicació utilitza una estratègia de comunicació dual:
1.  **HTTP/REST:** Per a operacions inicials i persistents (Autenticació, registre, gestió de perfils).
2.  **WebSocket:** Per a la comunicació d'alta freqüència durant l'exercici (actualització de repeticions i *leaderboards* en temps real).

---

## 2.  Esquema de Components

La lògica del sistema es distribueix en mòduls clars, amb una separació entre el codi del client i el del servidor.

### 2.1. Estructura de Directoris

| Directori | Propòsit | Subdirectoris Clau |
| :--- | :--- | :--- |
| `FitAI/frontend/` | Aplicació Vue.js | `src/pages/`, `src/components/`, `src/stores/` |
| `FitAI/backend/` | Servidor Express | `server/routes/`, `server/controllers/`, `server/websocket/` |
| `doc/` | Documentació del Projecte | Diagrames i especificacions |

### 2.2. Flux de Petició (Request Flow Summary)

| Acció d'Usuari | Component Frontend | Endpoint / Missatge WS | Operacions a la BBDD |
| :--- | :--- | :--- | :--- |
| Login | `Login.vue` → `authStore` | `POST /api/login` | Consulta `usuaris` |
| Unir-se a Multijugador | `Multiplayer.vue` | `POST /api/sala/unir` + WS `join` | Consulta i insereix `sales`/`participacions` |
| Realitzar Repetició | `JuegoMultiplayer.vue` (TensorFlow) | WS `update` | Actualització de l'estat de la sessió **en memòria** |
| Finalitzar Sessió | `JuegoMultiplayer.vue` | WS `finish` | Insereix `participacions`, actualitza agregats a `usuaris` |

### 2.3. Gestió de Sessions

NEXTREP implementa una gestió de sessions dual:
* **Sessions HTTP:** Gestionades per `express-session` amb dades emmagatzemades al servidor per a la seguretat de les rutes REST.
* **Sessions WebSocket:** Objectes de sessió mantinguts **en memòria** pel `wsHandler.js` per rastrejar participants i repeticions en temps real, sense dependre de la BBDD durant l'exercici actiu.

### 2.4. Esquema de Base de Dades (MariaDB)

| Taula | Propòsit | Camps Clau (Exemples) |
| :--- | :--- | :--- |
| `usuaris` | Comptes d'usuari i estadístiques globals. | `id`, `email`, `sessions_completades`, `ratxa` |
| `sales` | Sales d'entrenament temporals (solo/multiplayer). | `id`, `creador_id`, `codi_acces`, `estat` |
| `participacions` | Registre històric dels resultats de cada usuari en una sala. | `usuari_id`, `sala_id`, `exercici`, `repeticions`, `temps_s` |

---

## 3.  Diagrama de Docker

L'entorn es defineix mitjançant `docker-compose.yml`, que orquestra els diferents serveis.

### Serveis de Desplegament Local

Aquests són els serveis essencials per a un entorn de desenvolupament local:

| Servei | Tecnologia Base | Port Exposat (Host) | Funció |
| :--- | :--- | :--- | :--- |
| `frontend` | Vue.js Build | Interna (8080) | Servidor client (UI). |
| `backend` | Node.js/Express | 4000 | Servidor d'API i WebSocket. |
| `mariadb` | MariaDB | 3306 | Contenidor de Base de Dades. |

### Serveis d'Infraestructura de Producció

| Servei | Tecnologia Base | Port Exposat (Host) | Funció |
| :--- | :--- | :--- | :--- |
| `nginx` | Reverse Proxy | 80, 443 | Distribueix trànsit, gestiona peticions i terminació SSL. |
| `certbot` | Automatització SSL | N/A | Obté i renova certificats Let's Encrypt. |

Aquest diagrama conceptual il·lustra l'estructura completa de contenidors:


---

## 4.  Explicació del Desplegament en Local

El desplegament local es fa mitjançant Docker Compose, automatitzant la configuració i llançament de tots els components necessaris.

### Requisits

* **Docker**
* **Docker Compose**

### Passos per al Desplegament Local

1.  **Clonar el Repositori:**
    ```bash
    git clone [https://it.wikipedia.org/wiki/Repository](https://it.wikipedia.org/wiki/Repository)
    cd tr1-type-racer-royale
    ```

2.  **Preparar Variables d'Entorn:**
    * Creeu i configureu els fitxers d'entorn (`.env`) necessaris per a la base de dades i els secrets d'Express.

3.  **Llançar els Serveis:**
    * Executeu la següent comanda per construir les imatges i aixecar els contenidors en segon pla:

    ```bash
    docker-compose up -d --build
    ```

4.  **Accés a l'Aplicació:**
    * Un cop els contenidors estiguin en execució, accediu a l'aplicació:
        * **Frontend (UI):** Normalment a `http://localhost:[PORT_FRONTEND]`.
        * **Backend (API/WS):** `http://localhost:4000`.

5.  **Aturar l'Entorn:**
    * Per aturar i eliminar els contenidors (mantenint els volums de dades si no s'especifica):
    ```bash
    docker-compose down
    ```