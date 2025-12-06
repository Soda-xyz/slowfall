# Teknisk Dokumentation – Slowfall

## 1. Inledning

### 1.1 Syfte och Mål

Slowfall är en webbaserad applikation för hantering av fallskärmshopp, flygplan, flygplatser och personer (hoppar och piloter). Systemet möjliggör för fallskärmsklubbar att organisera, schemalägga och spåra hoppaktiviteter på ett strukturerat och effektivt sätt.

**Primära mål:**
- Centraliserad hantering av hoppdata och personuppgifter
- Realtidsövervakning av schemalagda hopp
- Spårning av flygplan och piloter
- Enkel administration av flygplatsresurser
- Säker autentisering och auktorisering via Azure Entra ID

### 1.2 Övergripande Funktion

Applikationen består av:
- En **backend** byggd med Spring Boot som exponerar RESTful API:er
- En **frontend** byggd med React och TypeScript för användarinteraktion
- En **databashantering** med H2 (in-memory) för utveckling
- En **nginx reverse proxy** för routing och säkerhet i produktion

Systemet stödjer CRUD-operationer för fyra huvuddomäner:
1. **Persons** - Hoppar och piloter
2. **Jumps** - Fallskärmshopp med koppling till personer och flygplatser
3. **Crafts** - Flygplan (modell och registreringsnummer)
4. **Airports** - Flygplatser med ICAO-koder

---

## 2. Produkten

### 2.1 Översikt

Slowfall är en skydiving dashboard-applikation ("Skydive Dash") som ger användare möjlighet att:
- Registrera och hantera fallskärmshoppare och piloter
- Schemalägga hopp med information om tid, plats, höjd och deltagare
- Administrera flygplan och flygplatsdata
- Visualisera hoppstatistik och aktivitet i realtid

### 2.2 Problem som Löses

**Utmaningar innan Slowfall:**
- Manuell hantering av hoppscheman i kalkylark eller papper
- Svårt att hålla koll på vilka flygplan och piloter som är tillgängliga
- Begränsad möjlighet att spåra historik och statistik
- Ingen centraliserad plattform för klubbmedlemmar

**Lösningar som Slowfall erbjuder:**
- Digital och centraliserad hopphantering
- Realtidsuppdateringar via WebSocket-support
- Strukturerad databas för historisk data
- Säker åtkomst via modern OIDC-autentisering
- Responsiv webbgränssnitt tillgängligt på alla enheter

### 2.3 Arkitekturval

**Arkitekturstil:** Trelagerarkitektur med tydlig separation mellan presentation, affärslogik och data.

**Huvudsakliga arkitekturbeslut:**

1. **Monolitisk backend med modulär struktur**
   - Varje domän (Person, Jump, Craft, Airport) har egen package med API, Application, Domain och Infra-lager
   - Möjliggör framtida uppdelning till microservices om behovet uppstår

2. **Single Page Application (SPA) frontend**
   - React med TypeScript för typ-säkerhet
   - Mantine UI-komponentbibliotek för konsekvent design
   - Vite som build-verktyg för snabb utveckling

3. **Container-baserad deployment**
   - Docker containers för backend, frontend och nginx proxy
   - Azure App Service Container för hosting
   - GitHub Container Registry (GHCR) för image storage

4. **Cloud-native authentication**
   - Azure Entra ID (tidigare Azure AD) för OIDC-autentisering i produktion
   - Pseudo/Basic auth för utvecklings- och testmiljöer

---

## 3. Verktyg och Teknologier

### 3.1 Backend

| Verktyg/Ramverk | Version | Användning |
|-----------------|---------|------------|
| Java | 21 (Temurin) | Programmeringsspråk |
| Spring Boot | 3.5.7 | Applikationsramverk |
| Spring Data JPA | (via Spring Boot) | Databas-access och ORM |
| Hibernate | (via Spring Boot) | JPA-implementation |
| H2 Database | (runtime) | In-memory databas för dev/test |
| Gradle | 8.x | Build-verktyg |
| JUnit 5 | (via Spring Boot) | Testramverk |

