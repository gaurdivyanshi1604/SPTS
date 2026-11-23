
FROM eclipse-temurin:26-jdk

WORKDIR /app

COPY Backend.java .
COPY data.json .
COPY index.html .
COPY app.js .

RUN javac Backend.java

EXPOSE 8080

CMD ["java", "Backend"]
