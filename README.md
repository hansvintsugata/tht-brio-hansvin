<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Docker Compose Setup

The project includes a complete Docker Compose setup with MongoDB, Redis, and the NestJS application.

### Prerequisites
- Docker and Docker Compose installed on your system
- Ports 3000, 27018, and 6380 available on your machine

### Quick Start with Docker

```bash
# Build and start all services
$ docker-compose up -d

# View logs
$ docker-compose logs -f

# Stop all services
$ docker-compose down

# Rebuild and restart
$ docker-compose down && docker-compose up -d --build
```

### Services Overview

**Application Service**
- **Port**: 3000

**MongoDB Database**
- **Port**: 27018 (mapped from container port 27017)
- **Credentials**: admin/password123

**Redis Cache/Queue**
- **Port**: 6380 (mapped from container port 6379)
- **Purpose**: BullMQ job queues and caching
- **Persistence**: Data persisted with append-only mode


## Project Assumptions

### External Service Responsibilities
The notification service assumes the following responsibilities lie with external systems:

**Scheduling & Timing**:
- Payroll system determines when payslips are ready
- HR system manages year-end leave reminder scheduling
- HR system handles daily birthday checks and triggers

**Business Logic**:
- Leave balance calculations are performed by HR system
- Employee eligibility for notifications is determined externally
- Payslip generation and PDF creation happens in payroll system

**Data Management**:
- Employee data (names, emails, birth dates, leave balances) is maintained in external systems


### Template System Assumptions

**Single Language Support**:
- All notification templates are currently in English only
- No multi-language or localization features implemented
- Template variables use consistent naming conventions

### Notification Delivery Assumptions

**Email Notifications**:
- Email service configuration is handled at infrastructure level
- Email delivery is best-effort (no guaranteed delivery confirmation)
- Attachments are provided as URLs or base64 encoded data

**UI Notifications**:
- Currently no flagging whether the notification is read or not

**Delivery Timing**:
- Notifications are sent immediately upon API call
- No batching or delay mechanisms implemented
- Queue-based processing ensures reliability under load

### Data Flow Assumptions

**API Call Pattern**:
```
External System → Notification API → Queue → Processor → Delivery
```

## Integration Assumptions

### External System Requirements
- Must provide valid employee identifiers that exist in the notification service
- Must handle notification service availability and implement appropriate retry logic
- Must provide all required data fields for each notification type

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

### Test Results

#### Unit Test Execution
```bash
$ npm run test

> notification-service@0.0.1 test
> jest

 PASS  src/modules/notification/presentation/processor/email.processor.spec.ts
 PASS  src/modules/notification/presentation/processor/ui.processor.spec.ts
 PASS  src/modules/channel-subscription/application/use-cases/channel-subscription.use-case.spec.ts
 PASS  src/modules/notification/application/use-cases/notification.use-case.spec.ts

Test Suites: 4 passed, 4 total
Tests:       46 passed, 46 total
Snapshots:   0 total
Time:        2.123 s
Ran all test suites.
```

#### Test Coverage Report
```bash
$ npm run test:cov

> notification-service@0.0.1 test:cov
> jest --coverage

 PASS  src/modules/notification/presentation/processor/email.processor.spec.ts
 PASS  src/modules/notification/presentation/processor/ui.processor.spec.ts
 PASS  src/modules/channel-subscription/application/use-cases/channel-subscription.use-case.spec.ts
 PASS  src/modules/notification/application/use-cases/notification.use-case.spec.ts

Test Suites: 4 passed, 4 total
Tests:       46 passed, 46 total
Snapshots:   0 total
Time:        2.456 s
```

## Architecture

### Project Structure: Clean Architecture & DDD Implementation

This project follows **Domain-Driven Design (DDD)** principles and **Clean Architecture** patterns, organized in a modular structure that promotes separation of concerns, testability, and maintainability.

#### Overview

The codebase is structured into four distinct layers following Clean Architecture principles:

1. **Domain Layer** - Core business logic and entities
2. **Application Layer** - Use cases and application services  
3. **Infrastructure Layer** - External integrations and persistence
4. **Presentation Layer** - Controllers and background processors

#### Complete Project Structure

