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


# FitAI/NEXTREP: Type Racer Royale (TR1)

Aquesta documentació ofereix una visió general d'alt nivell de l'aplicació **FitAI** (originalment TR1 - Type Racer Royale), un sistema web de seguiment de fitness basat en IA que permet als usuaris realitzar exercicis amb detecció de posició en temps real i participar en sessions d'entrenament multijugador competitives.

---

## 1. Arquitectura de l'Aplicació

L'aplicació FitAI segueix una **arquitectura de tres capes** (Three-Tier Architecture), la qual facilita la separació de responsabilitats i l'escalabilitat. Tot el sistema està **containeritzat** utilitzant **Docker Compose** per garantir un desplegament consistent.

### Piles Tecnològiques Clau

| Capa | Tecnologia | Propòsit |
| :--- | :--- | :--- |
| **Frontend** | **Vue.js 3** (Composition API), **Vuetify** | Interfície d'Usuari i experiència de l'usuari (UI/UX). |
| | **Pinia** | Gestió de l'estat global del frontend. |
| | **TensorFlow Lite** | Detecció de posició (*Pose Detection*) realitzada al client (navegador). |
| **Backend** | **Node.js** + **Express 5** | Servidor HTTP per lògica de negoci i APIs REST. |
| | **WebSocket** (`ws`) | Comunicació en temps real per a sessions multijugador. |
| | **Sequelize** (ORM) | Gestió i accés a la base de dades. |
| **Base de Dades** | **MariaDB** | Emmagatzematge de dades d'usuaris, sessions i estadístiques. |

### Flux de Comunicació

L'aplicació fa servir un sistema de comunicació dual:
1.  **HTTP/REST:** S'utilitza per a operacions estàndard, com ara autenticació (`/api/login`), registre i creació de sales d'exercici.
2.  **WebSocket:** S'estableix una connexió per a cada sessió multijugador per transmetre dades en temps real (actualitzacions de repeticions i *leaderboards*) sense necessitat de consultes constants a la base de dades.

---

## 2. Esquema de Components

L'aplicació es divideix en mòduls clars, amb una separació estricta entre la lògica del client i la del servidor.

### Components Clau i Flux de Dades

| Component | Funció | Interaccions Clau |
| :--- | :--- | :--- |
| **Frontend Vue Components** (`*.vue`) | Renderitzen la UI i gestionen la interacció de l'usuari. | Es comuniquen amb les **Stores** de Pinia. |
| **Pinia Stores** (`authStore`, `workoutStore`) | Gestionen l'estat local i la lògica de negoci del client. | Invoquen els *endpoints* REST del Backend i la connexió WebSocket. |
| **TensorFlow Lite** | Executa el model d'IA per detectar la posició de l'usuari i comptar repeticions. | Envia missatges `update` al servidor via WebSocket. |
| **Backend Controllers** | Gestionen les peticions REST (ex: `authController`, `salaController`). | Utilitzen **Sequelize** per interactuar amb **MariaDB**. |
| **WebSocket Handler** (`wsHandler.js`) | Manté l'estat en memòria de les sessions d'entrenament actives. | Gestiona els missatges `join`, `update` i `finish` en temps real. |

A continuació, es presenta un diagrama conceptual del flux de dades principal:


### Esquema de Base de Dades (MariaDB)

| Taula | Propòsit | Camps Clau |
| :--- | :--- | :--- |
| `usuaris` | Comptes d'usuari i estadístiques agregades. | `id`, `nom`, `email`, `sessions_completades`, `repeticions_totals` |
| `sales` | Sales d'entrenament (solo o multijugador). | `id`, `creador_id`, `codi_acces`, `estat` |
| `participacions` | Registres de sessions, vinculant usuaris a les sales. | `usuari_id`, `sala_id`, `exercici`, `temps_s`, `repeticions` |

---

## 3. Diagrama de Docker

L'aplicació es desplega com un conjunt de serveis independents orquestrats mitjançant **Docker Compose**.

A continuació, es detallen els serveis que componen l'entorn de producció:

| Servei | Imatge/Build | Port Exposat | Funció |
| :--- | :--- | :--- | :--- |
| `nginx` | `nginx:latest` | 80, 443 | **Reverse Proxy** i terminació SSL. Dirigeix el trànsit cap a `frontend` i `backend`. |
| `frontend` | Build personalitzat | Interna | Serveix l'aplicació Vue.js (fitxers estàtics). |
| `backend` | Build personalitzat | 4000 | Servidor **Node.js/Express** i **WebSocket Server**. |
| `mariadb` | `mariadb:latest` | 3306 | Contenidor de Base de Dades. |
| `certbot` | `certbot/certbot` | N/A | Automatització de certificats SSL (Let's Encrypt). |

Aquest diagrama il·lustra la relació entre els diferents contenidors i el trànsit extern:


---

## 4. Explicació del Desplegament

El desplegament de l'aplicació està estandarditzat mitjançant **Docker Compose**, permetent una posada en marxa ràpida i fiable en qualsevol entorn que suporti Docker.

### Requisits

* **Docker**
* **Docker Compose**
* Un domini/subdomini apuntant a la IP del servidor (necessari per al servei `certbot`).

### Procés de Desplegament

1.  **Configuració dels Fitxers d'Entorn:**
    * Assegureu-vos que les variables d'entorn (BBDD, dominis, etc.) necessàries per a la configuració dels serveis i el **`docker-compose.yml`** estiguin correctament establertes.
2.  **Llançament dels Serveis:**
    * El desplegament es realitza amb una sola comanda que aixeca tots els contenidors, realitza els *builds* de les imatges personalitzades i configura la xarxa interna:

    ```bash
    docker-compose up -d --build
    ```

3.  **Seqüència d'Inici:**
    * El contenidor **MariaDB** s'inicialitza primer.
    * **Backend** i **Frontend** s'inicien i estableixen connexions.
    * **Nginx** es posiciona com a punt d'entrada, gestionant peticions HTTP i HTTPS, i assegurant que el trànsit de **WebSocket** es dirigeixi correctament al **Backend**.
    * **Certbot** s'executa per gestionar la validesa i renovació dels certificats SSL de manera automàtica.