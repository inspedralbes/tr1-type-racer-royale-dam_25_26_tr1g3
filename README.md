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


# 🤖 FitAI: Type Racer Royale - Plataforma de Fitness amb Detecció de Postures en Temps Real

Aquest repositori conté el codi font de **FitAI**, una aplicació web de seguiment de fitness que utilitza **Intel·ligència Artificial (TensorFlow Lite)** per a la detecció de postures en temps real, permetent als usuaris realitzar exercicis i participar en sessions competitives multijugador.

---

## 1. Arquitectura General i Components

FitAI segueix un model d'**Arquitectura de Tres Nivells (Three-Tier Architecture)**, dissenyat per a una alta escalabilitat i una gestió eficient de la comunicació en temps real. La infraestructura està completament **containeritzada** utilitzant Docker Compose.



### 1.1. Components Principals i Pila Tecnològica

El sistema es divideix en els següents serveis lògics:

| Component | Descripció | Tecnologies Clau |
| :--- | :--- | :--- |
| **Frontend (Client)** | Interfície d'usuari (UI) que s'executa al navegador. Gestiona la lògica de la UI i, fonamentalment, la **Detecció de Postures (Pose Detection)** usant la càmera. | **Vue.js 3** (Composition API), Vuetify, **Pinia** (Gestió d'Estat), **TensorFlow Lite** |
| **Backend (Servidor)** | Servidor d'API que gestiona la lògica de negoci, la persistència de dades i la comunicació en temps real. | **Node.js + Express 5**, **WebSocket (`ws`)**, Sequelize (ORM), `express-session` |
| **Base de Dades** | Emmagatzema la informació d'usuaris, sessions d'exercicis, rànquings i estadístiques agregades. | **MariaDB** |
| **Infraestructura** | Components d'orquestració i xarxa que gestionen el lliurament segur de l'aplicació. | **Docker Compose**, **Nginx** (Reverse Proxy/SSL), **Certbot** |

---

## 2. DESPLEGAMENT

El desplegament de FitAI es realitza mitjançant **Docker Compose**, la qual cosa garanteix un entorn de producció consistent i reproduïble. El desplegament està optimitzat per a funcionar darrere d'un proxy invers amb gestió de certificats SSL/TLS.

### 2.1. Configuració de Desplegament amb Docker Compose

El fitxer `docker-compose.yml` defineix i coordina els serveis següents:

| Servei | Funció | Ports exposats | Notes |
| :--- | :--- | :--- | :--- |
| `nginx` | **Proxy Invers** i terminació SSL (HTTPS). Enruta el trànsit al Frontend (HTTP) i al Backend (API/WebSocket). | `80:80`, `443:443` | Punt d'entrada principal. |
| `frontend` | Serveix l'aplicació Vue.js. | Xarxa Interna | Construït a partir del seu Dockerfile. |
| `backend` | Servidor Node.js/Express. Gestiona l'API REST i el servidor WebSocket. | `4000:4000` | Construït a partir del seu Dockerfile. |
| `mariadb` | Servidor de base de dades relacional. | `3306:3306` | Persistència de dades. |
| `certbot` | Automatització per a l'obtenció i renovació de certificats SSL (Let's Encrypt). | N/A | Servei auxiliar per a HTTPS. |

### 2.2. Passos per al Desplegament

1. Assegura't de tenir **Docker** i **Docker Compose** instal·lats.
2. Configura les variables d'entorn necessàries (connexió a la base de dades, secrets de sessió).
3. Executa la comanda per aixecar tots els serveis:

    ```bash
    docker-compose up -d --build
    ```

4. L'accés a l'aplicació es realitza a través del port 80 (HTTP) o 443 (HTTPS), gestionats per Nginx.

---

## 3. Docker i Comunicació en Temps Real (Sockets)

### 3.1. Ús de Docker

L'estratègia de **Dockerització** té com a objectiu:

* **Aïllament:** Cada component (Frontend, Backend, DB) s'executa al seu propi contenidor, aïllant dependències.
* **Consistència:** Garanteix que l'aplicació s'executi de la mateixa manera en desenvolupament, proves i producció.
* **Orquestració:** **Docker Compose** permet definir la xarxa interna i les dependències entre serveis, simplificant el desplegament de tot l'ecosistema.

### 3.2. Sockets (WebSockets) per a Comunicació en Temps Real

El projecte utilitza **WebSockets** per a les funcionalitats multijugador i de temps real, crucials per a una experiència competitiva.

* **Protocol:** S'utilitza el protocol WebSocket implementat al Backend amb la llibreria `ws`.
* **Propòsit:** Permet la comunicació bidireccional de baixa latència necessària per sincronitzar les accions dels usuaris (comptatge de repeticions) en una sala d'entrenament.

#### Tipus de Missatges WebSocket (Exemples)

| Tipus de Missatge | Direcció | Descripció |
| :--- | :--- | :--- |
| `join` | Client → Servidor | Notifica al servidor que un usuari ha entrat a una sala. |
| `update` | Client → Servidor | Envia l'actualització del compte de repeticions de l'usuari en temps real. |
| `leaderboard` | Servidor → Client | Difon el rànquing actualitzat de la sessió a tots els participants. |
| `finish` | Client → Servidor | Senyalitza la fi de la sessió perquè es persisteixin les dades a la base de dades. |