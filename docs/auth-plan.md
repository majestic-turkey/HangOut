# Authentication System Checklist

## MVP
- [ ] Implement username/password authentication system
  - [X] Create user model in `src/db/db.ts`
  - [ ] Set up password hashing and validation
  - [ ] Configure cookie-based sessions
  - [ ] Integrate sessions into existing middleware
  - [ ] Create API endpoint for login in `server.ts`
- [ ] Setup Socket.IO
  - [ ] Install Socket.IO and save configurations
  - [ ] Create socket event handlers in `src/socket/socketHandlers.ts`

## Phase 2
- [ ] Develop user registration endpoint in `server.ts`
- [ ] Create combined Login/Register modal in React
  - [ ] Design and implement modal component in frontend
  - [ ] Ensure UI is functional and responsive
  - [ ] Test integration with authentication system
