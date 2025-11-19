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


#  FitAI/NEXTREP: Type Racer Royale (TR1) Documentation

Aquesta documentació ofereix una visió general d'alt nivell de l'aplicació **FitAI** (originalment TR1 - Type Racer Royale), un sistema web de seguiment de fitness basat en IA que combina detecció de posició i sessions multijugador competitives.

---

## 1.  Arquitectura de l'Aplicació

L'aplicació FitAI segueix una **arquitectura de tres capes** (Three-Tier Architecture) dissenyada per a la separació de responsabilitats i l'escalabilitat. El sistema es basa en un enfocament de microserveis (containeritzats amb Docker) que es comuniquen mitjançant protocols HTTP/REST i WebSocket.

### Piles Tecnològiques Clau

| Capa | Tecnologia | Propòsit |
| :--- | :--- | :--- |
| **Frontend** | **Vue.js 3** (Composition API), **Vuetify** | Interfície d'Usuari (UI/UX) i lògica de presentació. |
| | **Pinia** | Gestió de l'estat global del client. |
| | **TensorFlow Lite** | Detecció de posició (*Pose Detection*) executada al navegador per comptar repeticions. |
| **Backend** | **Node.js** + **Express 5** | Servidor per a la lògica de negoci, autenticació i API REST. |
| | **WebSocket** (`ws`) | Comunicació **en temps real** per a les actualitzacions de sessions multijugador. |
| | **Sequelize** (ORM) | Abstracció i gestió de la Base de Dades. |
| **Base de Dades** | **MariaDB** | Emmagatzematge persistent de dades d'usuaris i resultats de sessions. |

### Flux de Comunicació

L'aplicació utilitza dos canals de comunicació:
* **HTTP/REST:** Per a operacions de gestió de recursos (autenticació, registre, creació de sales, dades d'usuari).
* **WebSocket:** Per a la comunicació d'alta freqüència durant les sessions d'entrenament (enviament de repeticions, actualitzacions del *leaderboard*).

---

## 2.  Esquema de Components

La lògica de l'aplicació es distribueix entre components de la UI, *stores* de gestió d'estat i controladors del servidor, interconnectats per gestionar les dades en temps real i les operacions persistents.

### Components Clau i Interacció

| Component | Responsabilitat | Interaccions Principals |
| :--- | :--- | :--- |
| **Pàgines/Components Vue** | Interacció amb l'usuari i captura de dades. | Es comunica amb les Stores de Pinia i executa TensorFlow Lite. |
| **Pinia Stores** | Manteniment de l'estat del client (sessió, estat de l'exercici). | Fa crides als *endpoints* de l'API REST i gestiona la connexió WebSocket. |
| **Controladors Backend** | Processament de peticions REST i lògica de negoci. | Interactua amb la capa ORM (Sequelize) per a les operacions BBDD. |
| **WebSocket Handler** | Gestió de l'estat en memòria de les sales d'exercici actives. | Envia missatges de *broadcast* a tots els participants de la sala. |

A continuació, es presenta un diagrama conceptual del flux de dades principal:

### Esquema de Base de Dades (MariaDB)

| Taula | Propòsit | Camps Clau (Exemples) |
| :--- | :--- | :--- |
| `usuaris` | Comptes d'usuari i estadístiques globals. | `id`, `email`, `sessions_completades`, `ratxa` |
| `sales` | Sales d'entrenament temporals (solo/multiplayer). | `id`, `creador_id`, `codi_acces`, `estat` |
| `participacions` | Registre històric dels resultats de cada usuari en una sala. | `usuari_id`, `sala_id`, `exercici`, `repeticions`, `temps_s` |

---

## 3.  Diagrama de Docker

L'entorn es defineix mitjançant `docker-compose.yml`, que defineix els contenidors necessaris per al funcionament de l'aplicació.

Per al desplegament **local** i de desenvolupament, els serveis clau són:

| Servei | Tecnologia Base | Port Exposat | Funció Local |
| :--- | :--- | :--- | :--- |
| `frontend` | Vue.js Build | Interna (Host: 8080) | Serveix l'aplicació client. |
| `backend` | Node.js/Express | 4000 (Host: 4000) | Servidor d'API i WebSocket. |
| `mariadb` | MariaDB | 3306 (Host: 3306) | Contenidor de Base de Dades relacional. |

**Nota:** Els serveis d'alt nivell com `nginx` i `certbot` es reserven habitualment per a l'entorn de producció i poden ser omesos en un desplegament local senzill.

Aquest diagrama conceptual il·lustra l'estructura de contenidors per a l'entorn de desenvolupament:

---

## 4.  Explicació del Desplegament en Local

La manera més ràpida i fiable d'executar l'aplicació en un entorn de desenvolupament o proves és utilitzant Docker Compose, ja que automatitza la configuració dels tres components principals.

### Requisits

* **Docker** (amb Docker Engine en execució)
* **Docker Compose**

### Passos per al Desplegament Local

1.  **Clonar el Repositori:**
    ```bash
    git clone [https://it.wikipedia.org/wiki/Repository](https://it.wikipedia.org/wiki/Repository)
    cd tr1-type-racer-royale
    ```

2.  **Preparar Variables d'Entorn:**
    * Assegureu-vos de tenir els fitxers d'entorn (`.env`) amb les credencials de la base de dades i configuracions de port, seguint la documentació del projecte.

3.  **Llançar els Serveis:**
    * Executeu la següent comanda al directori arrel, la qual construirà les imatges de `frontend` i `backend` i aixecarà els tres contenidors en segon pla:

    ```bash
    docker-compose up -d --build
    ```

    * **(`-d`):** Executa els contenidors en mode *detached*.
    * **(`--build`):** Força la reconstrucció de les imatges customitzades (Vue i Node.js).

4.  **Accés a l'Aplicació:**
    * Un cop els contenidors estiguin en execució (`docker ps`), l'aplicació serà accessible localment:
        * **Frontend (UI):** Normalment a `http://localhost:[PORT_FRONTEND]` (sovint 8080 o 3000).
        * **Backend (API/WS):** Normalment a `http://localhost:4000`.

5.  **Aturar l'Entorn:**
    * Per aturar i eliminar els contenidors (mantenint volums de dades):
    ```bash
    docker-compose down
    ```