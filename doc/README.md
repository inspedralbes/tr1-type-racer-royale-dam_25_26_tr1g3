# Documentació
Llistat d'alguns dels punts que han de quedar explicats en aquesta carpeta. Poden ser tots en aquest fitxer o en diversos fitxers enllaçats.

És obligatori modificar aquest document!!

## Documentació bàsica MÍNIMA
 * Objectius
 * Arquitectura bàsica
   * Tecnologies utilitzades
   * Interrelació entre els diversos components
 * Com crees l'entorn de desenvolupament
 * Com desplegues l'aplicació a producció
 * Llistat d'endpoints de l'API de backend (també podeu documentar-ho amb swagger)
    * Rutes
   * Exemples de JSON de peticó
   * Exemples de JSON de resposta i els seus codis d'estat 200? 404?
 * Aplicació Android
 * Altres elements importants.
 * ...

---


## Diagrames

Aquí pots veure els diagrames del projecte:

**Diagrama de flux d'usuari**

<img width="612" height="986" alt="Fluxd'usuari drawio" src="https://github.com/user-attachments/assets/afbc2510-9534-4f43-acbf-203f89ab07a7" />

**Esquema inicial Store de Pinia**

![Diagrama Store de Pinia](arxius/EsquemaStorePinia.png)

**Diagrama Pinia**

### Gestor d'Estat Global (Pinia)

Aquest és el nucli de la gestió de l'estat de l'aplicació, centralitzant totes les dades reactives i la lògica per modificar-les.

---

#### **ESTAT (STATE)**
Conté totes les dades que necessiten ser compartides entre diferents components de l'aplicació.

-   **Usuari Actual:** Emmagatzema la informació de l'usuari que ha iniciat sessió.
-   **Sala Actual:** Guarda les dades de la sala o sessió a la qual l'usuari s'ha unit.
-   **Participants:** Manté una llista actualitzada de tots els usuaris presents a la sala.
-   **Connexió WebSocket:** Controla l'estat de la connexió en temps real amb el servidor.
-   **Intel·ligència Artificial:** Gestiona l'estat del model d'IA (si està carregat, actiu, etc.).

---

#### **GETTERS**
Són propietats calculades que deriven de l'estat. Permeten accedir a dades processades o filtrades de manera eficient.

-   **Classificació ordenada:** Retorna una llista dels participants ordenada segons la seva puntuació o progrés.
-   **Comprovació d'usuari a la sala:** Retorna un valor booleà que indica si l'usuari actual ja forma part d'una sala.

---

#### **ACCIONS (ACTIONS)**
Són les funcions que s'invoquen per modificar l'estat. Tota la lògica de negoci i les crides asíncrones es gestionen aquí.

-   **Unir-se a una sala:** Executa la lògica per afegir l'usuari a una sala específica.
-   **Abandonar la sala:** Gestiona la sortida de l'usuari de la sala actual.
-   **Actualitzar progrés:** Modifica l'estat per reflectir el progrés de l'usuari (p. ex., repeticions, puntuació).
-   **Gestionar missatges del servidor:** Processa els missatges rebuts a través del WebSocket i actualitza l'estat segons correspongui.
-   **Carregar model d'IA:** Inicia la càrrega del model d'intel·ligència artificial.
-   **Processar imatge amb IA:** Envia un fotograma de vídeo al model d'IA per al seu anàlisi.
-   **Desar resultats de la sessió:** Realitza les operacions necessàries per guardar les dades finals de la sessió d'un usuari.


## Protocols

**Protocol de comunicació amb Esdeveniments definits**

| Esdeveniment (type) | Direcció | Descripció | Camps (data) |
|---|---|---|---|
| `join_room` | Client → Servidor | L'usuari sol·licita unir-se a una sala concreta. | `username`, `room` |
| `room_joined` | Servidor → Client | El servidor confirma la unió a la sala i retorna la llista d'usuaris actuals. | `room`, `participants[]` |
| `update_reps` | Client → Servidor | L'usuari envia el nombre actual de repeticions realitzades. | `username`, `reps` |
| `leaderboard_update` | Servidor → Client | El servidor envia el rànquing actualitzat de tots els participants. | `leaderboard[]` |
| `error` | Servidor → Client | El servidor notifica un error (p. ex. sala inexistent). | `message` |
| `disconnect` | Client → Servidor | L'usuari es desconnecta o abandona la sala. | `username` |
