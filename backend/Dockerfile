# Stage 1: Build the JAR
FROM maven:3.9.15-eclipse-temurin-26 AS build
WORKDIR /app

# 1. Copy ONLY the pom.xml first
COPY pom.xml .

# 2. Download all dependencies offline. 
# This layer stays cached until you edit the pom.xml!
RUN mvn dependency:go-offline

# 3. Now copy the source code
COPY src ./src

# 4. Build the JAR (using the already cached dependencies)
RUN mvn clean package -DskipTests

# Stage 2: Run the JAR
FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]