**Motivering:**
- **Java 21**: Modern LTS-version med förbättrad prestanda och nya språkfunktioner
- **Spring Boot 3.x**: Branschstandard med omfattande ekosystem, auto-configuration och production-ready features
- **JPA/Hibernate**: Abstraherar databasoperationer och möjliggör byte av databas utan kodändringar
- **H2**: Snabb in-memory databas perfekt för utveckling och CI-pipeline
- **Gradle**: Flexibel och effektiv build automation med Kotlin/Groovy DSL

### 3.2 Frontend

| Verktyg/Ramverk | Version | Användning |
|-----------------|---------|------------|
| React | 19.2.1 | UI-bibliotek |
| TypeScript | 5.9.3 | Typat JavaScript |
| Vite | 7.2.4 | Build-verktyg och dev server |
| Mantine | 8.3.9 | UI-komponentbibliotek |
| React Router | 6.30.2 | Client-side routing |
| Day.js | 1.11.9 | Datum/tid-hantering |
| Vitest | 4.0.14 | Test runner |

**Motivering:**
- **React 19**: Modern och välstött UI-bibliotek med stor community
- **TypeScript**: Typ-säkerhet reducerar runtime-fel och förbättrar utvecklarupplevelsen
- **Vite**: Extremt snabb dev server och build process jämfört med Webpack
- **Mantine**: Komplett komponentbibliotek med god tillgänglighet och responsiv design
- **Vitest**: Snabb test runner designad för Vite-projekt

### 3.3 DevOps och Deployment

| Verktyg | Användning |
|---------|------------|
| Docker | Containerisering av applikationer |
| GitHub Actions | CI/CD pipeline |
| Azure App Service | Container hosting |
| Azure Container Registry (ACR) | Docker image registry |
| GitHub Container Registry (GHCR) | Alternativ image registry |
| Azure Entra ID | Identitetshantering och autentisering |
| Azure Key Vault | Secrets och kryptografisk nyckelhantering |
| nginx | Reverse proxy och lastbalanserare |

**Motivering:**
- **Docker**: Standardiserad deployment environment, samma artifact från dev till prod
- **GitHub Actions**: Native integration med GitHub, OIDC-support, enkel konfiguration
- **Azure**: Robust cloud platform med god integration mellan tjänster
- **nginx**: Beprövad reverse proxy med hög prestanda

### 3.4 Kvalitetsverktyg

| Verktyg | Användning |
|---------|------------|
| Checkstyle | Java code style enforcement |
| Spotless | Code formatting (Palantir Java Format) |
| ESLint | JavaScript/TypeScript linting |
| Prettier | Code formatting för frontend |
| Spring Boot Actuator | Health checks och metrics |

---

## 4. Projektarkitektur

### 4.1 Systemöversikt

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTPS
       │