```
src/
├── app/                          # Application configuration and modules
│   ├── app.module.ts            # Root application module
│   ├── queue.module.ts          # Queue configuration (BullMQ)
│   └── dtos/
│       └── app.env.dto.ts       # Environment configuration DTOs
├── common/                       # Shared utilities and enums
│   ├── enums/                   # Global enumerations
│   │   ├── notification-channel.enum.ts
│   │   └── subscriber-types.enum.ts
│   └── dto/
│       └── pagination.dto.ts    # Shared pagination DTOs
├── configs/                      # Configuration modules
│   ├── app.config.ts            # Application configuration
│   ├── database.config.ts       # Database configuration
│   ├── redis.config.ts          # Redis configuration
│   ├── debug.config.ts          # Debug configuration
│   └── index.ts                 # Configuration exports
├── modules/                      # Feature modules (DDD Bounded Contexts)
│   ├── notification/             # Notification bounded context
│   │   ├── domain/              # Domain layer (core business logic)
│   │   │   ├── entities/        # Domain entities
│   │   │   │   └── notification.entity.ts
│   │   │   └── repository/      # Repository interfaces
│   │   │       └── notification-repository.interface.ts
│   │   ├── application/         # Application layer (use cases)
│   │   │   ├── use-cases/       # Application services
│   │   │   │   └── notification.use-case.ts
│   │   │   └── dto/             # Data transfer objects
│   │   │       ├── create-notification.dto.ts
│   │   │       ├── email-job-data.dto.ts
│   │   │       ├── ui-job-data.dto.ts
│   │   │       └── ...
│   │   ├── infrastructure/      # Infrastructure layer
│   │   │   ├── persistence/     # Database repositories
│   │   │   │   ├── notification.repository.ts
│   │   │   │   └── notification-persistence.model.ts
│   │   │   ├── mappers/         # Data mappers
│   │   │   │   └── notification.mapper.ts
│   │   │   └── outbound/        # External service integrations
│   │   │       └── user-data.service.ts
│   │   ├── presentation/        # Presentation layer
│   │   │   ├── controllers/     # REST API controllers
│   │   │   │   ├── notification.system.controller.ts
│   │   │   │   └── notification.user.controller.ts
│   │   │   └── processor/       # Background job processors
│   │   │       ├── email.processor.ts
│   │   │       ├── email.processor.spec.ts
│   │   │       ├── ui.processor.ts
│   │   │       └── ui.processor.spec.ts
│   │   └── notification.module.ts # Module configuration
│   ├── notification-template/    # Notification template bounded context
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── notification-template.entity.ts
│   │   │   └── repository/
│   │   │       └── notification-template-repository.interface.ts
│   │   ├── application/
│   │   │   ├── use-cases/
│   │   │   │   └── get-notification-template.use-case.ts
│   │   │   └── dto/
│   │   │       └── notification-template-response.dto.ts
│   │   ├── infrastructure/
│   │   │   ├── persistence/
│   │   │   │   ├── notification-template.repository.ts
│   │   │   │   └── notification-template-persistence.model.ts
│   │   │   └── mappers/
│   │   │       └── notification-template.mapper.ts
│   │   └── notification-template.module.ts
│   └── channel-subscription/    # Channel subscription bounded context
│       ├── domain/
│       │   ├── entities/
│       │   │   └── channel-subscription.entity.ts
│       │   └── repository/
│       │       └── channel-subscription-repository.interface.ts
│       ├── application/
│       │   ├── use-cases/
│       │   │   └── channel-subscription.use-case.ts
│       │   └── dto/
│       │       └── get-channels.dto.ts
│       ├── infrastructure/
│       │   ├── persistence/
│       │   │   ├── channel-subscription.repository.ts
│       │   │   └── channel-subscription-persistence.model.ts
│       │   └── mappers/
│       │       └── channel-subscription.mapper.ts
│       └── channel-subscription.module.ts
├── router/                       # Route organization
│   ├── router.module.ts          # Main router module
│   └── routes/
│       ├── routes.user.module.ts  # User-facing routes
│       └── routes.system.module.ts # System/admin routes
└── main.ts                      # Application entry point
```

#### Clean Architecture Layers

**Domain Layer** (`domain/`)
- **Core business logic** and business rules
- **Entities**: Rich domain objects with business behavior
- **Repository Interfaces**: Contracts for data persistence
- **No external dependencies** - pure business logic
- **Example**: `notification.entity.ts` contains business rules for notifications

**Application Layer** (`application/`)
- **Use cases**: Application-specific business rules
- **DTOs**: Data transfer objects for layer communication
- **Application services**: Coordinate between domain and infrastructure
- **No infrastructure dependencies** - focuses on business flow
- **Example**: `notification.use-case.ts` orchestrates notification sending

**Infrastructure Layer** (`infrastructure/`)
- **External integrations**: Database, external APIs, queues
- **Repository implementations**: Concrete data persistence
- **Mappers**: Convert between domain and persistence models
- **Technical concerns**: Database queries, API calls, file operations
- **Example**: `notification.repository.ts` implements database operations

**Presentation Layer** (`presentation/`)
- **Controllers**: REST API endpoints
- **Processors**: Background job handlers (BullMQ)
- **Input validation**: Request/response handling
- **Example**: `email.processor.ts` handles email notification jobs

#### Technology Stack

- **Framework**: NestJS (modular architecture)
- **Queues**: BullMQ for background processing
- **Database**: TypeORM with repository pattern
- **Testing**: Jest with comprehensive test coverage
- **Validation**: Class Validator for input validation
