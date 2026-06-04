# Coffee Platform Backend

Spring Boot backend for the CafeConnect coffee platform. Provides authentication APIs for register and login.

## Requirements

- Java 17+
- Maven 3.6+

## Running the Backend

```bash
cd backend
mvn spring-boot:run
```

The API will be available at `http://localhost:8080/api`

## API Endpoints

### Register
- **POST** `/api/auth/register`
- Body: `{ "firstName", "lastName", "email", "phone", "password", "role", ... }`
- Role: `CUSTOMER`, `CAFE_OWNER`, `CHEF`, `WAITER`

### Login
- **POST** `/api/auth/login`
- Body: `{ "email", "password" }`
- Returns JWT token and user info

## H2 Console

When running, access the H2 database console at: `http://localhost:8080/api/h2-console`
- JDBC URL: `jdbc:h2:mem:cafeconnect`
- Username: `sa`
- Password: (empty)
