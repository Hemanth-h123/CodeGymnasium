# CodeGymnasium System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Next.js Frontend (Port 3001)                     │  │
│  │  - React Components  - Tailwind CSS  - CodeMirror       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway (Port 3000)                    │
│  - Request Routing    - Authentication   - Rate Limiting        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Microservices Layer                          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Auth Service │  │ User Service │  │Course Service│         │
│  │  Port 3001   │  │  Port 3002   │  │  Port 3003   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │Problem Svc   │  │Code Exec Svc │  │Discussion Svc│         │
│  │  Port 3004   │  │  Port 3005   │  │  Port 3006   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────┐                                               │
│  │Challenge Svc │                                               │
│  │  Port 3007   │                                               │
│  └──────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer                                │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  PostgreSQL  │  │   MongoDB    │  │    Redis     │         │
│  │  Port 5432   │  │  Port 27017  │  │  Port 6379   │         │
│  │              │  │              │  │              │         │
│  │ - Users      │  │ - Discussions│  │ - Sessions   │         │
│  │ - Courses    │  │ - Comments   │  │ - Cache      │         │
│  │ - Problems   │  │ - Activity   │  │ - Leaderboard│         │
│  │ - Submissions│  │              │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────┐                                               │
│  │  RabbitMQ    │                                               │
│  │  Port 5672   │                                               │
│  │              │                                               │
│  │ - Code Queue │                                               │
│  │ - Notifications│                                             │
│  └──────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
```

## Service Communication Flow

### 1. User Authentication Flow
```
User → Frontend → API Gateway → Auth Service → PostgreSQL
                                      ↓
                                   Redis (Session)
                                      ↓
                                  JWT Token
                                      ↓
                                   Frontend
```

### 2. Problem Submission Flow
```
User → Frontend → API Gateway → Problem Service → PostgreSQL
                                      ↓
                               Code Exec Service
                                      ↓
                                  RabbitMQ
                                      ↓
                              Docker Container
                                      ↓
                            Test Case Validation
                                      ↓
                              Submission Result
```

### 3. Course Learning Flow
```
User → Frontend → API Gateway → Course Service → PostgreSQL
                                      ↓
                              User Service (Progress)
                                      ↓
                                   Redis (Cache)
```

## Database Schema Overview

### PostgreSQL Tables
- **users**: User accounts and profiles
- **user_sessions**: Active sessions
- **courses**: Course catalog
- **topics**: Course topics/lessons
- **problems**: Coding problems
- **problem_test_cases**: Test cases for validation
- **submissions**: Code submissions
- **challenges**: Contests and competitions
- **badges**: Achievement system

### MongoDB Collections
- **discussions**: Forum threads
- **comments**: Discussion comments
- **user_activity**: Activity logs

### Redis Keys
- **sessions:{userId}**: User sessions
- **cache:course:{id}**: Course cache
- **leaderboard:{challengeId}**: Challenge rankings

## Technology Stack Details

### Frontend Stack
```
Next.js 14
  ├── React 18
  ├── TypeScript
  ├── Tailwind CSS
  ├── React Query (Data Fetching)
  ├── Zustand (State Management)
  ├── CodeMirror (Code Editor)
  ├── Axios (HTTP Client)
  └── React Hook Form (Forms)
```

### Backend Stack
```
Node.js + Express
  ├── TypeScript
  ├── JWT (Authentication)
  ├── Bcrypt (Password Hashing)
  ├── Zod (Validation)
  ├── Winston (Logging)
  ├── Helmet (Security)
  └── Express Rate Limit
```

### Infrastructure
```
Docker Compose
  ├── PostgreSQL 15
  ├── MongoDB 7
  ├── Redis 7
  ├── RabbitMQ 3
  └── Application Containers
```

## Security Measures

1. **Authentication**
   - JWT tokens with refresh mechanism
   - Password hashing with bcrypt
   - Email verification

2. **Authorization**
   - Role-based access control (RBAC)
   - Resource-level permissions
   - API key for services

3. **Protection**
   - Rate limiting on all endpoints
   - CORS configuration
   - Helmet security headers
   - Input validation with Zod
   - SQL injection prevention
   - XSS protection

4. **Code Execution**
   - Docker containerization
   - Resource limits (CPU, Memory, Time)
   - Network isolation
   - File system restrictions

## Scalability Considerations

### Horizontal Scaling
- Each microservice can scale independently
- Load balancer for API Gateway
- Database read replicas
- Redis clustering for cache

### Vertical Scaling
- Optimize database queries
- Implement caching strategies
- Use CDN for static assets
- Code splitting in frontend

### Performance Optimization
- Database indexing
- Query optimization
- Caching frequently accessed data
- Lazy loading components
- Image optimization

## Monitoring & Logging

### Logging Strategy
- Winston for structured logging
- Log levels: error, warn, info, debug
- Centralized log aggregation (future)

### Health Checks
- `/health` endpoint for each service
- Database connection checks
- Redis connectivity checks
- RabbitMQ queue health

### Metrics (Future)
- Response time tracking
- Error rate monitoring
- User activity analytics
- Resource utilization

## Deployment Architecture (Production)

```
                    ┌─────────────┐
                    │   CDN       │
                    └─────────────┘
                          ↓
                    ┌─────────────┐
                    │ Load Balancer│
                    └─────────────┘
                          ↓
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
   ┌─────────┐    ┌─────────┐    ┌─────────┐
   │Frontend │    │Frontend │    │Frontend │
   │Instance │    │Instance │    │Instance │
   └─────────┘    └─────────┘    └─────────┘
                          ↓
                  ┌──────────────┐
                  │ API Gateway  │
                  │Load Balancer │
                  └──────────────┘
                          ↓
        ┌─────────────────┼─────────────────┐
        ↓                 ↓                  ↓
   Microservices    Microservices    Microservices
    Cluster 1        Cluster 2        Cluster 3
```

---

**Last Updated**: November 19, 2025
**Version**: 1.0.0
