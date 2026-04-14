# Refactor Plan Checklist

## Overview

The server.ts and src/db.ts files have grown significantly in size and complexity, especially with recent features like win tracking and deleting old games. To enhance maintainability and scalability, we propose the following refactor plan:

- [X] **Separate db.ts into:**
  - **client/migrate**
  - **repos:**
    - chatRepo
    - userRepo
    - gameRepo
- [X] **Move Socket.IO handlers** out of server.ts
- [ ] **Create services** for player list enrichment:
  - Wins lookup
  - FindOrCreateUser
- [X] **Decouple GameManager** from persistence
- [ ] Suggestions for auth next:
  - Introduce AuthService
  - Separate user identity from display name
  - Never trust socket.data.userName