┌──────▼──────────────────────┐
│  nginx Reverse Proxy        │
│  (slowfall-proxy)           │
│  - TLS termination          │
│  - Header forwarding        │
│  - /api/* → Backend         │
│  - /* → Frontend SPA        │
└──────┬──────────────────────┘
       │
       ├─────────────────────────┐
       │                         │
┌──────▼──────────┐    ┌────────▼─────────┐
│  Frontend       │    │  Backend         │
│  (React SPA)    │    │  (Spring Boot)   │
│  - UI/UX        │    │  - REST API      │
│  - State mgmt   │    │  - Business logic│
└─────────────────┘    │  - Data access   │
                       └────────┬─────────┘
                                │
                       ┌────────▼─────────┐
                       │  H2 Database     │
                       │  (in-memory)     │
                       └──────────────────┘

┌──────────────────────────────────┐
│  Azure Cloud Services            │
│  - Entra ID (OIDC)              │
│  - Key Vault (secrets/keys)      │
│  - App Service (hosting)         │
└──────────────────────────────────┘
```

### 4.2 Fil- och Mappstruktur

```
slowfall/
├── .github/
│   └── workflows/
│       └── ci-cd.yml              # CI/CD pipeline definition
├── config/
│   └── checkstyle.xml             # Java code style rules
├── docker/
│   ├── backend/
│   │   └── Dockerfile             # Backend container image
│   ├── frontend/
│   │   └── Dockerfile             # Frontend container image
│   └── nginx/
│       └── Dockerfile             # Proxy container image
├── frontend/
│   ├── src/
│   │   ├── features/              # Feature-based modules
│   │   │   ├── airport/           # Airport CRUD
│   │   │   ├── craft/             # Aircraft CRUD
│   │   │   ├── jump/              # Jump CRUD
│   │   │   └── person/            # Person CRUD
│   │   ├── lib/                   # Shared utilities
│   │   ├── auth/                  # Authentication logic
│   │   ├── theme/                 # Mantine theme config
│   │   └── App.tsx                # Root component
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── src/
│   ├── main/
│   │   ├── java/xyz/soda/slowfall/
│   │   │   ├── airport/           # Airport domain
│   │   │   │   ├── api/           # REST controllers
│   │   │   │   ├── application/   # Service layer
│   │   │   │   ├── domain/        # Entities
│   │   │   │   └── infra/         # Repositories
│   │   │   ├── craft/             # Craft domain (samma struktur)
│   │   │   ├── jump/              # Jump domain (samma struktur)
│   │   │   ├── person/            # Person domain (samma struktur)
│   │   │   ├── config/            # Spring configuration
│   │   │   └── SlowfallApplication.java
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── application-dev.properties
│   │       ├── application-prod.properties
│   │       └── logback-spring.xml
│   └── test/                      # Enhetstester (samma struktur)
├── build.gradle                   # Gradle build configuration
├── settings.gradle
├── gradlew                        # Gradle wrapper
├── README.md
├── README_CLOUD.md               # Cloud deployment guide
├── README_ENV.md                 # Environment variables guide
└── TEKNISK_DOKUMENTATION.md      # Denna fil
```

### 4.3 Domänmodell

**Huvudentiteter:**

1. **Person**
   - Attribut: id (UUID), firstName, lastName, email, role, certified, createdAt
   - Relationer: ManyToMany med Jump (som skydiver eller pilot)

2. **Jump**
   - Attribut: id (UUID), jumpTime, airportId, altitudeFeet, createdAt
   - Relationer: ManyToMany med Person (skydivers och pilots)

3. **Craft** (Flygplan)
   - Attribut: id (UUID), model, registration, createdAt

4. **Airport**
   - Attribut: id (UUID), name, icaoCode, createdAt

**Relationer:**
- En Jump har många Skydivers (Person)
- En Jump har många Pilots (Person)
- En Jump är kopplad till ett Airport (via airportId)
- Craft är för närvarande fristående (kan kopplas till Jump i framtiden)

---

## 5. Applikationens Komponenter

### 5.1 Backend (Spring Boot)

**Arkitekturlager per domän:**

```
API Layer (Controller)
    ↓
Application Layer (Service)
    ↓
Domain Layer (Entity)
    ↓
Infrastructure Layer (Repository)
```

**Exempel: Person Domain**

```java
// API Layer
@RestController
@RequestMapping("/api/persons")
public class PersonController {
    // HTTP endpoints (GET, POST, PUT, DELETE)
}

// Application Layer
@Service
public class PersonService {
    // Business logic, validation
}

// Domain Layer
@Entity
public class Person {
    // Domain model, business rules
}

// Infrastructure Layer
public interface PersonRepository extends JpaRepository<Person, UUID> {
    // Data access methods
}
```

**Viktiga Spring Boot-komponenter:**

- **Controllers**: Hanterar HTTP-requests, validering och response mapping
- **Services**: Innehåller affärslogik och orchestration
- **Repositories**: Spring Data JPA repositories för databasaccess
- **DTOs**: Data Transfer Objects för API-kommunikation
- **Configuration**: CORS, Web, JPA-konfiguration
- **Actuator**: Health checks (`/actuator/health`) för monitoring

### 5.2 Frontend (React + TypeScript)

**Komponentstruktur:**

```
App (Root)
├── Auth Layer (MSAL/BasicAuth)
├── Router
│   ├── Dashboard
│   ├── Persons
│   │   ├── PersonList
│   │   ├── PersonForm
│   │   └── PersonDetail
│   ├── Jumps
│   │   ├── JumpList
│   │   ├── JumpForm
│   │   └── JumpDetail
│   ├── Crafts
│   └── Airports
└── DatabaseControl (admin)
```

**Feature-baserad struktur:**

Varje feature (airport, craft, jump, person) innehåller:
- `api.ts` - API client functions (fetch calls till backend)
- `types.ts` - TypeScript interfaces för domain models
- `components/` - React components för den featuren
- `api.test.ts` - Unit tests för API client

**State Management:**
- React hooks (useState, useEffect) för local state
- Context API kan användas för global state (t.ex. auth)
- Ingen extern state library (Redux, Zustand) används för enkelhetens skull

**API Communication:**
```typescript
// Exempel från features/person/api.ts
export async function fetchPersons(): Promise<Person[]> {
  const response = await fetch(`${API_BASE}/api/persons`);
  return response.json();
}

export async function createPerson(data: PersonInput): Promise<Person> {
  const response = await fetch(`${API_BASE}/api/persons`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}
```

### 5.3 Databas

**H2 In-Memory Database:**

- **Syfte**: Utveckling, testning och prototyping
- **Konfiguration**: JDBC URL i `application.properties`
- **DDL**: Hibernate auto-generates schema via `ddl-auto=update`
- **Konsol**: Tillgänglig på `/h2-console` i dev-profil
- **Data Seeding**: `DataSeeder.java` skapar testdata vid uppstart

**Schema:**
```sql
-- Exempel på genererat schema
CREATE TABLE persons (
  id UUID PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(50),
  certified BOOLEAN,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE jumps (
  id UUID PRIMARY KEY,
  jump_time TIMESTAMP NOT NULL,
  airport_id UUID NOT NULL,
  altitude_feet INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE jump_skydiver (
  jump_id UUID,
  person_id UUID,
  PRIMARY KEY (jump_id, person_id)
);

-- Liknande för crafts, airports, jump_pilots
```

**Framtida databas:**
- För produktion kan H2 bytas mot PostgreSQL eller MySQL
- Minimal kodändring krävs tack vare JPA-abstraktionen
- Konfiguration via Spring profiles (`application-prod.properties`)

### 5.4 Nginx Reverse Proxy

**Konfiguration:**

```nginx
# Simplified configuration
server {
  listen 80;
  
  # Proxy API requests to backend
  location /api/ {
    proxy_pass http://${BACKEND_HOST}:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
  
  # Serve frontend static files
  location / {
    root /usr/share/nginx/html;
    try_files $uri $uri/ /index.html;
  }
}
```

**Ansvar:**
- TLS termination (om konfigurerad)
- Request routing (API vs SPA)
- Header management (X-Forwarded-*)
- CORS-hantering (via headers)
- Static file serving för frontend

### 5.5 Interna Moduler

**Logging och Observability:**

- **LoggingAspect**: AOP-aspect för automatisk loggning av metoder annoterade med `@Loggable`
- **RequestLoggingFilter**: Servlet filter för HTTP request/response logging
- **Logback**: Strukturerad logging med JSON output via logstash encoder

**Security:**

- **CORS Configuration**: `CorsProperties.java` för Cross-Origin konfiguration
- **Azure Integration**: Key Vault för secrets och certificates
- **Authentication Profiles**:
  - `prod`: Azure Entra ID OIDC
  - `pseudo`: Basic Auth för test
  - `dev`: Öppen utvecklingsmiljö

---

## 6. Flöden

### 6.1 Autentiseringsflöde

**Produktion (Azure Entra ID OIDC):**

```
1. Användare navigerar till frontend (https://www.example.com)
2. Frontend detekterar ingen giltig token
3. MSAL.js initierar OAuth2 Authorization Code Flow
4. Användare redirectas till Azure Entra ID login
5. Användare autentiserar (username/password, MFA, etc.)
6. Azure returnerar authorization code
7. MSAL byter code mot access token + ID token
8. Frontend lagrar tokens i sessionStorage/localStorage
9. Alla API-requests inkluderar: Authorization: Bearer <token>
10. Backend validerar token mot Azure Entra ID
11. Backend kontrollerar gruppmedlemskap (AAD group ID)
12. Request tillåts eller nekas baserat på gruppmedlemskap
```

**Utveckling (Pseudo Auth):**

```
1. Användare ser login-formulär (BasicLogin component)
2. Användare anger username och password
3. Frontend skapar Basic Auth header: Base64(username:password)
4. Request skickas med: Authorization: Basic <credentials>
5. Backend validerar mot in-memory user (Spring Security)
6. Session skapas, användare är inloggad
```

### 6.2 Dataflöde - Skapa ett Hopp

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌──────────┐
│ Browser │     │ Frontend│     │ Backend │     │ Database │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬─────┘
     │               │               │               │
     │ 1. Fyll i     │               │               │
     │   Jump Form   │               │               │
     │──────────────>│               │               │
     │               │               │               │
     │               │ 2. POST /api/jumps           │
     │               │   {jumpTime, airportId, ...} │
     │               │──────────────>│               │
     │               │               │               │
     │               │               │ 3. Validate   │
     │               │               │   input       │
     │               │               │               │
     │               │               │ 4. Create     │
     │               │               │   Jump entity │
     │               │               │               │
     │               │               │ 5. Save to DB │
     │               │               │──────────────>│
     │               │               │               │
     │               │               │    6. Return  │
     │               │               │       entity  │
     │               │               │<──────────────│
     │               │               │               │
     │               │ 7. 201 Created + Jump JSON   │
     │               │<──────────────│               │
     │               │               │               │
     │ 8. Update UI  │               │               │
     │<──────────────│               │               │
```

**Steg i detalj:**

1. **Frontend**: Användare fyller i formulär med jumpTime, airportId, altitude
2. **Frontend**: Validering på client-side (required fields, data types)
3. **Frontend**: POST request till `/api/jumps` med JSON body
4. **Backend Controller**: Tar emot request, validerar med Bean Validation
5. **Backend Service**: Affärslogik (t.ex. kontrollera att airportId existerar)
6. **Backend Repository**: JPA save operation
7. **Database**: Insert query, returnerar entity med genererat ID
8. **Backend**: Mappar entity till DTO och returnerar 201 Created
9. **Frontend**: Uppdaterar UI, visar success meddelande, redirect till lista

### 6.3 Läsa Data - Lista Personer

```
Browser → Frontend: Navigera till /persons
Frontend → API Client: fetchPersons()
API Client → Backend: GET /api/persons
Backend → Service: findAll()
Service → Repository: personRepository.findAll()
Repository → Database: SELECT * FROM persons
Database → Repository: List<Person>
Repository → Service: List<Person>
Service → Controller: List<Person>
Controller → API Client: 200 OK + JSON Array
API Client → Frontend: Person[]
Frontend → Browser: Render PersonList component
```

### 6.4 WebSocket (Framtida Funktion)

Spring Boot har WebSocket dependencies inkluderade (`spring-boot-starter-websocket`), vilket möjliggör framtida realtidsuppdateringar:

```
Potential WebSocket Flow:
1. Frontend subscribes to /topic/jumps
2. När ett hopp skapas/updateras → Backend emittar event
3. Alla connectade clients får update
4. Frontend uppdaterar UI i realtid utan refresh
```

### 6.5 Externa API:er

**Azure Key Vault:**
- Backend hämtar secrets (client secrets) och cryptographic keys
- Används vid applikationsstart och runtime
- Credential flow: Managed Identity → Key Vault → Secret/Key

**Azure Entra ID (Microsoft Graph - potentiell):**
- Backend kan anropa Graph API för att hämta user profile
- Verifiera gruppmedlemskap
- Läsa organisationsdata

---

## 7. Testning

### 7.1 Teststrategi

**Testpyramid:**
```
         ╱╲
        ╱E2E╲         (Few) - Manual + Playwright potential
       ╱──────╲
      ╱Integrat╲      (Some) - Spring @WebMvcTest, @DataJpaTest
     ╱──────────╲
    ╱   Unit     ╲    (Many) - JUnit, Vitest
   ╱──────────────╲
```

**Testnivåer:**

1. **Unit Tests**: Testa enskilda metoder/funktioner isolerat
2. **Integration Tests**: Testa samspel mellan lager (Controller ↔ Service ↔ Repository)
3. **End-to-End Tests**: Testa hela flödet från UI till databas (planerade)

### 7.2 Backend Testing

**Verktyg:**
- JUnit 5 (Jupiter)
- Spring Boot Test (`@SpringBootTest`, `@WebMvcTest`, `@DataJpaTest`)
- Mockito (mocking)
- AssertJ (assertions)

**Testtyper:**

**Domain Tests** (exempel `PersonTest.java`):
```java
@Test
void shouldCreatePersonWithValidData() {
    Person person = new Person("John", "Doe", "john@example.com");
    assertThat(person.getFirstName()).isEqualTo("John");
    assertThat(person.getLastName()).isEqualTo("Doe");
}
```

**Repository Tests** (`@DataJpaTest`):
```java
@DataJpaTest
class PersonRepositoryTest {
    @Test
    void shouldSaveAndFindPerson() {
        Person person = personRepository.save(new Person(...));
        Optional<Person> found = personRepository.findById(person.getId());
        assertThat(found).isPresent();
    }
}
```

**Service Tests** (med Mockito):
```java
@ExtendWith(MockitoExtension.class)
class PersonServiceTest {
    @Mock PersonRepository repository;
    @InjectMocks PersonService service;
    
    @Test
    void shouldCreatePerson() {
        when(repository.save(any())).thenReturn(person);
        Person result = service.create(input);
        verify(repository).save(any());
    }
}
```

**Controller Tests** (`@WebMvcTest`):
```java
@WebMvcTest(PersonController.class)
class PersonControllerTest {
    @Autowired MockMvc mockMvc;
    @MockBean PersonService service;
    
    @Test
    void shouldReturnPersons() throws Exception {
        mockMvc.perform(get("/api/persons"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }
}
```

### 7.3 Frontend Testing

**Verktyg:**
- Vitest (test runner)
- React Testing Library
- jsdom (DOM simulation)

**Testexempel:**

**API Client Tests** (`api.test.ts`):
```typescript
describe('Person API', () => {
  it('should fetch persons', async () => {
    const persons = await fetchPersons();
    expect(Array.isArray(persons)).toBe(true);
  });
  
  it('should create person', async () => {
    const input = { firstName: 'Jane', lastName: 'Doe' };
    const person = await createPerson(input);
    expect(person.id).toBeDefined();
  });
});
```

**Component Tests**:
```typescript
describe('PersonList', () => {
  it('renders person names', () => {
    render(<PersonList persons={mockPersons} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

### 7.4 Testresultat och Coverage

**Körning av tester:**

Backend:
```bash
./gradlew test
# Output: BUILD SUCCESSFUL, alla tester gröna
```

Frontend:
```bash
npm --prefix frontend test
# Output: Test suites passed, coverage report
```

**Test Coverage Mål:**
- Backend: >80% line coverage
- Frontend: >70% line coverage
- Kritiska flöden (authentication, data persistence): 100%

**CI Integration:**
Alla tester körs automatiskt i GitHub Actions pipeline vid:
- Push till any branch
- Pull request creation
- Pipeline failar om något test misslyckas

---

## 8. Deployment

### 8.1 Lokal Körning

**Backend:**
```bash
# Förutsättning: Java 21 installerat
./gradlew bootRun

# Alternativt med dev-profil
./gradlew bootRunDev

# Backend körs på http://localhost:8080
# H2 Console: http://localhost:8080/h2-console
# Health: http://localhost:8080/actuator/health
```

**Frontend:**
```bash
# Förutsättning: Node 20+ installerat
cd frontend
npm install
npm run dev

# Frontend körs på http://localhost:5173
# Vite dev server med hot-reload
```

**Med Docker Compose:**
```bash
# Starta alla tjänster (backend, frontend, proxy)
docker-compose up --build

# Frontend: http://localhost:80
# Backend API: http://localhost:80/api
```

### 8.2 CI/CD Pipeline

**GitHub Actions Workflow** (`.github/workflows/ci-cd.yml`):

**Trigger:**
- Push till alla branches
- Pull requests
- Manual workflow dispatch

**Jobs:**

**1. build-and-test:**
- Checkout kod
- Set up JDK 21
- Cache Gradle dependencies
- Kör `./gradlew clean test` (backend)
- Set up Node 20
- Kör `npm ci && npm test` (frontend)
- Bygger frontend med Vite
- Verifierar att inga `/api/api` paths finns (vanligt fel)

**2. frontend-docker-checks:**
- Bygger frontend Docker image lokalt
- Kör nginx syntax test (`nginx -t`)
- Verifierar image struktur

**3. publish-images** (endast main branch):
- Azure login via OIDC
- Resolve backend FQDN från Azure
- Bygger och pushar images till ACR/GHCR:
  - `slowfall:backend-latest`
  - `slowfall:frontend-latest`
  - `slowfall:proxy-latest`
- Konfigurerar App Service settings:
  - `SPRING_PROFILES_ACTIVE=prod|pseudo`
  - `ALLOWED_ORIGINS`
  - Key Vault settings
  - Pseudo auth credentials (om enabled)
- Deployer nya container images till Azure App Services

**Deployment till Azure App Services:**
```bash
# Förenklad version av vad CI gör
az webapp config container set \
  --name slowfall-backend \
  --resource-group slowfall-rg \
  --docker-custom-image-name acr.azurecr.io/slowfall:backend-latest

az webapp restart --name slowfall-backend --resource-group slowfall-rg
```

### 8.3 Miljövariabler

**Kritiska miljövariabler dokumenteras i `README_ENV.md`. Här är en sammanfattning:**

**GitHub Actions Secrets:**
- `AZURE_CLIENT_ID` - För OIDC login
- `AZURE_TENANT_ID` - Azure tenant
- `AZURE_SUBSCRIPTION_ID` - Azure subscription
- `AZURE_RG` - Resource group name
- `BACKEND_APP_NAME` - Backend App Service name
- `FRONTEND_APP_NAME` - Frontend App Service name
- `PROXY_APP_NAME` - Proxy App Service name (default: slowfall-proxy)
- `DEPLOY_ENV` - Environment (prod, dev)
- `AZ_KEYVAULT_VAULT_URL` - Key Vault URI
- `AZ_KEYVAULT_KEY_NAME` - Key name i Key Vault
- `ALLOWED_ORIGINS` - CORS allowed origins
- `SLOWFALL_WEB_USERS_GROUP_ID` - Azure AD group ID för access control

**App Service App Settings (Backend):**
- `SPRING_PROFILES_ACTIVE` - Spring profile (prod/dev/pseudo)
- `AZ_KEYVAULT_VAULT_URL` - Key Vault URI
- `AZ_KEYVAULT_KEY_NAME` - Key för JWT signing
- `ALLOWED_ORIGINS` - CORS config
- `APP_SECURITY_ALLOWED_GROUP_ID` - AD group för access
- `PORT` - Server port (8080)

**App Service App Settings (Frontend):**
- `VITE_API_BASE_URL` - Backend API URL (tom för relative paths)
- `VITE_MSAL_CLIENT_ID` - Azure AD app registration client ID
- `VITE_MSAL_AUTHORITY` - Azure AD authority URL
- `VITE_PSEUDO_AUTH` - Enable pseudo auth (true/false)
- `VITE_PSEUDO_USER`, `VITE_PSEUDO_PASS` - Pseudo auth credentials

**App Service App Settings (Proxy):**
- `BACKEND_HOST` - Backend FQDN
- `WEBSITES_PORT` - 80
- `CLIENT_MAX_BODY_SIZE` - Max request body size (20m)
- `PROXY_READ_TIMEOUT`, `PROXY_SEND_TIMEOUT` - Timeout settings

### 8.4 Azure Infrastructure

**Provisionerade resurser:**

1. **Resource Group**: `slowfall-appservice-prod`
2. **App Service Plan**: `slowfall-plan` (Linux, B1 eller högre)
3. **App Services**:
   - `slowfall-backend` (Backend container)
   - `slowfall-frontend` (Frontend container)
   - `slowfall-proxy` (nginx proxy container)
4. **Key Vault**: `slowfall-keyvault-next`
5. **Entra ID App Registrations**:
   - Backend API (Confidential client)
   - Frontend SPA (Public client)

**RBAC och Permissions:**
- Backend managed identity: `Key Vault Secrets User`, `Key Vault Crypto User`
- Proxy managed identity: `Key Vault Secrets User`
- Entra ID: Frontend har scope för att anropa backend API

**IaC (Infrastructure as Code):**
- Dokumenterat i `README_CLOUD.md`
- CLI-kommandon för manuell provisioning
- Kan automatiseras med Bicep/ARM templates eller Terraform (framtida)

### 8.5 Monitoring och Health Checks

**Spring Boot Actuator:**
- `/actuator/health` - Basic health check
- `/actuator/info` - Application info
- Kan utökas med metrics, prometheus endpoints

**Docker Health Checks:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1
```

**Azure Application Insights** (kan integreras):
- Distributed tracing
- Performance monitoring
- Exception tracking
- Custom metrics

**Logging:**
- Strukturerad JSON-logging via Logstash encoder
- Container logs streamar till Azure Log Analytics
- Query via Kusto Query Language (KQL)

---

## 9. Säkerhet

### 9.1 Autentisering och Auktorisering

- **Production**: Azure Entra ID OIDC (OAuth2 + OpenID Connect)
- **Development**: Pseudo/Basic Auth (endast för test)
- **Token Validation**: Backend validerar JWT tokens mot Azure
- **Group Membership**: Access control baserat på AAD group membership

### 9.2 Secrets Management

- **Azure Key Vault**: Centraliserad secrets storage
- **Managed Identity**: Backend använder MSI för att accessa Key Vault utan hardcoded credentials
- **No Secrets in Code**: Alla secrets injiceras via miljövariabler eller Key Vault references

### 9.3 Network Security

- **HTTPS**: TLS termination på nginx proxy
- **CORS**: Konfigurerad för att endast tillåta specifierade origins
- **Headers**: Security headers (X-Frame-Options, X-Content-Type-Options, etc.) sätts av proxy

### 9.4 Dependency Security

- **Dependabot**: GitHub Dependabot skannar för sårbara dependencies
- **Renovate**: Kan konfigureras för automatiska dependency updates
- **Gradle Versions Plugin**: Håller koll på outdated dependencies

---

## 10. Framtida Förbättringar

### 10.1 Planerade Features

1. **Databas för Produktion**
   - Migrera från H2 till PostgreSQL eller Azure SQL
   - Flyway/Liquibase för database migrations

2. **Realtidsuppdateringar**
   - WebSocket implementation för live jump updates
   - Push notifications för nya hopp

3. **Rapporter och Analytics**
   - Jump statistics dashboard
   - Pilot logbook
   - Export till PDF

4. **Mobil App**
   - React Native eller PWA
   - Offline support

### 10.2 Tekniska Förbättringar

1. **Microservices**
   - Splitta monoliten om projektet växer
   - Service mesh (Istio/Linkerd)

2. **Caching**
   - Redis för session storage
   - Cache frequently accessed data

3. **Search**
   - Elasticsearch för advanced search
   - Full-text search i jump descriptions

4. **Message Queue**
   - RabbitMQ/Azure Service Bus
   - Async processing av heavy operations

---

## 11. Kontakt och Support

**Repository**: https://github.com/Soda-xyz/slowfall

**Dokumentation:**
- `README.md` - Allmän översikt
- `README_CLOUD.md` - Cloud deployment guide
- `README_ENV.md` - Environment variables reference
- `TEKNISK_DOKUMENTATION.md` - Denna fil

**Utvecklingsteam:**
- Se GitHub contributors för current maintainers

**Issue Tracking:**
- GitHub Issues för bug reports och feature requests
- Pull requests välkomnas!

---

*Dokumentationen uppdaterad: 2025-12-06*
*Version: 1.0*
