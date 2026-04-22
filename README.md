## 🛠️ Backend: Spring Boot (Package by Feature)

This Spring Boot backend is organized using a **Package by Feature** (or Domain-Driven) architecture. Instead of grouping files by their technical layer (e.g., putting all controllers together in one giant folder), we group everything related to a specific business capability into a single, cohesive package.


```text
backend/src/main/java/backend/
│
├── user/                     # The complete 'User' feature module
│   ├── UserController.java   # HTTP endpoints for users
│   ├── UserService.java      # Business logic for users
│   ├── UserRepository.java   # DB access for users
│   ├── User.java             # JPA Entity
│   ├── UserRequestDto.java   # Input payload definition
│   └── UserResponseDto.java  # Output payload definition
│
├── product/                  # The complete 'Product' feature module
│   ├── ProductController.java
│   ├── ProductService.java
│   ├── ProductRepository.java
│   └── Product.java
│
├── order/                    # The complete 'Order' feature module
│   ├── OrderController.java
│   └── ...
│
└── common/                   # Shared, cross-cutting concerns
    ├── exception/            # GlobalControllerAdvice and custom exceptions
    ├── config/               # Spring Security, CORS, and OpenAPI setup
    └── utils/                # Shared helper methods or base classes
```


## Frontend

The `src/app/` directory is divided into three primary pillars: `core`, `shared`, and `features`.

```text
frontend/src/app/
│
├── core/                     # 🛡️ App-wide singletons and configurations
│   ├── interceptors/         # e.g., AuthInterceptor (attaches JWTs to requests)
│   ├── services/             # e.g., AuthService, ThemeService
│   └── guards/               # e.g., AuthGuard (protects routes)
│
├── shared/                   # 🧩 Reusable, "dumb" UI building blocks
│   ├── components/           # e.g., CustomButton, LoadingSpinner, Modal
│   ├── pipes/                # e.g., CurrencyFormatterPipe
│   └── models/               # e.g., Pagination interface used across the app
│
└── features/                 # 🎯 Domain-specific business logic (Matches Backend)
    ├── user/                 # The 'User' feature
    │   ├── components/       # Smart (UserPage) and Dumb (UserCard) components
    │   ├── services/         # UserService (HttpClient calls to Spring Boot /api/users)
    │   └── models/           # TypeScript interfaces perfectly matching Backend DTOs
    │
    ├── product/              # The 'Product' feature
    │   ├── components/
    │   ├── services/
    │   └── models/
    │
    └── order/                # The 'Order' feature
        └── ...