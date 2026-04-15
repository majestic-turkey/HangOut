# Authentication System Checklist

## MVP
- [ ] Implement username/password authentication system
  - [X] Create user model in `src/db/db.ts`
  - [X] Set up password hashing and validation
  - [X] Configure cookie-based sessions
  - [X] Integrate sessions into existing middleware
  - [X] Create API endpoint for login in `server.ts`
- [X] Setup Socket.IO
  - [X] Install Socket.IO and save configurations
  - [X] Create socket event handlers in `src/socket/socketHandlers.ts`

## Phase 2
- [X] Develop user registration endpoint in `server.ts`
- [ ] Create combined Login/Register modal in React
  - [ ] Design and implement modal component in frontend
  - [ ] Ensure UI is functional and responsive
  - [ ] Test integration with authentication system
